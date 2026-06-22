export const skillLibraryErrorCodes = {
  authenticationRequired: "skill-library.authentication-required",
  githubAuthorizationFailed: "skill-library.github-authorization-failed",
  githubAuthorizationRequired: "skill-library.github-authorization-required",
  githubConfigurationInvalid: "skill-library.github-configuration-invalid",
  githubRateLimited: "skill-library.github-rate-limited",
  githubResourceUnavailable: "skill-library.github-resource-unavailable",
  githubRequestInvalid: "skill-library.github-request-invalid",
  githubUnavailable: "skill-library.github-unavailable",
  libraryAlreadyExists: "skill-library.already-exists",
  libraryCreateFailed: "skill-library.create-failed",
  libraryNotFound: "skill-library.not-found",
} as const;

export type SkillLibraryErrorCode =
  (typeof skillLibraryErrorCodes)[keyof typeof skillLibraryErrorCodes];

const githubOAuthErrorCodes = [
  skillLibraryErrorCodes.githubAuthorizationFailed,
  skillLibraryErrorCodes.githubConfigurationInvalid,
  skillLibraryErrorCodes.githubUnavailable,
] as const;

export type GithubOAuthErrorCode = (typeof githubOAuthErrorCodes)[number];

const knownErrorCodes = new Set<SkillLibraryErrorCode>(Object.values(skillLibraryErrorCodes));
const knownGithubOAuthErrorCodes = new Set<GithubOAuthErrorCode>(githubOAuthErrorCodes);

export function createSkillLibraryError(code: SkillLibraryErrorCode): Error {
  return new Error(code);
}

export function readSkillLibraryErrorCode(error: unknown): SkillLibraryErrorCode | null {
  const message = readErrorMessage(error);

  return message && knownErrorCodes.has(message as SkillLibraryErrorCode)
    ? (message as SkillLibraryErrorCode)
    : null;
}

export function parseGithubOAuthErrorCode(value: unknown): GithubOAuthErrorCode | null {
  return typeof value === "string" && knownGithubOAuthErrorCodes.has(value as GithubOAuthErrorCode)
    ? (value as GithubOAuthErrorCode)
    : null;
}

function readErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }

  return typeof error.message === "string" ? error.message : null;
}
