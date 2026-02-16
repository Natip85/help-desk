"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreateOrganizationDialog } from "@/features/settings/organizations/create-organization-dialog";
import { authClient } from "@/lib/auth-client";

export function OrgSwitcher() {
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();

  async function handleSwitchOrg(orgId: string) {
    const res = await authClient.organization.setActive({ organizationId: orgId });
    if (res.error) {
      toast.error(res.error.message ?? "Failed to switch organization");
      return;
    }
    toast.success("Switched organization");
    await queryClient.invalidateQueries();
    window.location.assign("/tickets");
  }

  const displayName = activeOrg?.name ?? "Select Organization";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary/10 text-primary flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold">
                {activeOrg?.logo ?
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeOrg.logo}
                    alt={displayName}
                    className="size-8 rounded-lg object-cover"
                  />
                : initials || <Building2 className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {organizations?.map((org) => {
              const isActive = org.id === activeOrg?.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  className="gap-3 p-2"
                >
                  <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded text-xs font-semibold">
                    {org.logo ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="size-6 rounded object-cover"
                      />
                    : org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {isActive && <Check className="text-primary size-4" />}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setCreateDialogOpen(true)}
              className="gap-3 p-2"
            >
              <div className="bg-muted flex size-6 items-center justify-center rounded">
                <Plus className="size-4" />
              </div>
              <span>Create Organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateOrganizationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
