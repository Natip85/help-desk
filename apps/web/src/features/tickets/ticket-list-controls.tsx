import type { ListControlsBaseProps } from "./list-controls";
import type { ViewMode } from "./search-params";
import { useSidebarParams } from "../right-sidebars/query-params";
import { useTicketTableParams } from "../table/ticket-table-params";
import { ListControls } from "./list-controls";
import { TicketsListTotalBadge } from "./list-total-badge";
import { useTicketListControls } from "./use-ticket-list-controls";

export const ticketSortFields: SortField[] = [
  {
    label: "Created at",
    value: "createdAt",
  },
  {
    label: "Updated at",
    value: "updatedAt",
  },
];

export type SortField = {
  label: string;
  value: string;
};

export type SortFieldMap = Record<ViewMode, SortField[]>;

export const ticketSortFieldsMap: SortFieldMap = {
  card: ticketSortFields,
  list: ticketSortFields,
};

export const TicketListControls = (props: ListControlsBaseProps) => {
  const {
    sidebarParams: _sidebarParams,
    toggleFilterOpen: _toggleFilterOpen,
    searchParams: _searchParams,
    ...listControls
  } = useTicketListControls();
  const tableParams = useTicketTableParams();
  const { sidebarParams, toggleFilterOpen } = useSidebarParams();
  return (
    <ListControls
      {...props}
      listControls={listControls}
      tableParams={tableParams}
      sortFieldsMap={ticketSortFieldsMap}
      viewModes={["card", "list"]}
      totalBadge={<TicketsListTotalBadge />}
      onFilterClick={() => toggleFilterOpen()}
      filterOpen={!!sidebarParams.filterOpen}

      // gridViewContent={
      //   <AssetPosterZoomSlider
      //     cardWidth={searchParams.cardWidth}
      //     onCardWidthChange={(width) => {
      //       void setSearchParams({ cardWidth: width });
      //     }}
      //   />
      // }
    />
  );
};
