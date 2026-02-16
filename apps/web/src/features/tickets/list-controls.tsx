import type { RefObject } from "react";
import { useRef } from "react";
import { ChevronDown, Filter, LayoutGrid, MoreVertical, TableProperties } from "lucide-react";
import { useResizeObserver } from "usehooks-ts";

import type { TicketSortOption } from "@help-desk/db/validators/ticket-sort";

import type { GenericTableReturn } from "../table/use-table-params";
import type { ViewMode } from "./search-params";
import type { SortOption } from "./sort-menu";
import type { SortFieldMap } from "./ticket-list-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ColumnsMenu } from "../table/columns-menu";
import { SortMenu } from "./sort-menu";

const viewModeIcons: Record<ViewMode, React.FC<React.SVGProps<SVGSVGElement>>> = {
  card: LayoutGrid,
  list: TableProperties,
};

const FilterButton = ({
  filterCount,
  filterOpen,
  onFilterClick,
}: Pick<ListControlsBaseProps, "filterOpen" | "onFilterClick"> & { filterCount: number }) => {
  return (
    <Button
      variant="outline"
      onClick={onFilterClick}
      className="flex transition-all duration-300 ease-in-out"
      disabled={!onFilterClick}
    >
      {filterCount > 0 ?
        <Badge>{filterCount}</Badge>
      : <Filter className="size-4" />}
      Filter
      <ChevronDown
        name="chevron-down"
        className={cn("transition-transform duration-200", filterOpen && "rotate-270")}
      />
    </Button>
  );
};

export type ListControls<V extends ViewMode, S extends SortOption = TicketSortOption> = {
  inputValue: string;
  filterCount: number;
  sorts: S[];
  viewMode: V;
  handleInputChange: (value: string) => void;
  handleSetViewMode: (mode: V) => void;
  handleSortChange: (value: S[]) => void;
  reset: () => void;
};

export type ListControlsBaseProps = {
  onFilterClick?: () => void;
  filterOpen?: boolean;
  totalBadge?: React.ReactNode;
};

export type ListControlsProps<
  V extends ViewMode,
  T,
  TColumnsList extends Record<string, boolean>[],
  S extends SortOption = TicketSortOption,
> = ListControlsBaseProps & {
  viewModes: V[];
  sortFieldsMap: SortFieldMap;
  listControls: ListControls<V, S>;
  tableParams: GenericTableReturn<T, TColumnsList>;
  filterButton?: React.ReactNode;
  gridViewContent?: React.ReactNode;
};

const LG = 740;
const MD = LG - 120; // 620
const SM = MD - 100; // 520
const XS = SM - 100; // 420

export const ListControls = <
  V extends ViewMode,
  T,
  TColumnsList extends Record<string, boolean>[],
  S extends SortOption = TicketSortOption,
>({
  totalBadge,
  viewModes,
  sortFieldsMap,
  onFilterClick,
  filterOpen,
  listControls: {
    filterCount,
    inputValue,
    sorts,
    viewMode,
    handleInputChange,
    handleSetViewMode,
    handleSortChange,
    reset,
  },
  filterButton,
  gridViewContent,
  tableParams: { columnOptions, toggleColumnVisibility, updateColumnOrder, resetTableParams },
}: ListControlsProps<V, T, TColumnsList, S>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width = Infinity } = useResizeObserver({
    ref: ref as RefObject<HTMLElement>,
    box: "border-box",
  });

  const filterInMenu = width >= LG; // hides first
  const sortInMenu = width >= MD; // hides second
  const viewInMenu = width >= SM; // hides third
  const searchInMenu = width >= XS; // hides last
  const moreMenu = !filterInMenu || !sortInMenu || !viewInMenu || !searchInMenu;

  return (
    <div
      className="flex h-8 w-full min-w-28 items-center justify-end gap-2"
      ref={ref}
    >
      {totalBadge}
      <ToggleGroup
        className="transition-all duration-300 ease-in-out"
        defaultValue="card"
        value={viewMode}
        type="single"
      >
        {viewModes.map((mode) => {
          const ViewModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = viewModeIcons[mode];
          return (
            <ToggleGroupItem
              key={mode}
              value={mode}
              aria-label={`${mode} view`}
              onClick={() => handleSetViewMode(mode)}
              className="min-w-8"
            >
              <ViewModeIcon className="size-4" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {searchInMenu && (
        <Input
          id="search"
          type="text"
          onClear={reset}
          showSearch
          className={cn(
            "transition-all duration-300 ease-in-out",
            width > LG ? "w-[252px]" : "w-[180px]"
          )}
          placeholder="Search tickets..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      )}

      {viewInMenu && (
        <Popover>
          <PopoverTrigger
            asChild
            className="flex transition-all duration-300 ease-in-out"
          >
            <Button
              variant="outline"
              disabled={viewMode !== "list" && (viewMode !== "card" || !gridViewContent)}
            >
              <TableProperties className="size-4" /> View
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            {viewMode === "list" && (
              <ColumnsMenu
                columns={columnOptions}
                onColumnToggle={toggleColumnVisibility}
                onColumnReorder={updateColumnOrder}
                onReset={resetTableParams}
              />
            )}
            {viewMode === "card" && gridViewContent}
          </PopoverContent>
        </Popover>
      )}

      {sortInMenu && (
        <SortMenu
          className="flex transition-all duration-300 ease-in-out"
          selectedSorts={sorts}
          onSortChange={handleSortChange as (sorts: SortOption[]) => void}
          sortFields={sortFieldsMap[viewMode]}
        />
      )}

      {filterInMenu &&
        (filterButton ?? (
          <FilterButton
            filterCount={filterCount}
            filterOpen={filterOpen}
            onFilterClick={onFilterClick}
          />
        ))}

      {/* More options dropdown - shows when any element is hidden */}
      {moreMenu && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  className="transition-all duration-300 ease-in-out"
                >
                  <MoreVertical />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>More options</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            align="end"
            className="bg-background flex w-fit max-w-[75vw] flex-wrap items-center gap-2"
          >
            {!searchInMenu && (
              <Input
                type="text"
                size="sm"
                onClear={reset}
                showSearch
                className="transition-all duration-300 ease-in-out"
                placeholder="Search..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
              />
            )}

            {!viewInMenu && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    disabled={viewMode !== "list" && (viewMode !== "card" || !gridViewContent)}
                  >
                    <TableProperties className="size-4" /> View
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  {viewMode === "list" && (
                    <ColumnsMenu
                      columns={columnOptions}
                      onColumnToggle={toggleColumnVisibility}
                      onColumnReorder={updateColumnOrder}
                      onReset={resetTableParams}
                    />
                  )}
                  {viewMode === "card" && gridViewContent}
                </PopoverContent>
              </Popover>
            )}

            {!sortInMenu && (
              <SortMenu
                selectedSorts={sorts}
                onSortChange={handleSortChange as (sorts: SortOption[]) => void}
                sortFields={sortFieldsMap[viewMode]}
              />
            )}

            {!filterInMenu &&
              (filterButton ?? (
                <FilterButton
                  filterCount={filterCount}
                  filterOpen={filterOpen}
                  onFilterClick={onFilterClick}
                />
              ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
