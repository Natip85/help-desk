"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";

const POLL_INTERVAL = 15_000; // 15 seconds

type Baseline = {
  latestMessageAt: string | null;
  totalCount: number;
  latestSlaBreachedAt: string | null;
};

export const NewTicketsBanner = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [baseline, setBaseline] = useState<Baseline | null>(null);

  const { data } = useQuery({
    ...trpc.ticket.getUpdatesCheck.queryOptions(),
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });

  // Initialize baseline from the first successful response.
  // Setting state during render is the recommended React pattern for
  // "adjusting state when data changes" — avoids cascading effect renders.
  if (data && !baseline) {
    setBaseline({
      latestMessageAt: data.latestMessageAt?.toISOString() ?? null,
      totalCount: data.totalCount,
      latestSlaBreachedAt: data.latestSlaBreachedAt?.toISOString() ?? null,
    });
  }

  const hasUpdates =
    data &&
    baseline &&
    (data.totalCount !== baseline.totalCount ||
      (data.latestMessageAt?.toISOString() ?? null) !== baseline.latestMessageAt ||
      (data.latestSlaBreachedAt?.toISOString() ?? null) !== baseline.latestSlaBreachedAt);

  const handleRefresh = useCallback(() => {
    if (!data) return;

    // Update baseline to current values so banner hides
    setBaseline({
      latestMessageAt: data.latestMessageAt?.toISOString() ?? null,
      totalCount: data.totalCount,
      latestSlaBreachedAt: data.latestSlaBreachedAt?.toISOString() ?? null,
    });

    // Invalidate ticket list, ticket detail, and conversation thread queries
    // so navigating into a ticket also shows fresh messages
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey() }),
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return Array.isArray(key) && key[0] === "contact" && key[1] === "conversationThread";
        },
      }),
    ]);
  }, [data, queryClient, trpc.ticket.all, trpc.ticket.getById]);

  if (!hasUpdates) return null;

  return (
    <div className="sticky top-0 z-50 flex w-full justify-center p-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleRefresh}
        className="shadow-lg"
      >
        <RefreshCw className="size-3.5" />
        New ticket updates — click to refresh
      </Button>
    </div>
  );
};
