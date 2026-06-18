export const skillLibraryErrorCodes = {
  authenticationRequired: "skill-library.authentication-required",
  githubAuthorizationRequired: "skill-library.github-authorization-required",
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

const knownErrorCodes = new Set<SkillLibraryErrorCode>(Object.values(skillLibraryErrorCodes));

export function createSkillLibraryError(code: SkillLibraryErrorCode): Error {
  return new Error(code);
}

export function readSkillLibraryErrorCode(error: unknown): SkillLibraryErrorCode | null {
  const message = readErrorMessage(error);

  return message && knownErrorCodes.has(message as SkillLibraryErrorCode)
    ? (message as SkillLibraryErrorCode)
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
