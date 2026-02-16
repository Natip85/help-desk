"use client";

import Link from "next/link";
import { BellDot, CheckCircleIcon, ChevronDown, MailIcon, Ticket, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/features/global-search/global-search";
import { authClient } from "@/lib/auth-client";
import { NavUserAvatar } from "./nav-user-avatar";

export function Header() {
  const { data: session } = authClient.useSession();
  return (
    <header className="bg-background sticky top-0 right-0 left-0 z-50 w-full">
      <div className="flex h-16 items-center justify-between pr-3 pl-12 sm:px-5 md:px-8">
        <Link
          href="/"
          className="ml-8 hidden items-center gap-2 md:ml-0 md:flex"
        >
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <CheckCircleIcon className="text-background h-4 w-4" />
          </div>
          <span className="text-foreground text-xl font-semibold tracking-tight">Help Desk</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-5">
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="sm:size-default"
                >
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
                  <Link href="#">
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

          {session && <BellDot className="size-5 shrink-0" />}
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
