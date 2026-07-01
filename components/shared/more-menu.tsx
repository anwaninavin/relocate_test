"use client";

import Link from "next/link";

import { ADMIN_NAV_ITEM, PRIMARY_NAV_ITEMS, PROFILE_NAV_ITEM } from "@/lib/nav-items";

export function MoreMenu({ isAdmin }: { isAdmin: boolean }) {
  const items = [
    ...PRIMARY_NAV_ITEMS.slice(3),
    PROFILE_NAV_ITEM,
    ...(isAdmin ? [ADMIN_NAV_ITEM] : []),
  ];

  return (
    <div className="grid grid-cols-3 gap-3 py-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="bg-muted hover:bg-muted/70 flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-xs font-medium transition-colors"
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
