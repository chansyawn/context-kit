import type { SkillDiagnostic } from "@/features/skills/skill-types";

export type InstallationSummary = {
  id: string;
  accountLogin: string;
  accountAvatarUrl: string | null;
  targetType: "User" | "Organization";
  repositorySelection: "all" | "selected";
};

export type RepositorySummary = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
};

export type DirectorySummary = {
  name: string;
  path: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export type SkillLibrary = {
  id: string;
  name: string;
  repositoryId: string;
  repositoryOwner: string;
  repositoryName: string;
  path: string;
  rootName: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSkillLibraryInput = {
  name: string;
  repositoryId: string;
  path: string;
};

export type SkillPreview = {
  id: string;
  directoryName: string;
  rootName: string;
  relativePath: string;
  skillFilePath: string;
  source: string;
  body: string;
  metadata: {
    name: string;
    description: string;
    valid: boolean;
    diagnostics: SkillDiagnostic[];
  };
};

export type SkillPage = Page<SkillPreview> & {
  revision: string;
  mode: "browse" | "search";
  incompleteResults: boolean;
};
