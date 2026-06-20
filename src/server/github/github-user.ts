export type GithubUserProfile = {
  id: string;
  login: string;
  avatarUrl: string | null;
};

const githubUserUrl = "https://api.github.com/user";
const githubUserAgent = "ContextKit/0.0.0";

export async function fetchGithubUserProfile(
  accessToken: string,
  fetcher: typeof fetch = fetch,
): Promise<GithubUserProfile> {
  const response = await fetcher(githubUserUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": githubUserAgent,
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });
  const data = await readJson(response);

  if (!response.ok || !isGithubUserProfile(data)) {
    throw Object.assign(new Error("GitHub user profile request failed."), {
      status: response.status,
    });
  }

  return {
    id: String(data.id),
    login: data.login,
    avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : null,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isGithubUserProfile(value: unknown): value is {
  id: number;
  login: string;
  avatar_url?: string | null;
} {
  return isRecord(value) && typeof value.id === "number" && typeof value.login === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
