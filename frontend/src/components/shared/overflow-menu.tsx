import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { emitComingSoon } from "@/lib/coming-soon-bus";
import { ADMIN_NAV_ITEM, type NavItem } from "@/lib/nav-items";

export function OverflowMenu({
  isAdmin,
  items,
  disabledHrefs,
}: {
  isAdmin: boolean;
  items: NavItem[];
  disabledHrefs: Set<string>;
}) {
  const allItems = [...items, ...(isAdmin ? [ADMIN_NAV_ITEM] : [])];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {allItems.map((item) => {
          const Icon = item.icon;
          if (disabledHrefs.has(item.href)) {
            return (
              <DropdownMenuItem
                key={item.href}
                onSelect={(e) => {
                  e.preventDefault();
                  emitComingSoon(item.label);
                }}
              >
                <Icon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link to={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">{__APP_VERSION__}</DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
