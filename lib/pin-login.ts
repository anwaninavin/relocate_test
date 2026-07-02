import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { LoginAttempt } from "@/models/LoginAttempt";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeMobile } from "@/lib/phone";
import { verifyPin } from "@/lib/pin";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export class RateLimitedError extends Error {}

/**
 * Verifies an admin-issued mobile+PIN login. Unlike the WhatsApp ticket flow, this never
 * creates a user — the account must already exist (admin-provisioned) with a PIN set.
 */
export async function authenticateWithPin(rawMobile: string, pin: string) {
  await connectDB();

  const mobile = normalizeMobile(rawMobile);
  if (!mobile) {
    console.error("[pin-login] rejected: raw mobile didn't normalize", { rawMobile });
    return null;
  }

  const { allowed } = await checkRateLimit({
    model: LoginAttempt,
    filter: { mobile },
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: MAX_ATTEMPTS_PER_WINDOW,
  });

  if (!allowed) {
    console.error("[pin-login] rate limited", { mobile });
    throw new RateLimitedError("Too many attempts. Please try again in a few minutes.");
  }

  const user = await User.findOne({ mobile });

  if (!user) {
    console.error("[pin-login] rejected: no user for mobile", { mobile });
    await LoginAttempt.create({ mobile, success: false });
    return null;
  }

  if (!user.loginPinHash) {
    console.error("[pin-login] rejected: user has no loginPinHash set", { mobile });
    await LoginAttempt.create({ mobile, success: false });
    return null;
  }

  if (!/^\d{7}$/.test(pin)) {
    console.error("[pin-login] rejected: submitted pin isn't 7 digits", { mobile, pinLength: pin.length });
    await LoginAttempt.create({ mobile, success: false });
    return null;
  }

  const isValid = await verifyPin(pin, user.loginPinHash);
  await LoginAttempt.create({ mobile, success: isValid });

  if (!isValid) {
    console.error("[pin-login] rejected: pin didn't match hash", { mobile });
    return null;
  }

  return user;
}
