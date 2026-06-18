import { env } from "cloudflare:workers";

export function getGithubAppConfig() {
  return {
    installationUrl: `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`,
  };
}
