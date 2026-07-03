"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useProfileDisplayName } from "@/hooks/use-profile-display-name";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const isAdmin = useIsAdmin();
  const { displayName } = useProfileDisplayName();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    // Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("Failed to clear local storage", e);
    }

    // Clear all cookies
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
        
        const domainParts = window.location.hostname.split(".");
        if (domainParts.length > 2) {
          const rootDomain = domainParts.slice(-2).join(".");
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain};`;
        }
      }
    } catch (e) {
      console.error("Failed to clear cookies", e);
    }

    await signOut({ redirectUrl: ROUTES.home });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-11 w-11 rounded-full group transition-all duration-300 hover:bg-white/5 active:scale-95" aria-label="User menu">
          <Avatar className="h-9 w-9 border border-border transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <AvatarImage src={user?.imageUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{displayName}</span>
            {email && (
              <span className="text-xs font-normal text-muted-foreground">{email}</span>
            )}
            <CoinBalanceBadge variant="menu" className="px-0 py-0" />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.profile} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.settings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={ROUTES.admin} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Admin panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
