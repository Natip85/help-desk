"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranchPlus, Loader2, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

type MergeTicketSheetProps = {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MergeTicketSheet({ ticketId, open, onOpenChange }: MergeTicketSheetProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    ...trpc.ticket.getGlobalSearchAll.queryOptions(debouncedSearch),
    enabled: open && debouncedSearch.length >= 2,
  });

  const filteredTickets = useMemo(() => {
    if (!searchResults?.tickets) return [];
    return searchResults.tickets.filter((t) => t.id !== ticketId);
  }, [searchResults, ticketId]);

  const selectedTicket = useMemo(
    () => filteredTickets.find((t) => t.id === selectedTicketId),
    [filteredTickets, selectedTicketId]
  );

  const { mutate: mergeTickets, isPending: isMerging } = useMutation(
    trpc.ticket.merge.mutationOptions({
      onSuccess: (data) => {
        toast.success("Ticket merged successfully");
        queryClient.removeQueries({ queryKey: trpc.ticket.all.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.ticket.totalCount.queryKey() });
        queryClient.removeQueries({
          queryKey: trpc.ticket.getById.queryKey(data.primaryTicketId),
        });
        queryClient.removeQueries({
          queryKey: trpc.ticket.getById.queryKey(data.secondaryTicketId),
        });
        queryClient.removeQueries({
          queryKey: trpc.ticket.getMergedTickets.queryKey(data.primaryTicketId),
        });
        queryClient.removeQueries({
          queryKey: trpc.ticket.getTicketEvents.queryKey(data.primaryTicketId),
        });
        queryClient.removeQueries({
          queryKey: trpc.ticket.getTicketEvents.queryKey(data.secondaryTicketId),
        });
        queryClient.removeQueries({
          queryKey: trpc.contact.conversationThread.queryKey(),
        });
        onOpenChange(false);
        resetState();
        router.push(`/tickets/${data.primaryTicketId}`);
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to merge tickets");
      },
    })
  );

  const resetState = useCallback(() => {
    setSearch("");
    setSelectedTicketId(null);
  }, []);

  const handleMerge = useCallback(() => {
    if (!selectedTicketId) return;
    mergeTickets({
      primaryTicketId: selectedTicketId,
      secondaryTicketId: ticketId,
    });
  }, [mergeTickets, selectedTicketId, ticketId]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Merge Ticket</SheetTitle>
          <SheetDescription>
            Search for the ticket you want to merge this ticket into. The current ticket will be
            closed with a &quot;merged&quot; status.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search tickets by subject or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="space-y-1 py-2">
            {search.length < 2 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Type at least 2 characters to search for tickets.
              </p>
            )}

            {search.length >= 2 && isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            )}

            {search.length >= 2 && !isSearching && filteredTickets.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No matching tickets found.
              </p>
            )}

            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() =>
                  setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id)
                }
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  ticket.id === selectedTicketId ?
                    "border-primary bg-primary/5"
                  : "hover:bg-muted border-transparent"
                )}
              >
                <p className="truncate text-sm font-medium">{ticket.subject ?? "(no subject)"}</p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  ID: {ticket.id.slice(0, 8)}... &middot; {ticket.channel}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>

        {selectedTicket && (
          <>
            <Separator />
            <div className="bg-muted/50 mx-4 rounded-lg p-3">
              <p className="text-xs font-medium">Merge summary</p>
              <p className="text-muted-foreground mt-1 text-xs">
                This ticket will be closed with a <strong>&quot;merged&quot;</strong> status and
                linked to <strong>{selectedTicket.subject ?? "(no subject)"}</strong>.
              </p>
            </div>
          </>
        )}

        <SheetFooter className="border-t">
          <div className="flex w-full items-center justify-between gap-3">
            <SheetClose asChild>
              <Button
                variant="outline"
                disabled={isMerging}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={handleMerge}
              disabled={!selectedTicketId || isMerging}
            >
              {isMerging ?
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Merging...
                </>
              : <>
                  <GitBranchPlus className="size-4" />
                  Merge Ticket
                </>
              }
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
