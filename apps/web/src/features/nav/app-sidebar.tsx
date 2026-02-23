"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";

import { AnimatedLayoutTemplate } from "@/components/icons/animated-layout-template";
import { AnimatedSettings } from "@/components/icons/animated-settings";
import { AnimatedTicket } from "@/components/icons/animated-ticket";
import { AnimatedTickets } from "@/components/icons/animated-tickets";
import { AnimatedTrash2 } from "@/components/icons/animated-trash";
import { AnimatedUsers2 } from "@/components/icons/animated-users";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavMain } from "./nav-main";
import { OrgSwitcher } from "./org-switcher";

function CustomSidebarTrigger() {
  const { state } = useSidebar();
  return (
    <SidebarTrigger
      className={cn(
        "bg-background text-foreground hover:bg-sidebar hover:text-sidebar-foreground absolute -right-4 bottom-10 z-50 rounded-full border-0 transition-all duration-300 ease-in-out",
        "[&_svg]:transition-all [&_svg]:duration-300 [&_svg]:ease-in-out active:[&_svg]:scale-125",
        state === "collapsed" ? "cursor-e-resize" : "cursor-w-resize"
      )}
      variant="ghost"
      size="icon"
    >
      {state === "collapsed" ?
        <ChevronsRight />
      : <ChevronsLeft />}
    </SidebarTrigger>
  );
}

function MobileSidebarTrigger() {
  return (
    <SidebarTrigger
      className="hover:bg-accent fixed top-4 left-2 z-50 md:hidden"
      variant="ghost"
      size="icon"
    >
      <Menu className="h-5 w-5" />
    </SidebarTrigger>
  );
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: AnimatedLayoutTemplate,
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: AnimatedTicket,
      useDropdownMenu: true,
      submenu: [
        {
          title: "All tickets",
          url: "/tickets",
          icon: AnimatedTickets,
        },
        {
          title: "Trash",
          url: "/tickets/trash",
          icon: AnimatedTrash2,
        },
      ],
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: AnimatedUsers2,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: AnimatedSettings,
    },
  ],
  footerItems: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <>
      <MobileSidebarTrigger />
      <Sidebar
        className="pt-4"
        collapsible="icon"
        {...props}
      >
        <CustomSidebarTrigger />
        <SidebarHeader>
          <OrgSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={data.navMain}
            footerItems={data.footerItems}
          />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
