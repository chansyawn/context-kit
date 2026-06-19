import {
  createSkillLibraryError,
  skillLibraryErrorCodes,
} from "@/domain/skill-libraries/error-codes";
import { getRequestSession, requireClerkUserId } from "@/server/auth/session.server";
import { db } from "@/db/client";
import { githubUserAuthorizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

import { decryptToken, encryptToken } from "./token-crypto";

const githubAuthorizeUrl = "https://github.com/login/oauth/authorize";
const githubTokenUrl = "https://github.com/login/oauth/access_token";
const githubUserUrl = "https://api.github.com/user";
const oauthCookieName = "context-kit.github-oauth";
const oauthCookieMaxAgeSeconds = 10 * 60;
const tokenRefreshSkewMs = 5 * 60 * 1000;

type GithubOAuthCookie = {
  state: string;
  verifier: string;
  returnTo: string;
};

type GithubTokenResponse = {
  accessToken: string;
  expiresAt: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
};

type GithubUserProfile = {
  id: string;
  login: string;
  avatarUrl: string | null;
};

type GithubAuthorizationRow = typeof githubUserAuthorizations.$inferSelect;

export function getGithubAuthorizationUrl(): string {
  return "/api/github/authorize";
}

export async function startGithubAuthorization(request: Request): Promise<Response> {
  const session = await getRequestSession();

  if (!session) {
    return createRedirectResponse(new URL("/sign-in", request.url), {});
  }

  const state = createRandomToken();
  const verifier = createRandomToken();
  const url = new URL(githubAuthorizeUrl);
  const redirectUri = getGithubCallbackUrl(request);

  url.searchParams.set("client_id", env.GITHUB_APP_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await createCodeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");

  return createRedirectResponse(url, {
    "Set-Cookie": serializeCookie(request, oauthCookieName, {
      state,
      verifier,
      returnTo: readReturnTo(request),
    }),
  });
}

export async function completeGithubAuthorization(request: Request): Promise<Response> {
  const session = await getRequestSession();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = readOAuthCookie(request);

  if (!session) {
    return createRedirectResponse(new URL("/sign-in", request.url), {
      "Set-Cookie": clearCookie(request, oauthCookieName),
    });
  }

  if (!code || !state || !cookie || state !== cookie.state) {
    return new Response("GitHub authorization request is invalid.", {
      headers: { "Set-Cookie": clearCookie(request, oauthCookieName) },
      status: 400,
    });
  }

  const token = await exchangeCodeForToken(code, cookie.verifier, getGithubCallbackUrl(request));
  const profile = await fetchGithubUserProfile(token.accessToken);
  const now = new Date();
  const encryptedAccessToken = await encryptGithubToken(token.accessToken);
  const encryptedRefreshToken = token.refreshToken
    ? await encryptGithubToken(token.refreshToken)
    : null;

  await db
    .insert(githubUserAuthorizations)
    .values({
      clerkUserId: session.userId,
      githubUserId: profile.id,
      githubLogin: profile.login,
      githubAvatarUrl: profile.avatarUrl,
      encryptedAccessToken,
      accessTokenExpiresAt: token.expiresAt,
      encryptedRefreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: githubUserAuthorizations.clerkUserId,
      set: {
        githubUserId: profile.id,
        githubLogin: profile.login,
        githubAvatarUrl: profile.avatarUrl,
        encryptedAccessToken,
        accessTokenExpiresAt: token.expiresAt,
        encryptedRefreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        updatedAt: now,
      },
    });

  return createRedirectResponse(new URL(cookie.returnTo, request.url), {
    "Set-Cookie": clearCookie(request, oauthCookieName),
  });
}

export async function getGithubAccessToken(): Promise<string> {
  const clerkUserId = await requireClerkUserId();
  const [authorization] = await db
    .select()
    .from(githubUserAuthorizations)
    .where(eq(githubUserAuthorizations.clerkUserId, clerkUserId))
    .limit(1);

  if (!authorization) {
    throw createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }

  try {
    if (isAccessTokenFresh(authorization)) {
      return await decryptGithubToken(authorization.encryptedAccessToken);
    }

    return await refreshGithubAccessToken(authorization);
  } catch {
    await deleteGithubAuthorization(authorization.clerkUserId);
    throw createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }
}

async function refreshGithubAccessToken(authorization: GithubAuthorizationRow): Promise<string> {
  if (
    !authorization.encryptedRefreshToken ||
    isExpired(authorization.refreshTokenExpiresAt, tokenRefreshSkewMs)
  ) {
    await deleteGithubAuthorization(authorization.clerkUserId);
    throw createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }

  try {
    const token = await requestGithubToken({
      grant_type: "refresh_token",
      refresh_token: await decryptGithubToken(authorization.encryptedRefreshToken),
    });
    const now = new Date();

    await db
      .update(githubUserAuthorizations)
      .set({
        encryptedAccessToken: await encryptGithubToken(token.accessToken),
        accessTokenExpiresAt: token.expiresAt,
        encryptedRefreshToken: token.refreshToken
          ? await encryptGithubToken(token.refreshToken)
          : null,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        updatedAt: now,
      })
      .where(eq(githubUserAuthorizations.clerkUserId, authorization.clerkUserId));

    return token.accessToken;
  } catch {
    await deleteGithubAuthorization(authorization.clerkUserId);
    throw createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }
}

async function deleteGithubAuthorization(clerkUserId: string): Promise<void> {
  await db
    .delete(githubUserAuthorizations)
    .where(eq(githubUserAuthorizations.clerkUserId, clerkUserId));
}

async function exchangeCodeForToken(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<GithubTokenResponse> {
  return requestGithubToken({
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
}

async function requestGithubToken(values: Record<string, string>): Promise<GithubTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.GITHUB_APP_CLIENT_ID,
    client_secret: env.GITHUB_APP_CLIENT_SECRET,
    ...values,
  });
  const response = await fetch(githubTokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await readJson(response);

  if (isGithubOAuthError(data)) {
    throw Object.assign(new Error(data.error_description ?? data.error), {
      status: response.status,
    });
  }

  if (!response.ok || !isGithubTokenResponse(data)) {
    throw Object.assign(new Error("GitHub token exchange failed."), { status: response.status });
  }

  return {
    accessToken: data.access_token,
    expiresAt: secondsFromNow(data.expires_in),
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : null,
    refreshTokenExpiresAt: secondsFromNow(data.refresh_token_expires_in),
  };
}

async function fetchGithubUserProfile(accessToken: string): Promise<GithubUserProfile> {
  const response = await fetch(githubUserUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });
  const data = await readJson(response);

  if (!response.ok || !isGithubUserProfile(data)) {
    throw Object.assign(new Error("GitHub user profile request failed."), {
      status: response.status,
    });
  }

  return {
    id: String(data.id),
    login: data.login,
    avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : null,
  };
}

async function encryptGithubToken(token: string): Promise<string> {
  return encryptToken(token, env.GITHUB_TOKEN_ENCRYPTION_KEY);
}

async function decryptGithubToken(token: string): Promise<string> {
  return decryptToken(token, env.GITHUB_TOKEN_ENCRYPTION_KEY);
}

function getGithubCallbackUrl(request: Request): string {
  return new URL("/api/github/callback", request.url).toString();
}

function isAccessTokenFresh(authorization: GithubAuthorizationRow): boolean {
  return !isExpired(authorization.accessTokenExpiresAt, tokenRefreshSkewMs);
}

function isExpired(expiresAt: Date | null, skewMs: number): boolean {
  return expiresAt !== null && expiresAt.getTime() <= Date.now() + skewMs;
}

function secondsFromNow(seconds: unknown): Date | null {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? new Date(Date.now() + seconds * 1000)
    : null;
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));

  return encodeBase64Url(new Uint8Array(digest));
}

