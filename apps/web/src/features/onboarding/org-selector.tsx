"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationDialog } from "@/features/settings/organizations/create-organization-dialog";
import { authClient } from "@/lib/auth-client";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: string | null;
};

type OrgSelectorProps = {
  organizations: Organization[];
  activeOrganizationId: string | null;
};

export function OrgSelector({ organizations, activeOrganizationId }: OrgSelectorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  async function handleSelectOrg(orgId: string) {
    setSwitchingId(orgId);
    try {
      const res = await authClient.organization.setActive({ organizationId: orgId });
      if (res.error) {
        toast.error(res.error.message ?? "Failed to select organization");
        setSwitchingId(null);
        return;
      }
      await queryClient.invalidateQueries();
      router.push("/tickets");
    } catch {
      toast.error("Failed to select organization");
      setSwitchingId(null);
    }
  }

  function handleCreateSuccess() {
    router.push("/tickets");
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Select a Workspace</h1>
          <p className="text-muted-foreground mt-2">
            Choose the organization you want to work in, or create a new one.
          </p>
        </div>

        <div className="grid gap-3">
          {organizations.map((org) => {
            const isActive = org.id === activeOrganizationId;
            const isSwitching = switchingId === org.id;

            return (
              <Card
                key={org.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleSelectOrg(org.id)}
              >
                <CardHeader className="flex-row items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    {org.logo ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    : <Building2 className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    {org.slug && <CardDescription className="text-xs">{org.slug}</CardDescription>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isActive && (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Check className="h-3 w-3" />
                        Current
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={isActive ? "outline" : "default"}
                      disabled={switchingId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleSelectOrg(org.id);
                      }}
                    >
                      {isSwitching ? "Switching..." : "Continue"}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Organization
          </Button>
        </div>

        <CreateOrganizationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  );
}
