import { normalizeMobile } from "@/lib/phone";

/**
 * MSG91 "Login with OTP" widget — server-side access-token confirmation. Ported verbatim in
 * spirit from the WhatsLocal project (apps/backend/src/auth/auth.service.ts): the browser
 * verifies the OTP against the MSG91 widget and receives a signed access-token; we confirm
 * that token here with MSG91 and read the VERIFIED mobile out of it, so the number is never
 * trusted from the client (a user can't verify one number and claim another).
 *
 * Uses the SAME widget/account as WhatsLocal — reuse, don't create another:
 *   VITE_MSG91_WIDGET_ID / VITE_MSG91_TOKEN_AUTH  (frontend, public)
 *   MSG91_AUTH_KEY                                (backend, secret)  ← read here
 */

export class Msg91Error extends Error {}

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const isMobile = (s: string) => INDIAN_MOBILE_REGEX.test(s);

/** Bare 10-digit view of a number (strip +91/91/0), for the isMobile check + scanning. */
function toTenDigit(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "").replace(/^(?:91)?0?(\d{10})$/, "$1");
}

/** Decode a JWT payload (no signature check — authenticity is established by the MSG91
 * verifyAccessToken call; this only reads the verified number out of it). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const seg = String(token).split(".")[1];
    if (!seg) return null;
    return JSON.parse(Buffer.from(seg.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Find the verified Indian mobile in an MSG91 response / access-token payload. Prefers obvious
 * identifier keys, then scans (skipping time claims so a timestamp can't masquerade as a number). */
function pickMobile(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "";
  const rec = obj as Record<string, unknown>;
  for (const k of ["mobile", "identifier", "number", "phone", "msisdn"]) {
    const m = toTenDigit(rec[k]);
    if (isMobile(m)) return m;
  }
  const SKIP = new Set(["iat", "exp", "nbf", "timestamp", "time"]);
  for (const [k, v] of Object.entries(rec)) {
    if (SKIP.has(k)) continue;
    if (typeof v === "string" || typeof v === "number") {
      const m = toTenDigit(v);
      if (isMobile(m)) return m;
    } else if (v && typeof v === "object") {
      const m = pickMobile(v);
      if (m) return m;
    }
  }
  return "";
}

/**
 * Confirm an MSG91 widget access-token server-side and return the VERIFIED mobile in the
 * app's canonical "91XXXXXXXXXX" form (same as User.mobile). Throws Msg91Error on any failure.
 */
export async function verifyWidgetToken(accessToken: string): Promise<string> {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) throw new Msg91Error("OTP service not configured.");
  if (!accessToken) throw new Msg91Error("Missing access token.");

  let data: Record<string, unknown> = {};
  try {
    const r = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authkey, "access-token": accessToken }),
    });
    data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok || data?.type === "error") {
      throw new Error(typeof data?.message === "string" ? data.message : "verify failed");
    }
  } catch {
    throw new Msg91Error("OTP verification failed.");
  }

  const tenDigit = pickMobile(data) || pickMobile(decodeJwtPayload(accessToken));
  if (!isMobile(tenDigit)) throw new Msg91Error("Could not read the verified number.");

  const normalized = normalizeMobile(tenDigit);
  if (!normalized) throw new Msg91Error("Could not read the verified number.");
  return normalized;
}
