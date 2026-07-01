import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthRoute = pathname.startsWith("/login");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!session) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session.user.needsOnboarding && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (!session.user.needsOnboarding && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAdminRoute && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checklist/:path*",
    "/budget/:path*",
    "/notes/:path*",
    "/documents/:path*",
    "/contacts/:path*",
    "/wishlist/:path*",
    "/shopping/:path*",
    "/guide/:path*",
    "/search/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/onboarding",
  ],
};
