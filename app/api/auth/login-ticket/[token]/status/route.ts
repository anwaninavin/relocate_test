import { NextResponse } from "next/server";

import { getTicketStatus } from "@/lib/login-ticket";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ status: "not_found" }, { status: 400 });
  }

  const result = await getTicketStatus(token);
  return NextResponse.json(result);
}
