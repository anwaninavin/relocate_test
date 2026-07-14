import { connectDB } from "@/db";
import { Connection } from "@/models/Connection";
import { User } from "@/models/User";
import type { DiscoveryContext } from "@/types";

export async function sendConnectionRequest(
  requesterId: string,
  recipientId: string,
  context: DiscoveryContext,
  message?: string,
) {
  await connectDB();

  if (requesterId === recipientId) {
    return { success: false as const, error: "You can't connect with yourself" };
  }

  const recipient = await User.findById(recipientId).lean();
  if (!recipient) {
    return { success: false as const, error: "User not found" };
  }
  if ((recipient.blockedUserIds ?? []).some((id) => id.toString() === requesterId)) {
    return { success: false as const, error: "This user isn't accepting requests" };
  }

  const existing = await Connection.findOne({ requesterId, recipientId, context });
  if (existing?.status === "accepted") {
    return { success: true as const, connection: existing };
  }

  // Upsert, but explicitly reset to "pending" on every send — otherwise re-requesting after
  // a decline would silently no-op (the old document already exists, so an insert-only
  // $setOnInsert never fires) and the recipient would never see the new request.
  const connection = await Connection.findOneAndUpdate(
    { requesterId, recipientId, context },
    { $set: { status: "pending", message: message ?? null, respondedAt: null } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  return { success: true as const, connection };
}

export async function respondToConnectionRequest(userId: string, connectionId: string, status: "accepted" | "declined") {
  await connectDB();
  const connection = await Connection.findOneAndUpdate(
    { _id: connectionId, recipientId: userId, status: "pending" },
    { status, respondedAt: new Date() },
    { returnDocument: "after" },
  );
  if (!connection) {
    return { success: false as const, error: "Request not found" };
  }
  return { success: true as const, connection };
}

export async function listIncomingRequests(userId: string) {
  await connectDB();
  return Connection.find({ recipientId: userId, status: "pending" })
    .sort({ createdAt: -1 })
    .populate("requesterId", "name avatar gender college verified")
    .lean();
}

export async function listOutgoingRequests(userId: string) {
  await connectDB();
  return Connection.find({ requesterId: userId })
    .sort({ createdAt: -1 })
    .populate("recipientId", "name avatar gender college verified")
    .lean();
}

export async function listAcceptedConnections(userId: string) {
  await connectDB();
  return Connection.find({
    status: "accepted",
    $or: [{ requesterId: userId }, { recipientId: userId }],
  })
    .sort({ respondedAt: -1 })
    .populate("requesterId", "name avatar gender college verified")
    .populate("recipientId", "name avatar gender college verified")
    .lean();
}

export async function blockUser(userId: string, targetUserId: string) {
  await connectDB();
  if (userId === targetUserId) {
    return { success: false as const, error: "You can't block yourself" };
  }
  await User.findByIdAndUpdate(userId, { $addToSet: { blockedUserIds: targetUserId } });
  // Any pending requests between the two are no longer actionable.
  await Connection.updateMany(
    {
      status: "pending",
      $or: [
        { requesterId: userId, recipientId: targetUserId },
        { requesterId: targetUserId, recipientId: userId },
      ],
    },
    { status: "declined", respondedAt: new Date() },
  );
  return { success: true as const };
}

export async function unblockUser(userId: string, targetUserId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $pull: { blockedUserIds: targetUserId } });
  return { success: true as const };
}

export async function listBlockedUsers(userId: string) {
  await connectDB();
  const user = await User.findById(userId).populate("blockedUserIds", "name avatar mobile").lean();
  return user?.blockedUserIds ?? [];
}
