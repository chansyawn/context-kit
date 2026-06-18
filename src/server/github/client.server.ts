import { requireGithubAccessToken } from "@/server/auth/session.server";
import { Octokit } from "octokit";

export async function createUserOctokit(): Promise<Octokit> {
  return new Octokit({ auth: await requireGithubAccessToken() });
}
