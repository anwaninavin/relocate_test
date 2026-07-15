import { Types } from "mongoose";

import { connectDB } from "@/db";
import { Conversation } from "@/models/Conversation";
import { ReadState } from "@/models/ReadState";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { serializePublicUser } from "@/services/communityService";

function dmKeyFor(userIdA: string, userIdB: string) {
  return [userIdA, userIdB].sort().join(":");
}

export async function findOrCreateDirectConversation(userIdA: string, userIdB: string) {
  await connectDB();
  if (userIdA === userIdB) return { success: false as const, error: "You can't message yourself" };

  const [me, other] = await Promise.all([User.findById(userIdA).lean(), User.findById(userIdB).lean()]);
  if (!other) return { success: false as const, error: "User not found" };

  const iBlockedThem = (me?.blockedUserIds ?? []).some((id) => id.toString() === userIdB);
  const theyBlockedMe = (other.blockedUserIds ?? []).some((id) => id.toString() === userIdA);
  if (iBlockedThem || theyBlockedMe) {
    return { success: false as const, error: "You can't message this user" };
  }

  const dmKey = dmKeyFor(userIdA, userIdB);
  const conversation = await Conversation.findOneAndUpdate(
    { dmKey },
    { $setOnInsert: { type: "dm", memberIds: [userIdA, userIdB], createdBy: userIdA, dmKey } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return { success: true as const, conversation };
}

export async function createGroupConversation(creatorId: string, memberIds: string[], name?: string) {
  await connectDB();
  const uniqueMembers = [...new Set([creatorId, ...memberIds])];
  const conversation = await Conversation.create({
    type: "group",
    memberIds: uniqueMembers,
    name: name ?? null,
    createdBy: creatorId,
  });
  return conversation;
}

export async function isConversationMember(conversationId: string, userId: string) {
  await connectDB();
  const conversation = await Conversation.findOne({ _id: conversationId, memberIds: userId }).lean();
  return conversation;
}

export async function listConversations(userId: string) {
  await connectDB();
  const conversations = await Conversation.find({ memberIds: userId })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .populate("memberIds", "username displayName avatar verified")
    .lean();

  const readStates = await ReadState.find({ userId, scopeType: "conversation" }).lean();
  const readByConversation = new Map(readStates.map((r) => [r.scopeId.toString(), r.lastReadAt]));

  // One aggregation instead of one countDocuments() per conversation (up to 100 round trips
  // per inbox load otherwise) — each conversation has its own lastRead cutoff, so the $match
  // is an $or of per-conversation {scopeId, createdAt} conditions rather than one shared filter.
  const userObjectId = new Types.ObjectId(userId);
  const unreadCountByConversation = new Map<string, number>();
  if (conversations.length > 0) {
    const unreadCountRows = await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
      {
        $match: {
          scopeType: "conversation",
          authorId: { $ne: userObjectId },
          deletedAt: null,
          $or: conversations.map((c) => ({
            scopeId: c._id,
            createdAt: { $gt: readByConversation.get(c._id.toString()) ?? new Date(0) },
          })),
        },
      },
      { $group: { _id: "$scopeId", count: { $sum: 1 } } },
    ]);
    for (const row of unreadCountRows) {
      unreadCountByConversation.set(row._id.toString(), row.count);
    }
  }
  const unreadCounts = conversations.map((c) => unreadCountByConversation.get(c._id.toString()) ?? 0);

  return conversations.map((c, i) => {
    const others = (c.memberIds as unknown as Array<{ _id: unknown }>).filter((m) => String(m._id) !== userId);
    return {
      id: c._id.toString(),
      type: c.type,
      name: c.name,
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: c.lastMessagePreview,
      unreadCount: unreadCounts[i],
      members: others.map((m) => serializePublicUser(m as never)),
    };
  });
}
