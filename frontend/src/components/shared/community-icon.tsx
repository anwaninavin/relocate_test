import { createLucideIcon } from "lucide-react";

/** Lucide's built-in "Users"/"UsersRound" icons are two-person glyphs — the Community nav
 * item wants the three-person cluster WhatsApp uses for its Community tab (one figure in
 * front, two smaller ones peeking out behind). Built with lucide's own icon factory so it's
 * a drop-in `LucideIcon` — same size/color/strokeWidth props as every other nav icon. */
export const CommunityIcon = createLucideIcon("community", [
  ["circle", { cx: "6", cy: "7", r: "3", key: "community-head-back-left" }],
  ["path", { d: "M2 21v-1a4 4 0 0 1 4-4h1", key: "community-body-back-left" }],
  ["circle", { cx: "18", cy: "7", r: "3", key: "community-head-back-right" }],
  ["path", { d: "M17 16h1a4 4 0 0 1 4 4v1", key: "community-body-back-right" }],
  ["circle", { cx: "12", cy: "9", r: "4", key: "community-head-front" }],
  ["path", { d: "M5 21v-1a7 7 0 0 1 14 0v1", key: "community-body-front" }],
]);
