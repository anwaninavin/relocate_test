import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { normalizeMobile } from "@/lib/phone";

async function main() {
  const rawMobile = process.argv[2];
  if (!rawMobile) {
    console.error("Usage: npm run make-admin -- <mobile-number>");
    process.exit(1);
  }

  const mobile = normalizeMobile(rawMobile);
  if (!mobile) {
    console.error("Invalid mobile number. Use a 10-digit Indian mobile number.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(uri);

  const user = await User.findOneAndUpdate({ mobile }, { role: "admin" }, { new: true });

  if (!user) {
    console.error(
      `No user found with mobile +${mobile}. They must log in at least once before you can promote them.`,
    );
    process.exit(1);
  }

  console.log(`+${mobile} (${user.name ?? "unnamed"}) is now an admin.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to set admin:", error);
  process.exit(1);
});
