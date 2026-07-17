/** Last-known admin layout payloads, persisted so a returning user's home cards and nav paint
 * in their real configured shape on the very next load, instead of rendering the shipped
 * defaults and visibly correcting them a round-trip later.
 *
 * Unlike features/checklist/checklist-cache.ts these need no per-user scoping: both
 * /api/home/layout and /api/nav/layout are global admin configuration, identical for every
 * user (their handlers take no user argument), so there's nothing here to leak between two
 * students sharing a device.
 */

export const HOME_LAYOUT_STORAGE_KEY = "pwm_home_layout_cache";
export const NAV_LAYOUT_STORAGE_KEY = "pwm_nav_layout_cache";

/** Wrapper mirroring the API's `{ widgets }` envelope. Storing the envelope rather than a bare
 * array keeps "nothing cached yet" (`undefined`) distinct from "cached the fact that no admin
 * layout is saved" (`{ widgets: null }`) — the latter is a real answer worth replaying, since
 * it means the defaults are correct and the next load needn't wait to find that out. */
export interface PersistedLayout<T> {
  widgets: T[] | null;
}

/** Last-known layout for `key`, or `undefined` if there's none. Any storage/parse failure is
 * swallowed — this is a progressive-enhancement fast path, never a source of truth, so a miss
 * just falls back to fetching before first paint. */
export function readPersistedLayout<T>(key: string): PersistedLayout<T> | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedLayout<T>;
    if (parsed.widgets !== null && !Array.isArray(parsed.widgets)) return undefined;
    return { widgets: parsed.widgets };
  } catch {
    return undefined;
  }
}

export function writePersistedLayout<T>(key: string, widgets: T[] | null) {
  try {
    localStorage.setItem(key, JSON.stringify({ widgets } satisfies PersistedLayout<T>));
  } catch {
    // localStorage full/disabled (private mode, quota) — non-fatal, we just lose the correct
    // first paint on the next load and fall back to the skeleton + fetch.
  }
}
