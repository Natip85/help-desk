"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Folder } from "lucide-react";

import {
  ListRenderer,
  ListRendererEmpty,
  ListRendererList,
  ListRendererListItem,
  ListRendererLoading,
  ListRendererNoResults,
} from "@/components/list-renderer";
import { PaginationRow } from "@/components/pagination-row";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTRPC } from "@/trpc";
import { DataTable } from "../table/data-table";
import { useTicketTableParams } from "../table/ticket-table-params";
import { useTicketSearchParams } from "./search-params";
import { TicketDetailsCard } from "./ticket-details-card";

export const TicketList = () => {
  const trpc = useTRPC();
  const { searchParams, setSearchParams } = useTicketSearchParams();
  const { columnVisibility, orderedColumns } = useTicketTableParams();

  const { data, isFetching } = useSuspenseQuery(trpc.ticket.all.queryOptions(searchParams));

  const hasQuery = Boolean(searchParams.q && searchParams.q.length > 0);

  return (
    <div className="m-2 flex-1 rounded-xl p-3">
      <div className="@container">
        <ListRenderer
          hasData={data.items.length > 0}
          isLoading={isFetching}
          hasSearch={hasQuery}
          viewMode={searchParams.viewMode}
        >
          <ListRendererLoading />

          <ListRendererEmpty>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Folder />
                </EmptyMedia>
                <EmptyTitle>No Tickets Found</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t created any tickets yet. Get started by creating your first
                  ticket.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row justify-center gap-2">
                <Button>Create Ticket</Button>
              </EmptyContent>
            </Empty>
          </ListRendererEmpty>

          <ListRendererNoResults>
            <div className="col-span-full flex h-full flex-col items-center justify-center gap-6">
              <p className="text-muted-foreground">No results found</p>
            </div>
          </ListRendererNoResults>

          <ListRendererList>
            <ListRendererListItem type={"list"}>
              <DataTable
                columns={orderedColumns}
                data={data.items}
                columnVisibility={columnVisibility}
                // renderBulkActions={({ selectedRows, table }) => (
                //   <TicketTableBulkActions
                //     selectedRows={selectedRows}
                //     table={table}
                //   />
                // )}
              />
            </ListRendererListItem>

            <ListRendererListItem type={"card"}>
              <div className="flex w-full flex-col gap-2">
                {data.items.map((item) => (
                  <TicketDetailsCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </ListRendererListItem>
          </ListRendererList>
        </ListRenderer>
      </div>
      <PaginationRow
        type="tickets"
        total={data.total}
        limit={searchParams.limit}
        currentPage={searchParams.page}
        onPageChange={(page) => {
          void setSearchParams({ page });
        }}
        onPageSizeChange={(pageSize) => {
          void setSearchParams({ limit: pageSize, page: 1 });
        }}
      />
    </div>
  );
};
