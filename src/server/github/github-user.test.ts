import { describe, expect, it } from "vite-plus/test";

import { fetchGithubUserProfile } from "./github-user";

describe("GitHub user profile request", () => {
  it("sends GitHub's required User-Agent header", async () => {
    const fetcher: typeof fetch = async (_input, init) => {
      const headers = new Headers(init?.headers);

      expect(headers.get("User-Agent")).toBe("ContextKit/0.0.0");

      return Response.json({ id: 123, login: "octocat", avatar_url: null });
    };

    await expect(fetchGithubUserProfile("token", fetcher)).resolves.toEqual({
      id: "123",
      login: "octocat",
      avatarUrl: null,
    });
  });

  it("normalizes a non-JSON GitHub response", async () => {
    const fetcher: typeof fetch = async () =>
      new Response("Request forbidden by administrative rules.", { status: 403 });

    await expect(fetchGithubUserProfile("token", fetcher)).rejects.toMatchObject({
      message: "GitHub user profile request failed.",
      status: 403,
    });
  });
});
