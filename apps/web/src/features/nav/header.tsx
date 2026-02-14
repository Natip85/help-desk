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
import { NavUserAvatar } from "./nav-user-avatar";

export function Header() {
  return (
    <header className="bg-background sticky top-0 right-0 left-0 z-50 w-full">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Logo */}
        <Link
          href="/"
          className="ml-8 hidden items-center gap-2 md:ml-0 md:flex"
        >
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <CheckCircleIcon className="text-background h-4 w-4" />
          </div>
          <span className="text-foreground text-xl font-semibold tracking-tight">Help Desk</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-5">
          {/* Create Ticket/email Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
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
                <Link href="#">
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

          <Separator
            orientation="vertical"
            className="bg-accent"
          />

          {/* Global search */}
          <GlobalSearch />

          <BellDot className="size-8" />

          <Separator
            orientation="vertical"
            className="bg-accent"
          />

          <NavUserAvatar />
        </div>
      </div>
    </header>
  );
}
