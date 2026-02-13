"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null | undefined;
  createdAt: Date;
  metadata?: unknown;
};

type OrganizationRowProps = {
  organization: Organization;
  activeOrgId?: string | null;
  memberCount?: number;
};

export function OrganizationRow({ organization, activeOrgId, memberCount }: OrganizationRowProps) {
  const router = useRouter();
  const isActive = activeOrgId === organization.id;

  async function handleSetActive() {
    const res = await authClient.organization.setActive({ organizationId: organization.id });

    if (res.error) {
      toast.error(res.error.message ?? "Failed to switch organization");
    } else {
      toast.success(`Switched to ${organization.name}`);
      router.refresh();
    }
  }

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="default">
            {organization.logo ?
              <AvatarImage
                src={organization.logo}
                alt={organization.name}
              />
            : null}
            <AvatarFallback>
              <Building2 className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{organization.name}</span>
            <span className="text-muted-foreground text-xs">/{organization.slug}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {isActive ?
          <Badge variant="default">Active</Badge>
        : <Badge variant="outline">Inactive</Badge>}
      </TableCell>
      <TableCell>
        {memberCount !== undefined ?
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Users className="size-3.5" />
            <span>{memberCount}</span>
          </div>
        : <span className="text-muted-foreground text-sm">—</span>}
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {new Date(organization.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-3">
          {!isActive && (
            <Button onClick={handleSetActive}>
              <CheckCircle2 className="size-4" />
              Set as Active
            </Button>
          )}
          <Button
            variant="ghost"
            asChild
          >
            <Link href={`/settings/organizations/${organization.id}`}>
              Manage
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
