import { env } from "cloudflare:workers";

import { getGithubAuthorizationUrl } from "./oauth.server";

export function getGithubAppConfig() {
  return {
    authorizationUrl: getGithubAuthorizationUrl(),
    installationUrl: `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`,
  };
}
