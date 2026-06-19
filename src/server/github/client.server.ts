import { Octokit } from "octokit";

import { getGithubAccessToken } from "./oauth.server";

export async function createUserOctokit(): Promise<Octokit> {
  return new Octokit({ auth: await getGithubAccessToken() });
}
