import type { I18n } from "@lingui/core";

export function createSkillLabels(i18n: I18n) {
  return {
    error: {
      retry: i18n._({ id: "common.tryAgain", message: "Try again" }),
      signIn: i18n._({ id: "auth.login.again", message: "Sign in again" }),
      manageAccess: i18n._({
        id: "skillLibraries.actions.manageGithubAccess",
        message: "Manage GitHub access",
      }),
    },
    filters: {
      title: i18n._({ id: "skills.filters.title", message: "Filters" }),
      all: i18n._({ id: "skills.filters.all", message: "All" }),
    },
    list: {
      title: i18n._({ id: "skills.list.title", message: "Skills" }),
      rootDirectory: i18n._({ id: "skills.list.rootDirectory", message: "Root" }),
      search: i18n._({
        id: "skills.search.githubPlaceholder",
        message: "Search SKILL.md content",
      }),
      rescan: i18n._({ id: "skills.actions.rescan", message: "Rescan" }),
      invalidMetadata: i18n._({ id: "skills.invalidMetadata", message: "Invalid metadata" }),
      empty: i18n._({
        id: "skills.list.empty",
        message: "No skills were found in this directory.",
      }),
      noMatches: i18n._({ id: "skills.list.noMatches", message: "No skills match your search." }),
      noMatchesDescription: i18n._({
        id: "skills.list.noMatches.githubDescription",
        message: "GitHub search may take time to index recent changes.",
      }),
      clearSearch: i18n._({ id: "skills.actions.clearSearch", message: "Clear search" }),
      previous: i18n._({ id: "common.previous", message: "Previous" }),
      next: i18n._({ id: "common.next", message: "Next" }),
      incomplete: i18n._({
        id: "skills.search.incomplete",
        message: "GitHub returned incomplete search results.",
      }),
    },
    detail: {
      title: i18n._({ id: "skills.detail.title", message: "Skill detail" }),
      empty: i18n._({
        id: "skills.detail.empty",
        message: "Select a skill to view its metadata and SKILL.md source.",
      }),
      emptyTitle: i18n._({ id: "skills.detail.emptyTitle", message: "No skill selected" }),
      description: i18n._({ id: "skills.detail.description", message: "Description" }),
      path: i18n._({ id: "skills.detail.githubPath", message: "GitHub path" }),
      sourcePreview: i18n._({ id: "skills.detail.sourcePreview", message: "SKILL.md preview" }),
      invalidMetadata: i18n._({ id: "skills.invalidMetadata", message: "Invalid metadata" }),
      diagnostics: i18n._({ id: "skills.detail.diagnostics", message: "Diagnostics" }),
      noDescription: i18n._({
        id: "skills.detail.noDescription",
        message: "No description available.",
      }),
      unreadableSource: i18n._({
        id: "skills.detail.unreadableSource",
        message: "SKILL.md could not be read.",
      }),
    },
    close: i18n._({ id: "common.close", message: "Close" }),
  };
}
