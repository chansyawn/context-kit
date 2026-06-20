import { getGithubServerConfig } from "./github-config.server";
import { getGithubAuthorizationUrl } from "./oauth.server";

export function getGithubAppConfig() {
  const config = getGithubServerConfig();

  return {
    authorizationUrl: getGithubAuthorizationUrl(),
    installationUrl: `https://github.com/apps/${config.appSlug}/installations/new`,
  };
}
