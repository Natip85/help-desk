"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutTemplate,
  Menu,
  Settings,
  Ticket,
  Tickets,
  Trash2,
  Users2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
      icon: LayoutTemplate,
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: Ticket,
      useDropdownMenu: true,
      submenu: [
        {
          title: "All tickets",
          url: "/tickets",
          icon: Tickets,
        },
        {
          title: "Trash",
          url: "/tickets/trash",
          icon: Trash2,
        },
      ],
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users2,
    },
  ],
  footerItems: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
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
        <SidebarFooter></SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
