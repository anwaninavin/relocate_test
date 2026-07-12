import crypto from "crypto";

import { Router, type Request } from "express";

import { connectDB } from "@/db";
import { User } from "@/models/User";

export const whatsappRouter = Router();

/** Entry keywords that identify an incoming message as belonging to this app
 * (Metabsp fans the same WhatsApp number out to unrelated projects). */
const ENTRY_KEYWORDS = ["PACK", "START", "CHECKLIST", "HELP"];

interface MetabspPayload {
  fromMe?: boolean;
  from?: string;
  to?: string;
  message?: string;
  text?: string;
  type?: string;
  direction?: string;
  messageId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function verifySignature(req: Request): boolean {
  const secret = process.env.METABSP_WEBHOOK_SECRET;
  const signatureHeader = req.headers["x-metabsp-signature-256"];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!secret || typeof signatureHeader !== "string" || !rawBody) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function isRelevantMessage(payload: MetabspPayload): Promise<boolean> {
  const text = (payload.text ?? payload.message ?? "").trim().toUpperCase();
  if (ENTRY_KEYWORDS.some((keyword) => text === keyword || text.startsWith(`${keyword} `))) {
    return true;
  }

  if (!payload.from) {
    return false;
  }

  await connectDB();
  const existingUser = await User.findOne({ mobile: payload.from }).select("_id").lean();
  return existingUser !== null;
}

async function processMetabspMessage(payload: MetabspPayload): Promise<void> {
  try {
    const relevant = await isRelevantMessage(payload);
    if (!relevant) {
      return;
    }

    // TODO: wire up actual message-handling behavior per entry keyword once confirmed.
    console.log("Metabsp WhatsApp message for pack-with-me:", {
      from: payload.from,
      text: payload.text ?? payload.message,
      messageId: payload.messageId,
    });
  } catch (error) {
    console.error("Failed to process Metabsp WhatsApp message:", error);
  }
}

whatsappRouter.get("/webhook-metabsp", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

whatsappRouter.post("/webhook-metabsp", (req, res) => {
  if (!verifySignature(req)) {
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  res.status(200).json({ received: true });

  void processMetabspMessage(req.body as MetabspPayload);
});
