import { MAX_BOTTOM_ITEMS, type NavLayoutEntry, type NavPlacement } from "@/features/nav/nav-layout";

export function groupSorted(entries: NavLayoutEntry[], placement: NavPlacement): NavLayoutEntry[] {
  return entries.filter((e) => e.placement === placement).sort((a, b) => a.order - b.order);
}

/** Swaps `id` with its neighbor in the given direction, within its own placement group, and
 * renumbers that group's `order` to 0..n-1 so it stays gap-free. */
export function moveWithinGroup(entries: NavLayoutEntry[], id: string, direction: -1 | 1): NavLayoutEntry[] {
  const target = entries.find((e) => e.id === id);
  if (!target) return entries;

  const group = groupSorted(entries, target.placement);
  const index = group.findIndex((e) => e.id === id);
  const swapIndex = index + direction;
  if (swapIndex < 0 || swapIndex >= group.length) return entries;

  const reordered = [...group];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  const orderById = new Map(reordered.map((e, i) => [e.id, i]));

  return entries.map((e) => (e.placement === target.placement ? { ...e, order: orderById.get(e.id) ?? e.order } : e));
}

/** Moves `id` into a different placement group, appended at the end, then renumbers the group
 * it left (closing the gap). Rejects the move (with an explanatory error, unchanged entries)
 * if it would push the bottom bar past MAX_BOTTOM_ITEMS. */
export function movePlacement(
  entries: NavLayoutEntry[],
  id: string,
  placement: NavPlacement,
): { entries: NavLayoutEntry[]; error?: string } {
  const target = entries.find((e) => e.id === id);
  if (!target || target.placement === placement) return { entries };

  if (placement === "bottom" && groupSorted(entries, "bottom").length >= MAX_BOTTOM_ITEMS) {
    return { entries, error: `The bottom bar can hold at most ${MAX_BOTTOM_ITEMS} items — move one out first.` };
  }

  const destinationSize = groupSorted(entries, placement).length;
  const moved = entries.map((e) => (e.id === id ? { ...e, placement, order: destinationSize } : e));

  const remainingSource = groupSorted(moved, target.placement);
  const orderById = new Map(remainingSource.map((e, i) => [e.id, i]));
  const renumbered = moved.map((e) => (e.placement === target.placement ? { ...e, order: orderById.get(e.id) ?? e.order } : e));

  return { entries: renumbered };
}
