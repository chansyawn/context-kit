import {
  createSkillLibraryError,
  skillLibraryErrorCodes,
} from "@/domain/skill-libraries/error-codes";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "./auth.server";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthenticationRequiredError";
  }
}

export function getRequestSession() {
  return auth.api.getSession({ headers: getRequestHeaders() });
}

export async function requireSession() {
  const session = await getRequestSession();

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  return session;
}

export async function requireGithubAccessToken(): Promise<string> {
  try {
    await requireSession();

    const token = await auth.api.getAccessToken({
      body: { providerId: "github" },
      headers: getRequestHeaders(),
    });

    return token.accessToken;
  } catch {
    throw createSkillLibraryError(skillLibraryErrorCodes.authenticationRequired);
  }
}
