"use client";

import Link from "next/link";
import { BellDot, CheckCircleIcon, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
          {/* Global search */}
          <GlobalSearch />
          <Button>
            <Plus />
            New
            <ChevronDown />
          </Button>
          <BellDot className="size-8" />
          <NavUserAvatar />
        </div>
      </div>
    </header>
  );
}
