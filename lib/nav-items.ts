import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  StickyNote,
  FileText,
  PhoneCall,
  Heart,
  ShoppingBag,
  BookOpen,
  Search,
  UserRound,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checklist", label: "Checklist", icon: ListChecks },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/contacts", label: "Emergency Contacts", icon: PhoneCall },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/guide", label: "Hostel Guide", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
];

export const PROFILE_NAV_ITEM: NavItem = {
  href: "/profile",
  label: "Profile",
  icon: UserRound,
};

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
};

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  PRIMARY_NAV_ITEMS[0],
  PRIMARY_NAV_ITEMS[1],
  PRIMARY_NAV_ITEMS[2],
  PRIMARY_NAV_ITEMS[8],
];
