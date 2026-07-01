import { createHmac, timingSafeEqual } from "node:crypto";

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body using META_APP_SECRET. */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    // No app secret configured — skip verification rather than block the webhook.
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
