import {
  createSkillLibraryError,
  skillLibraryErrorCodes,
} from "@/domain/skill-libraries/error-codes";
import { env } from "cloudflare:workers";

import { parseGithubServerConfig, type GithubServerConfig } from "./github-config";

export function getGithubServerConfig(): GithubServerConfig {
  try {
    return parseGithubServerConfig({
      GITHUB_APP_SLUG: env.GITHUB_APP_SLUG,
      GITHUB_APP_CLIENT_ID: env.GITHUB_APP_CLIENT_ID,
      GITHUB_APP_CLIENT_SECRET: env.GITHUB_APP_CLIENT_SECRET,
      GITHUB_TOKEN_ENCRYPTION_KEY: env.GITHUB_TOKEN_ENCRYPTION_KEY,
    });
  } catch (error) {
    console.error("[github-config] Invalid GitHub server configuration.", error);
    throw createSkillLibraryError(skillLibraryErrorCodes.githubConfigurationInvalid);
  }
}
