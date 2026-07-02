"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { BrandName } from "@/components/shared/brand-name";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { GlobalSearch } from "@/features/search/global-search";

interface NavbarProps {
  name: string | null;
  mobile: string;
  avatar: string | null;
  isAdmin: boolean;
}

export function Navbar({ name, mobile, avatar, isAdmin }: NavbarProps) {
  const initials = (name ?? mobile.slice(-2)).slice(0, 2).toUpperCase();

  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Image src="/logo.png" alt="" width={24} height={24} />
        <BrandName />
      </div>
      <div className="hidden flex-1 lg:block">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <GlobalSearch />
        </div>
        <div className="lg:hidden">
          <OverflowMenu isAdmin={isAdmin} />
        </div>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            <Avatar>
              {avatar && <AvatarImage src={avatar} alt={name ?? "Profile"} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2.5 py-1.5">
              <p className="text-sm font-medium">{name ?? "Student"}</p>
              <p className="text-muted-foreground text-xs">+{mobile}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
