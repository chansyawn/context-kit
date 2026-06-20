import { describe, expect, it } from "vite-plus/test";

import {
  GithubConfigurationError,
  parseGithubServerConfig,
  type GithubServerConfigInput,
} from "./github-config";

const validInput = {
  GITHUB_APP_SLUG: "contextkit-dev",
  GITHUB_APP_CLIENT_ID: "client-id",
  GITHUB_APP_CLIENT_SECRET: "client-secret",
  GITHUB_TOKEN_ENCRYPTION_KEY: createBase64Key(32),
} satisfies GithubServerConfigInput;

describe("GitHub server configuration", () => {
  it("returns a validated configuration", () => {
    expect(parseGithubServerConfig(validInput)).toEqual({
      appSlug: "contextkit-dev",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenEncryptionKey: validInput.GITHUB_TOKEN_ENCRYPTION_KEY,
    });
  });

  it.each([
    "GITHUB_APP_SLUG",
    "GITHUB_APP_CLIENT_ID",
    "GITHUB_APP_CLIENT_SECRET",
    "GITHUB_TOKEN_ENCRYPTION_KEY",
  ] as const)("rejects a missing %s", (name) => {
    expect(() => parseGithubServerConfig({ ...validInput, [name]: "" })).toThrow(
      new GithubConfigurationError(`${name} is required.`),
    );
  });

  it("rejects an invalid Base64 encryption key", () => {
    expect(() =>
      parseGithubServerConfig({
        ...validInput,
        GITHUB_TOKEN_ENCRYPTION_KEY: "not-base64!",
      }),
    ).toThrow(new GithubConfigurationError("GITHUB_TOKEN_ENCRYPTION_KEY must be valid Base64."));
  });

  it("rejects an encryption key with the wrong decoded length", () => {
    expect(() =>
      parseGithubServerConfig({
        ...validInput,
        GITHUB_TOKEN_ENCRYPTION_KEY: createBase64Key(45),
      }),
    ).toThrow(
      new GithubConfigurationError(
        "GITHUB_TOKEN_ENCRYPTION_KEY must decode to 32 bytes; received 45.",
      ),
    );
  });
});

function createBase64Key(length: number): string {
  return btoa(String.fromCharCode(...new Uint8Array(length).fill(7)));
}
