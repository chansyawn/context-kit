const encryptedTokenVersion = "v1";
const initializationVectorLength = 12;
const tokenKeyLength = 32;

export async function encryptToken(token: string, base64Key: string): Promise<string> {
  const key = await importTokenKey(base64Key);
  const initializationVector = crypto.getRandomValues(new Uint8Array(initializationVectorLength));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: initializationVector },
    key,
    new TextEncoder().encode(token),
  );

  return [
    encryptedTokenVersion,
    encodeBase64(initializationVector),
    encodeBase64(new Uint8Array(ciphertext)),
  ].join(":");
}

export async function decryptToken(payload: string, base64Key: string): Promise<string> {
  const [version, initializationVector, ciphertext] = payload.split(":");

  if (version !== encryptedTokenVersion || !initializationVector || !ciphertext) {
    throw new Error("Encrypted token payload is invalid.");
  }

  const key = await importTokenKey(base64Key);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(initializationVector) },
    key,
    decodeBase64(ciphertext),
  );

  return new TextDecoder().decode(plaintext);
}

async function importTokenKey(base64Key: string): Promise<CryptoKey> {
  const key = decodeBase64(base64Key);

  if (key.byteLength !== tokenKeyLength) {
    throw new Error("GitHub token encryption key must decode to 32 bytes.");
  }

  return crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
