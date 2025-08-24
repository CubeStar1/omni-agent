"use client";

import { LogOut, MoreHorizontal, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Avatar from "@/components/supaauth/avatar";
import { createSupabaseBrowser } from "@/lib/supabase/client";
export function NavProfile({ user }: { user: any }) {
  const router = useRouter();
  const [isSignOut, startSignOut] = useTransition();
  const signout = () => {
    startSignOut(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/signin");
    });
  };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                {
                  "animate-pulse": isSignOut,
                },
              )}
            >
              <Avatar />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.email}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <MoreHorizontal className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => document.getElementById("manage-profile")?.click()}
            >
              <User className="mr-2 h-4 w-4" />
              Manage Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signout}>
              {!isSignOut ? (
                <LogOut className="mr-2 h-4 w-4" />
              ) : (
                <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
