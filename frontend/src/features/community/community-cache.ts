import type { CommunityDTO } from "@/types";

/** Last-known "My Communities" list, persisted so a returning user's default tab paints
 * instantly instead of a skeleton on every visit — the network still revalidates in the
 * background. Same stale-while-revalidate contract as checklist-cache.ts, including the
 * per-user scoping: on a shared hostel-room device, a different student's reload must never
 * paint the previous student's communities. */
interface StoredEntry {
  userId: string;
  communities: CommunityDTO[];
}

const STORAGE_KEY = "pwm_my_communities_cache";

export function readPersistedMyCommunities(userId: string | undefined): CommunityDTO[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry;
    if (parsed.userId !== userId || !Array.isArray(parsed.communities)) return null;
    return parsed.communities;
  } catch {
    return null;
  }
}

export function writePersistedMyCommunities(userId: string | undefined, communities: CommunityDTO[]) {
  if (!userId) return;
  try {
    const entry: StoredEntry = { userId, communities };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage full/disabled — non-fatal, we just lose the instant first paint.
  }
}

export function clearPersistedMyCommunities() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — nothing we can do, and it isn't worth surfacing.
  }
}
