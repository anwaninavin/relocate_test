/** LOCAL DEV ONLY — creates/updates a throwaway test student and prints a signed auth token,
 * so the app can be driven in a browser without the MSG91 OTP flow (which needs a real phone).
 * Signs with whatever JWT_SECRET the local .env holds; useless against production unless you
 * already hold that secret. Not referenced by package.json on purpose.
 *
 * Usage: npx tsx scripts/devLoginToken.ts
 */
import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { signAuthToken } from "@/lib/jwt";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOneAndUpdate(
    { mobile: "910000000001" },
    { name: "Dev Tester", username: "dev-tester", city: "Delhi", college: "IIT Delhi", role: "student" },
    { upsert: true, returnDocument: "after" },
  );
  console.log(JSON.stringify({ userId: user!._id.toString(), token: signAuthToken(user!._id.toString(), user!.tokenVersion ?? 0) }));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
