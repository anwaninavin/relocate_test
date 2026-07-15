import { connectDB } from "@/db";
import { TempUser } from "@/models/TempUser";

/** Records (or refreshes) a /wa-login attempt for a mobile number that isn't registered yet. */
export async function upsertTempUser(mobile: string) {
  await connectDB();
  await TempUser.updateOne({ mobile }, { $setOnInsert: { mobile } }, { upsert: true });
}

/** Clears the safety-net record once the mobile number successfully completes registration. */
export async function removeTempUser(mobile: string) {
  await connectDB();
  await TempUser.deleteOne({ mobile });
}

export async function listTempUsers() {
  await connectDB();
  return TempUser.find().sort({ createdAt: -1 }).lean();
}

export async function deleteTempUserById(id: string) {
  await connectDB();
  await TempUser.findByIdAndDelete(id);
}
