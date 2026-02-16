"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import type { ExportForm } from "@help-desk/db/validators";
import type {
  contactExportableFields,
  ticketExportableFields,
} from "@help-desk/db/validators/export-form";
import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTRPC } from "@/trpc";
import { CreatedDateFilter } from "./created-date-filter";
import { useTicketSearchParams } from "./search-params";

const TICKET_FIELD_OPTIONS = [
  { key: "id", label: "Ticket ID" },
  { key: "subject", label: "Subject" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "channel", label: "Channel" },
  { key: "assignedTo", label: "Assigned Agent" },
  { key: "company", label: "Company" },
  { key: "tags", label: "Tags" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" },
  { key: "lastMessageAt", label: "Last Message At" },
  { key: "closedAt", label: "Closed At" },
] as const satisfies readonly {
  key: (typeof ticketExportableFields)[number];
  label: string;
}[];

const CONTACT_FIELD_OPTIONS = [
  { key: "contactName", label: "Name" },
  { key: "contactEmail", label: "Email" },
  { key: "contactPhone", label: "Phone" },
] as const satisfies readonly {
  key: (typeof contactExportableFields)[number];
  label: string;
}[];

type ExportFormat = ExportForm["format"];
type DateRangeValue = TicketFilter["createdAt"];

function downloadFile(data: ArrayBuffer | string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function exportToFile(rows: Record<string, string>[], format: ExportFormat) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    downloadFile(csv, "tickets-export.csv", "text/csv;charset=utf-8;");
  } else {
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayBuffer;
    downloadFile(
      buffer,
      "tickets-export.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }
}

const DEFAULT_TICKET_FIELDS = new Set<string>(["id", "subject", "status", "priority", "channel"]);
const DEFAULT_CONTACT_FIELDS = new Set<string>(["contactName", "contactEmail"]);

export function ExportTicketsSheet() {
  const trpc = useTRPC();
  const {
    searchParams: { filter, q },
  } = useTicketSearchParams();

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateRange, setDateRange] = useState<DateRangeValue>(undefined);
  const [ticketFields, setTicketFields] = useState<Set<string>>(
    () => new Set(DEFAULT_TICKET_FIELDS)
  );
  const [contactFields, setContactFields] = useState<Set<string>>(
    () => new Set(DEFAULT_CONTACT_FIELDS)
  );

  const allTicketFieldsSelected = ticketFields.size === TICKET_FIELD_OPTIONS.length;
  const allContactFieldsSelected = contactFields.size === CONTACT_FIELD_OPTIONS.length;
  const hasSelectedFields = ticketFields.size > 0 || contactFields.size > 0;

  const toggleField = useCallback(
    (set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  const toggleAllTicketFields = useCallback(() => {
    setTicketFields((prev) => {
      if (prev.size === TICKET_FIELD_OPTIONS.length) return new Set();
      return new Set(TICKET_FIELD_OPTIONS.map((f) => f.key));
    });
  }, []);

  const toggleAllContactFields = useCallback(() => {
    setContactFields((prev) => {
      if (prev.size === CONTACT_FIELD_OPTIONS.length) return new Set();
      return new Set(CONTACT_FIELD_OPTIONS.map((f) => f.key));
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormat("csv");
    setDateRange(undefined);
    setTicketFields(new Set(DEFAULT_TICKET_FIELDS));
    setContactFields(new Set(DEFAULT_CONTACT_FIELDS));
  }, []);

  const { mutate: runExport, isPending } = useMutation(
    trpc.ticket.export.mutationOptions({
      onSuccess: (data) => {
        if (data.rows.length === 0) {
          toast.info("No tickets found matching your criteria.");
          return;
        }
        exportToFile(data.rows, format);
        toast.success(
          `Exported ${data.total} ticket${data.total === 1 ? "" : "s"} as ${format.toUpperCase()}.`
        );
        setOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.message || "Export failed. Please try again.");
      },
    })
  );

  const handleExport = useCallback(() => {
    runExport({
      format,
      dateRange,
      filter,
      q,
      ticketFields: [...ticketFields] as ExportForm["ticketFields"],
      contactFields: [...contactFields] as ExportForm["contactFields"],
    });
  }, [runExport, format, dateRange, filter, q, ticketFields, contactFields]);

  const selectedFieldsSummary = useMemo(() => {
    const count = ticketFields.size + contactFields.size;
    return `${count} field${count === 1 ? "" : "s"} selected`;
  }, [ticketFields.size, contactFields.size]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="default">
          <DownloadIcon className="size-4" />
          Export
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Export Tickets</SheetTitle>
          <SheetDescription>
            Choose a format, time range, and fields to include in your export.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="space-y-6 pb-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export as</Label>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as ExportFormat)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="format-csv"
                  className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <RadioGroupItem
                    value="csv"
                    id="format-csv"
                  />
                  <FileTextIcon className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">CSV</span>
                </Label>
                <Label
                  htmlFor="format-xlsx"
                  className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <RadioGroupItem
                    value="xlsx"
                    id="format-xlsx"
                  />
                  <FileSpreadsheetIcon className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">Excel</span>
                </Label>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Time range</Label>
              <p className="text-muted-foreground text-xs">
                Filter exported tickets by creation date.
              </p>
              <CreatedDateFilter
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <Label className="text-sm font-medium">Fields to export</Label>
              <p className="text-muted-foreground text-xs">{selectedFieldsSummary}</p>
            </div>

            <Accordion
              type="multiple"
              defaultValue={["ticket-fields", "contact-fields"]}
              className="space-y-2"
            >
              <AccordionItem
                value="ticket-fields"
                className="border-input rounded-lg border px-3"
              >
                <AccordionTrigger className="py-3 text-sm">Ticket Fields</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-1">
                    <button
                      type="button"
                      onClick={toggleAllTicketFields}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {allTicketFieldsSelected ? "Deselect all" : "Select all"}
                    </button>
                    <div className="grid gap-2.5">
                      {TICKET_FIELD_OPTIONS.map((field) => (
                        <Label
                          key={field.key}
                          className="flex cursor-pointer items-center gap-2.5"
                        >
                          <Checkbox
                            checked={ticketFields.has(field.key)}
                            onCheckedChange={() =>
                              toggleField(ticketFields, setTicketFields, field.key)
                            }
                          />
                          <span className="text-sm">{field.label}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="contact-fields"
                className="border-input rounded-lg border px-3"
              >
                <AccordionTrigger className="py-3 text-sm">Contact Fields</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-1">
                    <button
                      type="button"
                      onClick={toggleAllContactFields}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {allContactFieldsSelected ? "Deselect all" : "Select all"}
                    </button>
                    <div className="grid gap-2.5">
                      {CONTACT_FIELD_OPTIONS.map((field) => (
                        <Label
                          key={field.key}
                          className="flex cursor-pointer items-center gap-2.5"
                        >
                          <Checkbox
                            checked={contactFields.has(field.key)}
                            onCheckedChange={() =>
                              toggleField(contactFields, setContactFields, field.key)
                            }
                          />
                          <span className="text-sm">{field.label}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t">
          <div className="flex w-full items-center justify-between gap-3">
            <SheetClose asChild>
              <Button
                variant="outline"
                disabled={isPending}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={handleExport}
              disabled={isPending || !hasSelectedFields}
            >
              {isPending ?
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Exporting...
                </>
              : <>
                  <DownloadIcon className="size-4" />
                  Export {format.toUpperCase()}
                </>
              }
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
