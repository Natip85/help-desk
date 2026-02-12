import type { ViewMode } from "../tickets/search-params";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./table-skeleton";
import { TicketCardSkeleton } from "./ticket-card-skeleton";

type ListSkeletonProps = {
  viewMode?: ViewMode;
  limit?: number;
  className?: string;
};

export const ListSkeletons = ({ viewMode = "card", limit = 50, className }: ListSkeletonProps) => {
  if (viewMode === "list") {
    return (
      <TableSkeleton
        columns={8}
        rows={10}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {Array.from({ length: limit }).map((_, index) => (
        <TicketCardSkeleton key={index} />
      ))}
    </div>
  );
};
