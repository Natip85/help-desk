import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc";
import { useTicketSearchParams } from "./search-params";

type ListTotalBadgeProps = {
  total?: number;
  label: string;
};

const ListTotalBadge = ({ total, label }: ListTotalBadgeProps) => {
  if (total === undefined) return null;

  return (
    <Badge
      className="flex h-full"
      variant="outline"
    >
      {total} {label}
    </Badge>
  );
};

const TicketsListTotalBadgeLoader = () => {
  const trpc = useTRPC();
  const { searchParams } = useTicketSearchParams();
  const { data: total } = useSuspenseQuery(
    trpc.ticket.all.queryOptions(searchParams, {
      select: (data) => data.total,
    })
  );

  return (
    <ListTotalBadge
      total={total}
      label="tickets"
    />
  );
};

export const TicketsListTotalBadge = () => {
  return (
    <Suspense
      fallback={
        <ListTotalBadge
          total={0}
          label="tickets"
        />
      }
    >
      <TicketsListTotalBadgeLoader />
    </Suspense>
  );
};
