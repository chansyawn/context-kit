import type {
  DirectorySummary,
  InstallationSummary,
  Page,
  RepositorySummary,
} from "@/domain/skill-libraries/types";
import type { Octokit } from "octokit";

import { createUserOctokit } from "./client.server";
import { formatGithubError } from "./github-error";

const REPOSITORIES_PAGE_SIZE = 30;

export type RepositoryContext = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  rootTreeSha: string;
  revision: string;
};

export async function listInstallations(): Promise<InstallationSummary[]> {
  const octokit = await createUserOctokit();

  try {
    const { data } = await octokit.rest.apps.listInstallationsForAuthenticatedUser({
      per_page: 100,
    });

    return data.installations.map((installation) => ({
      id: String(installation.id),
      accountLogin: readAccountLogin(installation.account),
      accountAvatarUrl: readAccountAvatar(installation.account),
      targetType: installation.target_type === "Organization" ? "Organization" : "User",
      repositorySelection: installation.repository_selection,
    }));
  } catch (error) {
    throw formatGithubError(error);
  }
}

export async function listRepositories(
  installationId: string,
  page: number,
): Promise<Page<RepositorySummary>> {
  const octokit = await createUserOctokit();

  try {
    const { data } = await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: Number(installationId),
      page,
      per_page: REPOSITORIES_PAGE_SIZE,
    });
    const total = data.total_count;

    return {
      items: data.repositories.map(mapRepository),
      page,
      pageSize: REPOSITORIES_PAGE_SIZE,
      total,
      hasNextPage: page * REPOSITORIES_PAGE_SIZE < total,
    };
  } catch (error) {
    throw formatGithubError(error);
  }
}

export async function listDirectories(
  repositoryId: string,
  path: string,
): Promise<DirectorySummary[]> {
  const octokit = await createUserOctokit();

  try {
    const repository = await getRepositoryContext(octokit, repositoryId);
    const treeSha = await resolveTreeSha(octokit, repository, path);
    const { data } = await octokit.rest.git.getTree({
      owner: repository.owner,
      repo: repository.name,
      tree_sha: treeSha,
    });

    return data.tree
      .filter((entry) => entry.type === "tree" && entry.path)
      .map((entry) => ({
        name: entry.path ?? "",
        path: path === "" ? (entry.path ?? "") : `${path}/${entry.path ?? ""}`,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw formatGithubError(error);
  }
}

export async function getRepositoryContext(
  octokit: Octokit,
  repositoryId: string,
): Promise<RepositoryContext> {
  const { data: repository } = await octokit.request("GET /repositories/{repository_id}", {
    repository_id: Number(repositoryId),
  });
  const owner = repository.owner.login;
  const name = repository.name;
  const { data: commit } = await octokit.rest.repos.getCommit({
    owner,
    repo: name,
    ref: repository.default_branch,
  });

  return {
    id: String(repository.id),
    owner,
    name,
    fullName: repository.full_name,
    defaultBranch: repository.default_branch,
    rootTreeSha: commit.commit.tree.sha,
    revision: commit.sha,
  };
}

export async function resolveTreeSha(
  octokit: Octokit,
  repository: RepositoryContext,
  path: string,
): Promise<string> {
  let treeSha = repository.rootTreeSha;

  for (const segment of path.split("/").filter(Boolean)) {
    const { data } = await octokit.rest.git.getTree({
      owner: repository.owner,
      repo: repository.name,
      tree_sha: treeSha,
    });
    const nextTree = data.tree.find(
      (entry) => entry.type === "tree" && entry.path === segment && entry.sha,
    );

    if (!nextTree?.sha) {
      throw Object.assign(new Error("Repository path was not found."), { status: 404 });
    }

    treeSha = nextTree.sha;
  }

  return treeSha;
}

function mapRepository(repository: {
  id: number;
  owner: { login: string } | null;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}): RepositorySummary {
  return {
    id: String(repository.id),
    owner: repository.owner?.login ?? repository.full_name.split("/")[0] ?? "",
    name: repository.name,
    fullName: repository.full_name,
    isPrivate: repository.private,
    defaultBranch: repository.default_branch,
  };
}

function readAccountLogin(account: unknown): string {
  return readAccountProperty(account, "login") ?? "Unknown account";
}

function readAccountAvatar(account: unknown): string | null {
  return readAccountProperty(account, "avatar_url");
}

function readAccountProperty(account: unknown, key: string): string | null {
  if (typeof account !== "object" || account === null || !(key in account)) {
    return null;
  }

  const value = account[key as keyof typeof account];

  return typeof value === "string" ? value : null;
}
