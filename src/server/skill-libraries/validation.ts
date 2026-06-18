import type { CreateSkillLibraryInput } from "@/domain/skill-libraries/types";

const MAX_LIBRARY_NAME_LENGTH = 80;
const MAX_REPOSITORY_PATH_LENGTH = 1_024;
const MAX_SEARCH_QUERY_LENGTH = 100;

export function normalizeRepositoryPath(path: string): string {
  const normalized = path
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");

  if (normalized.length > MAX_REPOSITORY_PATH_LENGTH) {
    throw new Error("Repository path is too long.");
  }

  if (normalized.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new Error("Repository path contains an invalid segment.");
  }

  return normalized;
}

export function validateLibraryName(name: string): string {
  const trimmedName = name.trim();

  if (trimmedName === "") {
    throw new Error("Skill library name is required.");
  }

  if (trimmedName.length > MAX_LIBRARY_NAME_LENGTH) {
    throw new Error(`Skill library name must not exceed ${MAX_LIBRARY_NAME_LENGTH} characters.`);
  }

  return trimmedName;
}

export function validateRepositoryId(repositoryId: string): string {
  const normalized = repositoryId.trim();
  const numericId = Number(normalized);

  if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("Repository ID is invalid.");
  }

  return normalized;
}

export function validatePage(page: number): number {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer.");
  }

  return page;
}

export function validateSearchQuery(query: string | undefined): string {
  const normalized = query?.trim() ?? "";

  if (normalized !== "" && normalized.length < 2) {
    throw new Error("Search query must contain at least 2 characters.");
  }

  if (normalized.length > MAX_SEARCH_QUERY_LENGTH) {
    throw new Error(`Search query must not exceed ${MAX_SEARCH_QUERY_LENGTH} characters.`);
  }

  return normalized;
}

export function parseCreateLibraryInput(input: unknown): CreateSkillLibraryInput {
  const record = readRecord(input);

  return {
    name: validateLibraryName(readString(record, "name")),
    repositoryId: validateRepositoryId(readString(record, "repositoryId")),
    path: normalizeRepositoryPath(readString(record, "path")),
  };
}

export function parseIdInput(input: unknown): { libraryId: string } {
  const record = readRecord(input);
  const libraryId = readString(record, "libraryId").trim();

  if (libraryId === "") {
    throw new Error("Skill library ID is required.");
  }

  return { libraryId };
}

export function parseRenameInput(input: unknown): { libraryId: string; name: string } {
  const { libraryId } = parseIdInput(input);
  const record = readRecord(input);

  return { libraryId, name: validateLibraryName(readString(record, "name")) };
}

export function parseRepositoryPageInput(input: unknown): { installationId: string; page: number } {
  const record = readRecord(input);
  const installationId = validateRepositoryId(readString(record, "installationId"));

  return { installationId, page: validatePage(readNumber(record, "page")) };
}

export function parseDirectoryInput(input: unknown): { repositoryId: string; path: string } {
  const record = readRecord(input);

  return {
    repositoryId: validateRepositoryId(readString(record, "repositoryId")),
    path: normalizeRepositoryPath(readString(record, "path")),
  };
}

export function parseSkillPageInput(input: unknown): {
  libraryId: string;
  page: number;
  query: string;
} {
  const record = readRecord(input);
  const { libraryId } = parseIdInput(input);
  const query = typeof record.query === "string" ? record.query : undefined;

  return {
    libraryId,
    page: validatePage(readNumber(record, "page")),
    query: validateSearchQuery(query),
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Input must be an object.");
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  if (typeof value !== "number") {
    throw new Error(`${key} must be a number.`);
  }

  return value;
}
