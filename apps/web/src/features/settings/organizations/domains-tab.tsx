"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/trpc";
import { AddDomainDialog } from "./add-domain-dialog";
import { DnsRecordsDialog } from "./dns-records-dialog";

type DnsRecord = {
  record: string;
  name: string;
  type: string;
  ttl: string;
  status: string;
  value: string;
  priority?: number;
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <Badge className="border-green-600 bg-green-500/10 text-green-600">Verified</Badge>;
    case "pending":
    case "not_started":
      return <Badge className="border-yellow-600 bg-yellow-500/10 text-yellow-600">Pending</Badge>;
    case "failed":
    case "temporary_failure":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function DomainsTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dnsRecordsDomain, setDnsRecordsDomain] = useState<{
    domainName: string;
    records: DnsRecord[];
  } | null>(null);

  const { data } = useQuery(trpc.domain.list.queryOptions());

  const { mutate: verifyDomain, isPending: isVerifying } = useMutation(
    trpc.domain.verify.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({ queryKey: trpc.domain.list.queryKey() });
        if (data?.status === "verified") {
          toast.success("Domain verified successfully!");
        } else {
          toast.info("Verification initiated. DNS changes may take a few minutes to propagate.");
        }
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to verify domain");
      },
    })
  );

  const { mutate: deleteDomain, isPending: isDeleting } = useMutation(
    trpc.domain.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.domain.list.queryKey() });
        toast.success("Domain deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete domain");
      },
    })
  );

  const domains = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)}>Add Domain</Button>
      </div>

      {domains.length === 0 ?
        <p className="text-muted-foreground py-8 text-center text-sm">
          No domains configured yet. Add one to start sending and receiving emails.
        </p>
      : <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>DNS Records</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow
                key={d.id}
                className="hover:bg-transparent"
              >
                <TableCell className="font-medium">{d.domain}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell>
                  {d.dnsRecords && d.dnsRecords.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDnsRecordsDomain({
                          domainName: d.domain,
                          records: d.dnsRecords as DnsRecord[],
                        })
                      }
                    >
                      View Records
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {d.status !== "verified" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isVerifying}
                        onClick={() => verifyDomain({ id: d.id })}
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    )}
                    <DeleteDomainButton
                      domainId={d.id}
                      domainName={d.domain}
                      onDelete={deleteDomain}
                      isDeleting={isDeleting}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }

      <AddDomainDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onDomainCreated={(domainName: string, records: unknown[]) => {
          setDnsRecordsDomain({ domainName, records: records as DnsRecord[] });
        }}
      />

      {dnsRecordsDomain && (
        <DnsRecordsDialog
          open={!!dnsRecordsDomain}
          onOpenChange={(open: boolean) => {
            if (!open) setDnsRecordsDomain(null);
          }}
          domainName={dnsRecordsDomain.domainName}
          records={dnsRecordsDomain.records}
        />
      )}
    </div>
  );
}

function DeleteDomainButton({
  domainId,
  domainName,
  onDelete,
  isDeleting,
}: {
  domainId: string;
  domainName: string;
  onDelete: (input: { id: string }) => void;
  isDeleting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Domain</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the domain &quot;{domainName}&quot;? This will also
            remove it from Resend. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete({ id: domainId });
              setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
