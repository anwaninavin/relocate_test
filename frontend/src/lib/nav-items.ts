import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutDashboard,
  ListChecks,
  Luggage,
  Wallet,
  StickyNote,
  FileText,
  PhoneCall,
  Heart,
  ShoppingBag,
  BookOpen,
  UserRound,
  ShieldCheck,
  Settings,
  Users,
  Ticket,
  Compass,
  MessageCircle,
} from "lucide-react";

import { CommunityIcon } from "@/components/shared/community-icon";

export { HOME_ROUTE } from "@/lib/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/wa-login/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/community", label: "Community", icon: CommunityIcon },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/checklist", label: "Checklist", icon: ListChecks },
  { href: "/bags", label: "Bags", icon: Luggage },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/contacts", label: "Emergency Contacts", icon: PhoneCall },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/guide/survival-guide", label: "Hostel Guide", icon: BookOpen },
  { href: "/discover", label: "Discover", icon: Users },
  { href: "/bookings", label: "Bookings", icon: Ticket },
  { href: "/explore", label: "Explore", icon: Compass },
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

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

/** Every nav item an admin can independently show/hide, place in the bottom tab bar vs the
 * "more" (3-dot) overflow menu, and reorder — see features/nav/nav-layout.ts for the
 * admin-configurable layout built from this list. Settings/Admin are deliberately not part
 * of this set: they're system entries, always pinned at the end of the overflow menu (and
 * the desktop sidebar), not a "feature" an admin would hide or reposition. */
export const CONFIGURABLE_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, PROFILE_NAV_ITEM];
