"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const [left, right] = [BOTTOM_NAV_ITEMS.slice(0, 2), BOTTOM_NAV_ITEMS.slice(2)];

  function renderItem(item: (typeof BOTTOM_NAV_ITEMS)[number]) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className={cn("size-5", active && "scale-110")} />
        {item.label}
      </Link>
    );
  }

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-6 px-2 pt-2 sm:gap-10 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      {left.map(renderItem)}
      {/* Slot for the FAB, rendered separately (as a fixed overlay) by the dashboard layout. */}
      <div className="w-12 shrink-0" aria-hidden="true" />
      {right.map(renderItem)}
    </nav>
  );
}
