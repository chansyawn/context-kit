export type SkillReference = {
  directoryName: string;
  path: string;
  sha: string;
};

export type SkillBlobMetadata = {
  byteSize: number;
  isBinary: boolean;
};

export function readDirectSkillReferences(
  tree: Array<{ path?: string; sha?: string | null; type?: string }>,
): SkillReference[] {
  return tree.flatMap((entry) => {
    if (entry.type !== "blob" || !entry.path || !entry.sha) {
      return [];
    }

    const match = /^([^/]+)\/SKILL\.md$/.exec(entry.path);

    return match ? [{ directoryName: match[1] ?? "", path: entry.path, sha: entry.sha }] : [];
  });
}

export function paginateSkillReferences(
  references: SkillReference[],
  page: number,
  pageSize: number,
): { references: SkillReference[]; total: number } {
  const sortedReferences = [...references].sort((left, right) =>
    left.directoryName.localeCompare(right.directoryName),
  );
  const offset = (page - 1) * pageSize;

  return {
    references: sortedReferences.slice(offset, offset + pageSize),
    total: sortedReferences.length,
  };
}

export function createSkillPathPattern(libraryPath: string): string {
  const prefix = libraryPath === "" ? "" : `${escapeRegex(libraryPath)}\\/`;

  return `^${prefix}[^\\/]+\\/SKILL\\.md$`;
}

export function createCodeSearchQuery(
  repositoryFullName: string,
  libraryPath: string,
  query: string,
): string {
  const searchTerm = `"${query.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

  return `${searchTerm} repo:${repositoryFullName} path:/${createSkillPathPattern(libraryPath)}/`;
}

export function isReadableSkillBlob(metadata: SkillBlobMetadata, maxByteSize: number): boolean {
  return !metadata.isBinary && metadata.byteSize <= maxByteSize;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}
