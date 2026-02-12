"use client";

import { useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/trpc";
import { ContactConversationsTab } from "./contact-conversations-tab";
import { ContactRecentTickets } from "./contact-recent-tickets";
import { ContactSidebarHeader } from "./contact-sidebar-header";
import { ContactTimeline } from "./contact-timeline";
import { useSidebarParams } from "./query-params";

export const ContactInfoSidebar = () => {
  const trpc = useTRPC();
  const {
    sidebarParams: { contactId },
    setSidebarParams,
  } = useSidebarParams();

  const [activeTab, setActiveTab] = useState<"overview" | "conversations">("overview");

  const contactQuery = useQuery(trpc.contact.getById.queryOptions(contactId ?? skipToken));

  const data = contactQuery.data;

  if (contactQuery.isPending) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </SidebarContent>
        <SidebarFooter className="border-accent/50 border-t p-3">
          <Skeleton className="h-8 w-full" />
        </SidebarFooter>
      </>
    );
  }

  if (contactQuery.isError) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-2">
          <h2 className="text-lg font-medium">Contact Info</h2>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Failed to load contact</p>
            <p className="text-muted-foreground text-sm">{contactQuery.error.message}</p>
            <Button
              variant="outline"
              onClick={() => contactQuery.refetch()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </SidebarContent>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-2">
          <h2 className="text-lg font-medium">Contact Info</h2>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Contact not found</p>
            <p className="text-muted-foreground text-sm">
              This contact may have been deleted or you don't have access to it.
            </p>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-accent/50 border-t p-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void setSidebarParams(null)}
          >
            Close
          </Button>
        </SidebarFooter>
      </>
    );
  }

  return (
    <>
      <ContactSidebarHeader
        contact={data.contact}
        company={data.company}
      />

      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-2">
        <Tabs
          value={activeTab}
          onValueChange={(t) => setActiveTab(t as typeof activeTab)}
        >
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-0"
          >
            <ContactRecentTickets tickets={data.recentTickets} />
            <Separator className="my-4" />
            <ContactTimeline events={data.recentEvents} />
          </TabsContent>

          <TabsContent
            value="conversations"
            className="mt-0"
          >
            <ContactConversationsTab
              contactId={data.contact.id}
              contactEmail={data.contact.email}
            />
          </TabsContent>
        </Tabs>
      </SidebarContent>

      <SidebarFooter className="border-accent/50 border-t p-3">
        <Button
          className="w-full"
          onClick={() => void setSidebarParams(null)}
        >
          Close
        </Button>
      </SidebarFooter>
    </>
  );
};
