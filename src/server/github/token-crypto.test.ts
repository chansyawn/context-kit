import { describe, expect, it } from "vite-plus/test";

import { decryptToken, encryptToken } from "./token-crypto";

describe("GitHub token encryption", () => {
  it("round trips encrypted token payloads without storing plaintext", async () => {
    const key = createBase64Key(7);
    const encrypted = await encryptToken("ghu_secret-token", key);

    expect(encrypted).not.toContain("ghu_secret-token");
    await expect(decryptToken(encrypted, key)).resolves.toBe("ghu_secret-token");
  });

  it("rejects payloads encrypted with a different key", async () => {
    const encrypted = await encryptToken("ghu_secret-token", createBase64Key(7));

    await expect(decryptToken(encrypted, createBase64Key(8))).rejects.toThrow();
  });
});

function createBase64Key(fill: number): string {
  return Buffer.from(new Uint8Array(32).fill(fill)).toString("base64");
}
