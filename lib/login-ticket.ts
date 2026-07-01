import { randomBytes, createHash } from "node:crypto";

import { connectDB } from "@/lib/db";
import { LoginTicket } from "@/models/LoginTicket";
import { checkRateLimit } from "@/lib/rate-limit";

const TICKET_TTL_MS = 10 * 60 * 1000;
const MAX_TICKETS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export const WHATSAPP_LOGIN_KEYWORD = "HOSTEL";

export function generateTicketToken() {
  return randomBytes(20).toString("hex");
}

export function hashTicketToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildWhatsAppDeepLink(token: string) {
  const businessNumber = process.env.META_BUSINESS_NUMBER?.replace(/\D/g, "");
  const text = encodeURIComponent(`${WHATSAPP_LOGIN_KEYWORD} ${token}`);
  return `https://wa.me/${businessNumber ?? ""}?text=${text}`;
}

export class RateLimitedError extends Error {}

export async function createLoginTicket(expectedMobile: string, requestIp: string | null) {
  await connectDB();

  const { allowed } = await checkRateLimit({
    model: LoginTicket,
    filter: { expectedMobile },
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: MAX_TICKETS_PER_WINDOW,
  });

  if (!allowed) {
    throw new RateLimitedError("Too many login attempts. Please try again in a few minutes.");
  }

  const token = generateTicketToken();
  const tokenHash = hashTicketToken(token);
  const expiresAt = new Date(Date.now() + TICKET_TTL_MS);

  await LoginTicket.create({
    tokenHash,
    expectedMobile,
    status: "pending",
    expiresAt,
    requestIp,
  });

  return { token, expiresAt, deepLink: buildWhatsAppDeepLink(token) };
}

export async function getTicketStatus(token: string) {
  await connectDB();
  const tokenHash = hashTicketToken(token);
  const ticket = await LoginTicket.findOne({ tokenHash }).lean();

  if (!ticket) {
    return { status: "not_found" as const };
  }

  if (ticket.status === "pending" && ticket.expiresAt.getTime() < Date.now()) {
    return { status: "expired" as const };
  }

  return { status: ticket.status as "pending" | "verified" | "consumed" | "expired" };
}

/** Called from the WhatsApp webhook once the user sends the deep-linked message. */
export async function verifyLoginTicket(token: string, senderMobile: string) {
  await connectDB();
  const tokenHash = hashTicketToken(token);

  const ticket = await LoginTicket.findOne({ tokenHash });

  if (!ticket || ticket.status !== "pending") {
    return { success: false as const, reason: "not_found_or_used" };
  }

  if (ticket.expiresAt.getTime() < Date.now()) {
    ticket.status = "expired";
    await ticket.save();
    return { success: false as const, reason: "expired" };
  }

  if (ticket.expectedMobile !== senderMobile) {
    ticket.attempts += 1;
    await ticket.save();
    return { success: false as const, reason: "mobile_mismatch" };
  }

  ticket.status = "verified";
  ticket.verifiedMobile = senderMobile;
  await ticket.save();

  return { success: true as const };
}

/** Called from NextAuth authorize() — single-use exchange of a verified ticket for a session. */
export async function consumeLoginTicket(token: string) {
  await connectDB();
  const tokenHash = hashTicketToken(token);

  const ticket = await LoginTicket.findOneAndUpdate(
    { tokenHash, status: "verified" },
    { status: "consumed" },
    { new: false },
  );

  if (!ticket || !ticket.verifiedMobile) {
    return null;
  }

  return { mobile: ticket.verifiedMobile };
}
