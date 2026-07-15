import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.PIN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Missing PIN_ENCRYPTION_KEY environment variable");
  }
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) {
    throw new Error("PIN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return key;
}

/** Encrypts the /wa-login self-registration PIN before it's stored on User.waLoginPin.
 * Reversible (unlike loginPinHash's bcrypt hash) because the whole point of this field is
 * reading the code back to resend it over WhatsApp — storing it in plaintext would mean a
 * database dump/backup leak hands out ready-to-use login codes for every wa-login account. */
export function encryptPin(plainPin: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainPin, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptPin(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Same as decryptPin, but falls back to treating the stored value as already-plaintext if
 * decryption fails — covers any User.waLoginPin rows written before this field was encrypted,
 * without needing a one-off migration script run against production data. Every value written
 * going forward is encrypted; legacy plaintext rows self-heal to encrypted the next time their
 * PIN is regenerated (see completeResendFromWhatsApp). */
export function decryptPinSafe(stored: string): string {
  try {
    return decryptPin(stored);
  } catch {
    return stored;
  }
}
