import type { SkillLibrary, SkillPage, SkillPreview } from "@/domain/skill-libraries/types";
import { parseSkillMarkdown } from "@/domain/skills/parse-skill";
import type { Octokit } from "octokit";

import { createUserOctokit } from "./client.server";
import { formatGithubError } from "./github-error";
import {
  getRepositoryContext,
  resolveTreeSha,
  type RepositoryContext,
} from "./repositories.server";

const SKILLS_PAGE_SIZE = 20;
const MAX_SKILL_FILE_SIZE = 1024 * 1024;

type SkillReference = {
  directoryName: string;
  path: string;
  sha: string;
};

type BlobData = {
  oid: string;
  byteSize: number;
  isBinary: boolean;
  text: string | null;
};

export async function getSkillPage(
  library: SkillLibrary,
  page: number,
  query: string,
): Promise<SkillPage> {
  const octokit = await createUserOctokit();

  try {
    const repository = await getRepositoryContext(octokit, library.repositoryId);
    const result =
      query === ""
        ? await getBrowseReferences(octokit, repository, library.path, page)
        : await getSearchReferences(octokit, repository, library.path, query, page);
    const sources = await readBlobSources(octokit, repository, result.references);

    return {
      items: result.references.map((reference) =>
        createSkill(library, reference, sources.get(reference.sha) ?? null),
      ),
      page,
      pageSize: SKILLS_PAGE_SIZE,
      total: result.total,
      hasNextPage: page * SKILLS_PAGE_SIZE < result.total,
      revision: repository.revision,
      mode: query === "" ? "browse" : "search",
      incompleteResults: result.incompleteResults,
    };
  } catch (error) {
    throw formatGithubError(error);
  }
}

async function getBrowseReferences(
  octokit: Octokit,
  repository: RepositoryContext,
  libraryPath: string,
  page: number,
): Promise<{ references: SkillReference[]; total: number; incompleteResults: false }> {
  const treeSha = await resolveTreeSha(octokit, repository, libraryPath);
  const { data } = await octokit.rest.git.getTree({
    owner: repository.owner,
    repo: repository.name,
    tree_sha: treeSha,
    recursive: "1",
  });
  const references = data.truncated
    ? await scanDirectChildTrees(octokit, repository, treeSha)
    : readDirectSkillReferences(data.tree);
  const sortedReferences = references.sort((left, right) =>
    left.directoryName.localeCompare(right.directoryName),
  );
  const offset = (page - 1) * SKILLS_PAGE_SIZE;

  return {
    references: sortedReferences.slice(offset, offset + SKILLS_PAGE_SIZE),
    total: sortedReferences.length,
    incompleteResults: false,
  };
}

async function getSearchReferences(
  octokit: Octokit,
  repository: RepositoryContext,
  libraryPath: string,
  query: string,
  page: number,
): Promise<{ references: SkillReference[]; total: number; incompleteResults: boolean }> {
  const pathPattern = createSkillPathPattern(libraryPath);
  const searchTerm = `"${query.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  const { data } = await octokit.rest.search.code({
    q: `${searchTerm} repo:${repository.fullName} path:/${pathPattern}/`,
    page,
    per_page: SKILLS_PAGE_SIZE,
  });
  const exactPathPattern = new RegExp(pathPattern);

  return {
    references: data.items
      .filter((item) => exactPathPattern.test(item.path))
      .map((item) => ({
        directoryName: readDirectoryName(item.path),
        path: item.path,
        sha: item.sha,
      })),
    total: Math.min(data.total_count, 1_000),
    incompleteResults: data.incomplete_results,
  };
}

function readDirectSkillReferences(
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

async function scanDirectChildTrees(
  octokit: Octokit,
  repository: RepositoryContext,
  rootTreeSha: string,
): Promise<SkillReference[]> {
  const { data: root } = await octokit.rest.git.getTree({
    owner: repository.owner,
    repo: repository.name,
    tree_sha: rootTreeSha,
  });
  const childTrees = root.tree.filter(
    (entry): entry is typeof entry & { path: string; sha: string } =>
      entry.type === "tree" && Boolean(entry.path) && Boolean(entry.sha),
  );
  const references: SkillReference[] = [];

  for (let offset = 0; offset < childTrees.length; offset += 10) {
    const batch = childTrees.slice(offset, offset + 10);
    const results = await Promise.all(
      batch.map(async (child) => ({
        child,
        tree: (
          await octokit.rest.git.getTree({
            owner: repository.owner,
            repo: repository.name,
            tree_sha: child.sha,
          })
        ).data.tree,
      })),
    );

    for (const { child, tree } of results) {
      const skillFile = tree.find(
        (entry) => entry.type === "blob" && entry.path === "SKILL.md" && entry.sha,
      );

      if (skillFile?.sha) {
        references.push({
          directoryName: child.path,
          path: `${child.path}/SKILL.md`,
          sha: skillFile.sha,
        });
      }
    }
  }

  return references;
}

async function readBlobSources(
  octokit: Octokit,
  repository: RepositoryContext,
  references: SkillReference[],
): Promise<Map<string, BlobData>> {
  if (references.length === 0) {
    return new Map();
  }

  const fields = references
    .map(
      (reference, index) => `
        skill${index}: object(oid: "${reference.sha}") {
          ... on Blob { oid byteSize isBinary text }
        }
      `,
    )
    .join("\n");
  const response = await octokit.graphql<{
    repository: (Record<string, BlobData | null> & { __typename?: string }) | null;
  }>(
    `query SkillSources($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${fields}
      }
    }`,
    { owner: repository.owner, repo: repository.name },
  );
  const sources = new Map<string, BlobData>();

  for (const blob of Object.values(response.repository ?? {})) {
    if (blob && typeof blob === "object" && "oid" in blob) {
      sources.set(blob.oid, blob);
    }
  }

  return sources;
}

function createSkill(
  library: SkillLibrary,
  reference: SkillReference,
  blob: BlobData | null,
): SkillPreview {
  const source =
    blob && !blob.isBinary && blob.byteSize <= MAX_SKILL_FILE_SIZE ? (blob.text ?? "") : "";
  const parsed = parseSkillMarkdown(source, {
    fallbackName: reference.directoryName,
    directoryName: reference.directoryName,
  });
  const relativePath = `${reference.directoryName}/SKILL.md`;

  return {
    id: `${library.id}:${reference.directoryName}`,
    directoryName: reference.directoryName,
    rootName: library.rootName,
    relativePath,
    skillFilePath: library.path === "" ? relativePath : `${library.path}/${relativePath}`,
    source,
    body: parsed.body,
    metadata: {
      name: parsed.metadata.name,
      description: parsed.metadata.description,
      valid: parsed.metadata.valid,
      diagnostics: parsed.metadata.diagnostics,
    },
  };
}

function createSkillPathPattern(libraryPath: string): string {
  const prefix = libraryPath === "" ? "" : `${escapeRegex(libraryPath)}\\/`;

  return `^${prefix}[^\\/]+\\/SKILL\\.md$`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function readDirectoryName(path: string): string {
  const parts = path.split("/");

  return parts.at(-2) ?? path;
}
