import { NextResponse } from "next/server";

import { isDevLoginConfigured } from "@/lib/dev-login";

/** Diagnostic only — reveals whether DEV_LOGIN_SECRET is set, never its value. */
export async function GET() {
  return NextResponse.json({
    devLoginConfigured: isDevLoginConfigured(),
    secretLength: process.env.DEV_LOGIN_SECRET?.length ?? 0,
  });
}
