import { describe, expect, it } from "vite-plus/test";

import { parseGithubOAuthErrorCode, skillLibraryErrorCodes } from "./error-codes";

describe("GitHub OAuth error codes", () => {
  it.each([
    skillLibraryErrorCodes.githubAuthorizationFailed,
    skillLibraryErrorCodes.githubConfigurationInvalid,
    skillLibraryErrorCodes.githubUnavailable,
  ])("accepts supported URL error code %s", (code) => {
    expect(parseGithubOAuthErrorCode(code)).toBe(code);
  });

  it.each([undefined, "", "skill-library.authentication-required", "skill-library.github-unknown"])(
    "rejects unsupported URL error code %#",
    (code) => {
      expect(parseGithubOAuthErrorCode(code)).toBeNull();
    },
  );
});
