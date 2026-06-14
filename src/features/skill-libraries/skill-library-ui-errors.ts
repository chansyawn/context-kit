import type { MessageDescriptor } from "@lingui/core";

type SkillLibraryI18n = {
  _: (descriptor: MessageDescriptor) => string;
};

export function formatSkillLibraryUiError(error: unknown, i18n: SkillLibraryI18n) {
  if (error instanceof Error) {
    switch (error.message) {
      case "Skill library name is required.":
        return i18n._({
          id: "skillLibraries.error.nameRequired",
          message: "Skill library name is required.",
        });
      case "Skill library name must be unique.":
        return i18n._({
          id: "skillLibraries.error.nameUnique",
          message: "Skill library name must be unique.",
        });
      case "This skills directory has already been added.":
        return i18n._({
          id: "skillLibraries.error.directoryUnique",
          message: "This skills directory has already been added.",
        });
      case "IndexedDB is not available in this browser.":
        return i18n._({
          id: "skillLibraries.error.indexedDbUnavailable",
          message: "This browser cannot persist skill library records.",
        });
      case "File System Access API is not supported in this browser.":
        return i18n._({
          id: "skills.error.unsupported",
          message: "This browser does not support selecting local directories.",
        });
      case "Skill library was not found.":
        return i18n._({
          id: "skillLibraries.error.notFound",
          message: "Skill library was not found.",
        });
    }
  }

  return `${i18n._({
    id: "skillLibraries.error.generic",
    message: "Unable to save skill library.",
  })} ${formatUnknownError(error)}`.trim();
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "";
}
