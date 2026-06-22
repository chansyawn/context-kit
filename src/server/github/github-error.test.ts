import { describe, expect, it } from "vite-plus/test";

import { skillLibraryErrorCodes } from "@/domain/skill-libraries/error-codes";

import { formatGithubError, getGithubOAuthErrorCode } from "./github-error";

describe("GitHub error mapping", () => {
  it.each([
    [401, skillLibraryErrorCodes.githubAuthorizationRequired],
    [403, skillLibraryErrorCodes.githubAuthorizationRequired],
    [404, skillLibraryErrorCodes.githubResourceUnavailable],
    [422, skillLibraryErrorCodes.githubRequestInvalid],
  ])("maps status %s without exposing the upstream response", (status, expected) => {
    expect(formatGithubError({ status, message: "sensitive upstream response" }).message).toBe(
      expected,
    );
  });

  it.each([
    { status: 429 },
    { status: 403, response: { headers: { "x-ratelimit-remaining": "0" } } },
    { status: 403, response: { headers: { "retry-after": "30" } } },
    { status: 403, message: "You have exceeded a secondary rate limit." },
  ])("maps rate limit response %#", (error) => {
    expect(formatGithubError(error).message).toBe(skillLibraryErrorCodes.githubRateLimited);
  });

  it.each([
    [
      new Error(skillLibraryErrorCodes.githubConfigurationInvalid),
      skillLibraryErrorCodes.githubConfigurationInvalid,
    ],
    [{ status: 400 }, skillLibraryErrorCodes.githubAuthorizationFailed],
    [{ status: 502 }, skillLibraryErrorCodes.githubUnavailable],
    [new Error("unexpected"), skillLibraryErrorCodes.githubUnavailable],
  ])("maps OAuth callback error %# to %s", (error, expected) => {
    expect(getGithubOAuthErrorCode(error)).toBe(expected);
  });
});
