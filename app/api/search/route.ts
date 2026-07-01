import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { globalSearch } from "@/services/searchService";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const results = await globalSearch(session.user.id, query);
  return NextResponse.json({ results });
}
