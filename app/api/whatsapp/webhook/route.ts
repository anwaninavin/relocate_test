import { NextResponse } from "next/server";

import { normalizeWaId } from "@/lib/phone";
import { verifyLoginTicket, WHATSAPP_LOGIN_KEYWORD } from "@/lib/login-ticket";
import { logInboundMessage, sendTextMessage } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          id: string;
          type: string;
          text?: { body: string };
        }[];
      };
      field?: string;
    }[];
  }[];
}

const LOGIN_COMMAND_REGEX = new RegExp(`^${WHATSAPP_LOGIN_KEYWORD}\\s+([a-f0-9]{20,})$`, "i");

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as WhatsAppWebhookPayload | null;

  if (!payload) {
    return NextResponse.json({ ok: true });
  }

  const messages = payload.entry?.flatMap(
    (entry) => entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? [],
  ) ?? [];

  for (const message of messages) {
    if (message.type !== "text" || !message.text?.body) continue;

    const senderMobile = normalizeWaId(message.from);
    const body = message.text.body.trim();

    await logInboundMessage(senderMobile ?? message.from, body, message);

    const match = body.match(LOGIN_COMMAND_REGEX);
    if (!match || !senderMobile) continue;

    const loginToken = match[1];
    const result = await verifyLoginTicket(loginToken, senderMobile);

    if (result.success) {
      await sendTextMessage(
        senderMobile,
        "You're logged in to Hostel Essentials ✅\nHead back to the app to continue.",
      );
    } else if (result.reason === "expired") {
      await sendTextMessage(
        senderMobile,
        "That login link has expired. Please request a new one from the app.",
      );
    } else if (result.reason === "mobile_mismatch") {
      await sendTextMessage(
        senderMobile,
        "This login request was started from a different mobile number. Please restart login using this WhatsApp number.",
      );
    }
  }

  return NextResponse.json({ ok: true });
}
