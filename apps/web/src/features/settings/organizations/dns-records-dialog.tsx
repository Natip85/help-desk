"use client";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DnsRecord = {
  record: string;
  name: string;
  type: string;
  ttl: string;
  status: string;
  value: string;
  priority?: number;
};

type DnsRecordsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  records: DnsRecord[];
};

function RecordStatusBadge({ status }: { status: string }) {
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

export function DnsRecordsDialog({
  open,
  onOpenChange,
  domainName,
  records,
}: DnsRecordsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>DNS Records for {domainName}</DialogTitle>
          <DialogDescription>
            Add the following DNS records to your domain provider to verify ownership and enable
            email delivery. DNS changes can take up to 72 hours to propagate.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => (
                <TableRow
                  key={`${record.record}-${index}`}
                  className="hover:bg-transparent"
                >
                  <TableCell>
                    <Badge variant="outline">{record.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted rounded px-1 py-0.5 text-xs break-all">
                      {record.name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted rounded px-1 py-0.5 text-xs break-all">
                      {record.priority != null ?
                        `${record.priority} ${record.value}`
                      : record.value}
                    </code>
                  </TableCell>
                  <TableCell>
                    <RecordStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>
                    <CopyButton
                      value={record.value}
                      label={`Copy ${record.record} value`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
