import { NextResponse } from "next/server";

import { createLoginTicketSchema } from "@/lib/validations/auth";
import { createLoginTicket, RateLimitedError } from "@/lib/login-ticket";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createLoginTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid mobile number" },
      { status: 400 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const requestIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  try {
    const ticket = await createLoginTicket(parsed.data.mobile, requestIp);
    return NextResponse.json({
      token: ticket.token,
      deepLink: ticket.deepLink,
      expiresAt: ticket.expiresAt,
    });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Failed to create login ticket", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
