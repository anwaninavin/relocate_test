import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mobile: string;
      role: UserRole;
      needsOnboarding: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    mobile: string;
    role: UserRole;
    needsOnboarding: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    mobile: string;
    role: UserRole;
    needsOnboarding: boolean;
  }
}
