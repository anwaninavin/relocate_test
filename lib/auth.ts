import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { consumeLoginTicket } from "@/lib/login-ticket";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "whatsapp-ticket",
      name: "WhatsApp",
      credentials: {
        token: { label: "Ticket", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token || typeof token !== "string") {
          return null;
        }

        const result = await consumeLoginTicket(token);
        if (!result) {
          return null;
        }

        await connectDB();
        const user = await User.findOneAndUpdate(
          { mobile: result.mobile },
          { $setOnInsert: { mobile: result.mobile, role: "student" } },
          { upsert: true, new: true },
        );

        return {
          id: user._id.toString(),
          mobile: user.mobile,
          name: user.name ?? null,
          role: user.role,
          needsOnboarding: !user.name,
        };
      },
    }),
  ],
});
