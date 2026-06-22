import {
  readSkillLibraryErrorCode,
  skillLibraryErrorCodes,
} from "@/domain/skill-libraries/error-codes";
import type { I18n } from "@lingui/core";

export type SkillLibraryErrorAction = "connect-github" | "login" | "manage-access" | "retry";

export function getSkillLibraryErrorAction(error: unknown): SkillLibraryErrorAction | null {
  const code = readSkillLibraryErrorCode(error);

  if (code === skillLibraryErrorCodes.authenticationRequired) {
    return "login";
  }

  if (
    code === skillLibraryErrorCodes.githubAuthorizationFailed ||
    code === skillLibraryErrorCodes.githubAuthorizationRequired ||
    code === skillLibraryErrorCodes.githubUnavailable
  ) {
    return "connect-github";
  }

  if (code === skillLibraryErrorCodes.githubConfigurationInvalid) {
    return null;
  }

  if (code === skillLibraryErrorCodes.githubResourceUnavailable) {
    return "manage-access";
  }

  return "retry";
}

export function formatSkillLibraryError(error: unknown, i18n: I18n): string {
  switch (readSkillLibraryErrorCode(error)) {
    case skillLibraryErrorCodes.authenticationRequired:
      return i18n._({
        id: "skillLibraries.error.authenticationRequired",
        message: "Your session has expired. Sign in again.",
      });
    case skillLibraryErrorCodes.githubAuthorizationRequired:
      return i18n._({
        id: "skillLibraries.error.githubAuthorizationRequired",
        message: "Connect your GitHub account to access GitHub App installations.",
      });
    case skillLibraryErrorCodes.githubAuthorizationFailed:
      return i18n._({
        id: "skillLibraries.error.githubAuthorizationFailed",
        message: "GitHub authorization failed or expired. Connect GitHub again.",
      });
    case skillLibraryErrorCodes.githubConfigurationInvalid:
      return i18n._({
        id: "skillLibraries.error.githubConfigurationInvalid",
        message: "The GitHub integration is not configured correctly.",
      });
    case skillLibraryErrorCodes.githubRateLimited:
      return i18n._({
        id: "skillLibraries.error.githubRateLimited",
        message: "GitHub's API rate limit was reached. Try again later.",
      });
    case skillLibraryErrorCodes.githubResourceUnavailable:
      return i18n._({
        id: "skillLibraries.error.githubResourceUnavailable",
        message: "The repository or directory moved, was removed, or is no longer authorized.",
      });
    case skillLibraryErrorCodes.githubRequestInvalid:
      return i18n._({
        id: "skillLibraries.error.githubRequestInvalid",
        message: "GitHub rejected this repository request.",
      });
    case skillLibraryErrorCodes.githubUnavailable:
      return i18n._({
        id: "skillLibraries.error.githubUnavailable",
        message: "GitHub data is temporarily unavailable.",
      });
    case skillLibraryErrorCodes.libraryAlreadyExists:
      return i18n._({
        id: "skillLibraries.error.alreadyExists",
        message: "This repository directory has already been added.",
      });
    case skillLibraryErrorCodes.libraryCreateFailed:
      return i18n._({
        id: "skillLibraries.error.createFailed",
        message: "Unable to create the skill library.",
      });
    case skillLibraryErrorCodes.libraryNotFound:
      return i18n._({
        id: "skillLibraries.error.notFound",
        message: "The skill library was not found.",
      });
    default:
      return i18n._({
        id: "skillLibraries.error.unknown",
        message: "Unable to load skill library data.",
      });
  }
}
