import {
  createSkillLibraryError,
  parseGithubOAuthErrorCode,
  readSkillLibraryErrorCode,
  skillLibraryErrorCodes,
  type GithubOAuthErrorCode,
} from "@/domain/skill-libraries/error-codes";

export function formatGithubError(error: unknown): Error {
  const existingCode = readSkillLibraryErrorCode(error);

  if (existingCode) {
    return createSkillLibraryError(existingCode);
  }

  const status = readStatus(error);

  if (status === 401) {
    return createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }

  if (status === 429 || (status === 403 && isRateLimited(error))) {
    return createSkillLibraryError(skillLibraryErrorCodes.githubRateLimited);
  }

  if (status === 403) {
    return createSkillLibraryError(skillLibraryErrorCodes.githubAuthorizationRequired);
  }

  if (status === 404) {
    return createSkillLibraryError(skillLibraryErrorCodes.githubResourceUnavailable);
  }

  if (status === 422) {
    return createSkillLibraryError(skillLibraryErrorCodes.githubRequestInvalid);
  }

  return createSkillLibraryError(skillLibraryErrorCodes.githubUnavailable);
}

export function getGithubOAuthErrorCode(error: unknown): GithubOAuthErrorCode {
  const existingCode = parseGithubOAuthErrorCode(readSkillLibraryErrorCode(error));

  if (existingCode) {
    return existingCode;
  }

  return readStatus(error) === 400
    ? skillLibraryErrorCodes.githubAuthorizationFailed
    : skillLibraryErrorCodes.githubUnavailable;
}

function readStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  const { status } = error;

  return typeof status === "number" ? status : null;
}

function isRateLimited(error: unknown): boolean {
  const remaining = readResponseHeader(error, "x-ratelimit-remaining");
  const retryAfter = readResponseHeader(error, "retry-after");
  const message = readMessage(error)?.toLowerCase() ?? "";

  return remaining === "0" || retryAfter !== null || message.includes("secondary rate limit");
}

function readResponseHeader(error: unknown, name: string): string | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error) ||
    typeof error.response !== "object" ||
    error.response === null ||
    !("headers" in error.response) ||
    typeof error.response.headers !== "object" ||
    error.response.headers === null
  ) {
    return null;
  }

  const value = (error.response.headers as Record<string, unknown>)[name];

  return typeof value === "string" ? value : null;
}

function readMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }

  return typeof error.message === "string" ? error.message : null;
}
