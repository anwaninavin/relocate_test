import { connectDB } from "@/db";
import { User } from "@/models/User";
import { WaPendingRegistration } from "@/models/WaPendingRegistration";
import { normalizeMobile } from "@/lib/phone";
import { hashPin, verifyPin, generateShortPin } from "@/lib/pin";
import { signAuthToken } from "@/lib/jwt";
import { serializeUser } from "@/lib/serialize";
import { sendWhatsAppText } from "@/lib/whatsapp";

const PENDING_TTL_MS = 30 * 60 * 1000;
const RESTART_COOLDOWN_MS = 15 * 1000;

export class WaRegisterCooldownError extends Error {}

/** One-tap "already logged in" link sent back over WhatsApp once a handshake completes.
 * Reuses the same GET /api/wa-register/status the polling browser tab already calls —
 * status is already "registered" by the time this link is sent, so clicking it just
 * adopts the session and redirects, no separate token machinery needed. */
function buildMagicLink(pendingId: string): string {
  const base = (process.env.FRONTEND_URL || "https://packwithme.instify.in").replace(/\/$/, "");
  return `${base}/wa-login/complete?pendingId=${pendingId}`;
}

/** Starts (or restarts) a pending /wa-login handshake and reports which mode the frontend
 * should use for the WhatsApp message: "register" (mobile has no account — the visitor's
 * typed PIN becomes their login code) or "resend" (mobile already has an account — the
 * typed PIN is ignored, and completing the handshake instead reissues that account's login
 * code over WhatsApp). Neither mode touches the User collection here — only once the
 * matching WhatsApp message arrives. */
export async function startPendingRegistration(mobile: string, pin: string) {
  await connectDB();

  const existingUser = await User.findOne({ mobile }).lean();
  const mode = existingUser ? ("resend" as const) : ("register" as const);

  const recent = await WaPendingRegistration.findOne({ mobile }).sort({ createdAt: -1 });
  if (recent && recent.status === "pending" && Date.now() - recent.createdAt.getTime() < RESTART_COOLDOWN_MS) {
    throw new WaRegisterCooldownError("Please wait a moment before trying again");
  }

  await WaPendingRegistration.deleteMany({ mobile });

  const pinHash = await hashPin(pin);
  const pending = await WaPendingRegistration.create({
    mobile,
    pinHash,
    mode,
    status: "pending",
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
  });

  return { success: true as const, pendingId: pending._id.toString(), mode };
}

export async function getRegistrationStatus(pendingId: string) {
  await connectDB();

  const pending = await WaPendingRegistration.findById(pendingId);
  if (!pending) {
    return { status: "expired" as const };
  }

  if (pending.status === "pending") {
    return { status: "pending" as const };
  }

  const user = pending.resultUserId ? await User.findById(pending.resultUserId) : null;
  if (!user) {
    return { status: "expired" as const };
  }

  const token = signAuthToken(user._id.toString());
  return {
    status: "registered" as const,
    token,
    user: serializeUser(user),
    suggestedName: pending.suggestedName ?? null,
    mode: pending.mode,
  };
}

/**
 * Completes a registration from an inbound WhatsApp message. `verifiedMobile` is the actual
 * WhatsApp sender number (from the webhook payload) — the source of truth for identity, since
 * only that number's own WhatsApp account can send from it. `typedMobile`/`pin` come from
 * parsing the message text ("Register me as <mobile>, my PIN is <pin>"); typedMobile must match
 * verifiedMobile so a visitor can't hijack someone else's pending handshake by guessing/knowing
 * their PIN and sending from a different number.
 */
export async function completeRegistrationFromWhatsApp(
  verifiedMobile: string,
  typedMobile: string,
  pin: string,
  profileName: string | null,
): Promise<boolean> {
  await connectDB();

  const normalizedVerified = normalizeMobile(verifiedMobile);
  const normalizedTyped = normalizeMobile(typedMobile);
  if (!normalizedVerified || !normalizedTyped || normalizedVerified !== normalizedTyped) {
    return false;
  }

  const existingUser = await User.findOne({ mobile: normalizedVerified }).lean();
  if (existingUser) {
    return false;
  }

  const pending = await WaPendingRegistration.findOne({
    mobile: normalizedVerified,
    mode: "register",
    status: "pending",
  }).sort({ createdAt: -1 });
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    return false;
  }

  const pinMatches = await verifyPin(pin, pending.pinHash);
  if (!pinMatches) {
    return false;
  }

  const user = await User.create({ mobile: normalizedVerified, role: "student", loginPinHash: pending.pinHash });

  pending.status = "registered";
  pending.resultUserId = user._id;
  pending.suggestedName = profileName;
  await pending.save();

  try {
    await sendWhatsAppText(
      normalizedVerified,
      `*Registration done!*\nGo back to the login page, or tap the link below to continue:\n${buildMagicLink(pending._id.toString())}`,
    );
  } catch (error) {
    console.error("Failed to send wa-login confirmation reply:", error);
  }

  return true;
}

/**
 * Completes a "send my code" handshake from an inbound WhatsApp message: reissues a fresh
 * 4-digit login code for an *existing* account and WhatsApps it back to the verified sender.
 * Same identity rule as registration — `verifiedMobile` (the actual WhatsApp sender) must
 * match `typedMobile` (parsed from the message text) before anything happens.
 */
export async function completeResendFromWhatsApp(verifiedMobile: string, typedMobile: string): Promise<boolean> {
  await connectDB();

  const normalizedVerified = normalizeMobile(verifiedMobile);
  const normalizedTyped = normalizeMobile(typedMobile);
  if (!normalizedVerified || !normalizedTyped || normalizedVerified !== normalizedTyped) {
    return false;
  }

  const user = await User.findOne({ mobile: normalizedVerified });
  if (!user) {
    return false;
  }

  const pending = await WaPendingRegistration.findOne({
    mobile: normalizedVerified,
    mode: "resend",
    status: "pending",
  }).sort({ createdAt: -1 });
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    return false;
  }

  const newPin = generateShortPin();
  user.loginPinHash = await hashPin(newPin);
  await user.save();

  pending.status = "registered";
  pending.resultUserId = user._id;
  await pending.save();

  try {
    await sendWhatsAppText(
      normalizedVerified,
      `Your PACKWITHME login code is ${newPin}. Save it for next time!\n\nOr tap the link below to jump straight back in:\n${buildMagicLink(pending._id.toString())}`,
    );
  } catch (error) {
    console.error("Failed to send wa-login code-resend reply:", error);
  }

  return true;
}
