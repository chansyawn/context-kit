import type { SkillLibrary, SkillPage, SkillPreview } from "@/domain/skill-libraries/types";
import { parseSkillMarkdown } from "@/domain/skills/parse-skill";
import type { Octokit } from "octokit";

import { createUserOctokit } from "./client.server";
import { formatGithubError } from "./github-error";
import {
  createCodeSearchQuery,
  createSkillPathPattern,
  isReadableSkillBlob,
  paginateSkillReferences,
  readDirectSkillReferences,
  type SkillReference,
} from "./skill-index";
import {
  getRepositoryContext,
  resolveTreeSha,
  type RepositoryContext,
} from "./repositories.server";

const SKILLS_PAGE_SIZE = 20;
const MAX_SKILL_FILE_SIZE = 1024 * 1024;

type BlobMetadataData = {
  oid: string;
  byteSize: number;
  isBinary: boolean;
};

type BlobData = BlobMetadataData & {
  text: string | null;
};

type BlobTextData = {
  oid: string;
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
  const paginated = paginateSkillReferences(references, page, SKILLS_PAGE_SIZE);

  return {
    references: paginated.references,
    total: paginated.total,
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
  const { data } = await octokit.rest.search.code({
    q: createCodeSearchQuery(repository.fullName, libraryPath, query),
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

  const metadataFields = references
    .map(
      (reference, index) => `
        skill${index}: object(oid: "${reference.sha}") {
          ... on Blob { oid byteSize isBinary }
        }
      `,
    )
    .join("\n");
  const metadataResponse = await octokit.graphql<{
    repository: Record<string, BlobMetadataData | null> | null;
  }>(
    `query SkillSourceMetadata($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${metadataFields}
      }
    }`,
    { owner: repository.owner, repo: repository.name },
  );
  const metadataByOid = new Map<string, BlobMetadataData>();

  for (const blob of Object.values(metadataResponse.repository ?? {})) {
    if (blob) {
      metadataByOid.set(blob.oid, blob);
    }
  }

  const readableReferences = references.filter((reference) => {
    const metadata = metadataByOid.get(reference.sha);

    return metadata ? isReadableSkillBlob(metadata, MAX_SKILL_FILE_SIZE) : false;
  });
  const textByOid = await readBlobTexts(octokit, repository, readableReferences);
  const sources = new Map<string, BlobData>();

  for (const [oid, metadata] of metadataByOid) {
    sources.set(oid, { ...metadata, text: textByOid.get(oid) ?? null });
  }

  return sources;
}

async function readBlobTexts(
  octokit: Octokit,
  repository: RepositoryContext,
  references: SkillReference[],
): Promise<Map<string, string | null>> {
  if (references.length === 0) {
    return new Map();
  }

  const textFields = references
    .map(
      (reference, index) => `
        skill${index}: object(oid: "${reference.sha}") {
          ... on Blob { oid text }
        }
      `,
    )
    .join("\n");
  const response = await octokit.graphql<{
    repository: Record<string, BlobTextData | null> | null;
  }>(
    `query SkillSourceTexts($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${textFields}
      }
    }`,
    { owner: repository.owner, repo: repository.name },
  );
  const texts = new Map<string, string | null>();

  for (const blob of Object.values(response.repository ?? {})) {
    if (blob) {
      texts.set(blob.oid, blob.text);
    }
  }

  return texts;
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

function readDirectoryName(path: string): string {
  const parts = path.split("/");

  return parts.at(-2) ?? path;
}
