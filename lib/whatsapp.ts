import { connectDB } from "@/lib/db";
import { WhatsappLog } from "@/models/WhatsappLog";

const GRAPH_API_VERSION = "v20.0";

function getGraphUrl() {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error("Missing META_PHONE_NUMBER_ID environment variable");
  }
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
}

async function callGraphApi(payload: Record<string, unknown>) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing META_ACCESS_TOKEN environment variable");
  }

  const response = await fetch(getGraphUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `WhatsApp Graph API error (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data as { messages?: { id: string }[] };
}

async function logMessage(entry: {
  direction: "inbound" | "outbound";
  mobile: string;
  type?: string;
  body?: string;
  status?: string;
  providerMessageId?: string | null;
  raw?: unknown;
}) {
  try {
    await connectDB();
    await WhatsappLog.create(entry);
  } catch {
    // Logging must never block the send/receive path.
  }
}

/** Sends a plain-text reply. Only valid inside a customer-initiated 24h session window. */
export async function sendTextMessage(toMobile: string, body: string) {
  try {
    const data = await callGraphApi({
      to: toMobile,
      type: "text",
      text: { body, preview_url: false },
    });

    await logMessage({
      direction: "outbound",
      mobile: toMobile,
      type: "text",
      body,
      status: "sent",
      providerMessageId: data.messages?.[0]?.id ?? null,
    });

    return { success: true as const };
  } catch (error) {
    await logMessage({
      direction: "outbound",
      mobile: toMobile,
      type: "text",
      body,
      status: "failed",
      raw: error instanceof Error ? error.message : error,
    });

    return { success: false as const, error };
  }
}

/**
 * Sends a pre-approved template message. Required for any business-initiated message
 * outside the 24h customer-service window (e.g. admin broadcasts to inactive users).
 */
export async function sendTemplateMessage(
  toMobile: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[] = [],
) {
  try {
    const data = await callGraphApi({
      to: toMobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components:
          bodyParams.length > 0
            ? [
                {
                  type: "body",
                  parameters: bodyParams.map((text) => ({ type: "text", text })),
                },
              ]
            : undefined,
      },
    });

    await logMessage({
      direction: "outbound",
      mobile: toMobile,
      type: "template",
      body: templateName,
      status: "sent",
      providerMessageId: data.messages?.[0]?.id ?? null,
    });

    return { success: true as const };
  } catch (error) {
    await logMessage({
      direction: "outbound",
      mobile: toMobile,
      type: "template",
      body: templateName,
      status: "failed",
      raw: error instanceof Error ? error.message : error,
    });

    return { success: false as const, error };
  }
}

export async function logInboundMessage(mobile: string, body: string, raw: unknown) {
  await logMessage({ direction: "inbound", mobile, type: "text", body, raw });
}