function createRandomToken(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function isGithubTokenResponse(value: unknown): value is {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
} {
  return isRecord(value) && typeof value.access_token === "string";
}

function isGithubOAuthError(value: unknown): value is {
  error: string;
  error_description?: string;
} {
  return isRecord(value) && typeof value.error === "string";
}

function isGithubUserProfile(value: unknown): value is {
  id: number;
  login: string;
  avatar_url?: string | null;
} {
  return isRecord(value) && typeof value.id === "number" && typeof value.login === "string";
}

function readOAuthCookie(request: Request): GithubOAuthCookie | null {
  const value = readCookie(request, oauthCookieName);

  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));

    if (
      isRecord(parsed) &&
      typeof parsed.state === "string" &&
      typeof parsed.verifier === "string" &&
      typeof parsed.returnTo === "string"
    ) {
      return {
        state: parsed.state,
        verifier: parsed.verifier,
        returnTo: parsed.returnTo,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");

    if (key === name) {
      return value.join("=");
    }
  }

  return null;
}

function serializeCookie(request: Request, name: string, value: GithubOAuthCookie): string {
  const parts = [
    `${name}=${encodeURIComponent(JSON.stringify(value))}`,
    "HttpOnly",
    "Path=/api/github/callback",
    "SameSite=Lax",
    `Max-Age=${oauthCookieMaxAgeSeconds}`,
  ];

  if (isSecureRequest(request)) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function clearCookie(request: Request, name: string): string {
  const parts = [`${name}=`, "HttpOnly", "Path=/api/github/callback", "SameSite=Lax", "Max-Age=0"];

  if (isSecureRequest(request)) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

function readReturnTo(request: Request): string {
  const value = new URL(request.url).searchParams.get("returnTo");

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/skill-libraries";
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createRedirectResponse(url: URL, headers: HeadersInit): Response {
  const responseHeaders = new Headers({ Location: url.toString() });
  const extraHeaders = new Headers(headers);

  extraHeaders.forEach((value, key) => responseHeaders.append(key, value));

  return new Response(null, {
    headers: responseHeaders,
    status: 302,
  });
}
