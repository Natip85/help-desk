"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MailIcon, Ticket, User } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/features/global-search/global-search";
import { usePusherNotifications } from "@/hooks/use-pusher";
import { authClient } from "@/lib/auth-client";
import { NotificationBell } from "../notifications/notification-bell";
import { NavUserAvatar } from "./nav-user-avatar";

export function Header() {
  const { data: session } = authClient.useSession();
  usePusherNotifications();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? "/logo.png" : "/logo.png";
  return (
    <header className="bg-background sticky top-0 right-0 left-0 z-50 w-full">
      <div className="flex h-16 items-center justify-between pr-3 pl-12 sm:px-5 md:px-8">
        <Link
          href="/"
          className="relative ml-8 hidden size-14 items-center gap-2 md:ml-0 md:flex"
        >
          <Image
            src={logo}
            alt="Yarcone"
            fill
            className="scale-200 object-contain"
          />
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-5">
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="sm:size-default">
                  Create
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/tickets/new">
                    <Ticket />
                    Ticket
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/emails/new">
                    <MailIcon />
                    Email
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contacts/new">
                    <User />
                    Contact
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {session && (
            <Separator
              orientation="vertical"
              className="bg-accent hidden sm:block"
            />
          )}
          {session && <GlobalSearch />}

          {session && <NotificationBell />}
          {session && (
            <Separator
              orientation="vertical"
              className="bg-accent hidden sm:block"
            />
          )}
          <NavUserAvatar />
        </div>
      </div>
    </header>
  );
}
