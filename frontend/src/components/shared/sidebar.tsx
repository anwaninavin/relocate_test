import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { emitComingSoon } from "@/lib/coming-soon-bus";
import { ADMIN_NAV_ITEM, HOME_ROUTE, type NavItem } from "@/lib/nav-items";
import { BrandName } from "@/components/shared/brand-name";

export function Sidebar({
  isAdmin,
  items,
  disabledHrefs,
}: {
  isAdmin: boolean;
  items: NavItem[];
  disabledHrefs: Set<string>;
}) {
  const { pathname } = useLocation();

  const allItems = [...items, ...(isAdmin ? [ADMIN_NAV_ITEM] : [])];

  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex">
      <Link to={HOME_ROUTE} className="mb-8 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="" width={36} height={36} className="shrink-0" />
        <BrandName className="text-lg" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {allItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const className = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          );
          const content = (
            <>
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </>
          );

          if (disabledHrefs.has(item.href)) {
            return (
              <button key={item.href} type="button" onClick={() => emitComingSoon(item.label)} className={className}>
                {content}
              </button>
            );
          }

          return (
            <Link key={item.href} to={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
