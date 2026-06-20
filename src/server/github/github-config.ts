const githubTokenEncryptionKeyLength = 32;

export type GithubServerConfig = {
  appSlug: string;
  clientId: string;
  clientSecret: string;
  tokenEncryptionKey: string;
};

export type GithubServerConfigInput = {
  GITHUB_APP_SLUG?: string;
  GITHUB_APP_CLIENT_ID?: string;
  GITHUB_APP_CLIENT_SECRET?: string;
  GITHUB_TOKEN_ENCRYPTION_KEY?: string;
};

export class GithubConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubConfigurationError";
  }
}

export function parseGithubServerConfig(input: GithubServerConfigInput): GithubServerConfig {
  return {
    appSlug: readRequiredValue(input.GITHUB_APP_SLUG, "GITHUB_APP_SLUG"),
    clientId: readRequiredValue(input.GITHUB_APP_CLIENT_ID, "GITHUB_APP_CLIENT_ID"),
    clientSecret: readRequiredValue(input.GITHUB_APP_CLIENT_SECRET, "GITHUB_APP_CLIENT_SECRET"),
    tokenEncryptionKey: readTokenEncryptionKey(input.GITHUB_TOKEN_ENCRYPTION_KEY),
  };
}

function readRequiredValue(value: string | undefined, name: string): string {
  const normalized = value?.trim() ?? "";

  if (normalized === "") {
    throw new GithubConfigurationError(`${name} is required.`);
  }

  return normalized;
}

function readTokenEncryptionKey(value: string | undefined): string {
  const normalized = readRequiredValue(value, "GITHUB_TOKEN_ENCRYPTION_KEY");
  let decoded: string;

  try {
    decoded = atob(normalized);
  } catch {
    throw new GithubConfigurationError("GITHUB_TOKEN_ENCRYPTION_KEY must be valid Base64.");
  }

  if (btoa(decoded) !== normalized) {
    throw new GithubConfigurationError("GITHUB_TOKEN_ENCRYPTION_KEY must be valid Base64.");
  }

  if (decoded.length !== githubTokenEncryptionKeyLength) {
    throw new GithubConfigurationError(
      `GITHUB_TOKEN_ENCRYPTION_KEY must decode to ${githubTokenEncryptionKeyLength} bytes; received ${decoded.length}.`,
    );
  }

  return normalized;
}
