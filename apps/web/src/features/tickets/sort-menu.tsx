"use client";

import { createContext, useContext } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SortOption<TField extends string = string> = {
  field: TField;
  direction: SortOrder;
};

export type SortField = {
  label: string;
  value: string;
};

export type SortMenuProps<TField extends string = string> = {
  selectedSorts?: SortOption<TField>[];
  onSortChange?: (sorts: SortOption<TField>[]) => void;
  sortFields: SortField[];
  disabled?: boolean;
} & React.ComponentProps<"div">;

type SortOrder = "asc" | "desc";

// Context for sharing state and handlers between components
type SortMenuContextType = {
  availableSortFields: SortField[];
  hasSelectedSorts: boolean;
  selectedSorts: SortOption[];
  sortFields: SortField[];
  disabled?: boolean;
  handleAddSort: (field?: string) => void;
  handleClearAll: () => void;
  handleRemoveSort: (field: string) => void;
  handleReorder: (sorts: SortOption[]) => void;
  handleSortDirectionChange: (field: string, direction: SortOrder) => void;
  handleSortFieldChange: (currentField: string, newField: string) => void;
};

const SortMenuContext = createContext<SortMenuContextType | null>(null);

export const useSortMenu = () => {
  const context = useContext(SortMenuContext);
  if (!context) {
    throw new Error("useSortMenu must be used within a SortMenuProvider");
  }
  return context;
};

// SortButton Component
function SortButton(props: React.ComponentProps<typeof Button>) {
  const { hasSelectedSorts, selectedSorts } = useSortMenu();

  return (
    <Button
      variant="outline"
      size="sm"
      {...props}
    >
      {hasSelectedSorts ?
        <Badge className="mx-0.5">{selectedSorts.length}</Badge>
      : <ArrowUp />}
      Sort
      <ChevronDown />
    </Button>
  );
}

// SortItem Component
type SortItemProps = {
  sort: SortOption;
};

function SortItem({ sort }: SortItemProps) {
  const {
    handleSortFieldChange,
    handleSortDirectionChange,
    handleRemoveSort,
    availableSortFields,
    sortFields,
    disabled,
  } = useSortMenu();
  const controls = useDragControls();

  const currentField = sortFields.find((field) => field.value === sort.field);

  return (
    <Reorder.Item
      value={sort}
      dragControls={controls}
      dragListener={false}
      className="flex items-center gap-1"
    >
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <GripVertical
            className="size-4 cursor-grab"
            onPointerDown={(e) => controls.start(e)}
          />
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>

      {/* Field Select */}
      <Select
        value={sort.field}
        onValueChange={(value) => handleSortFieldChange(sort.field, value)}
        disabled={disabled}
      >
        <SelectTrigger
          className="flex-1"
          disabled={disabled}
        >
          <SelectValue
            placeholder="Select field"
            className="bg-neutral-300"
          />
        </SelectTrigger>
        <SelectContent>
          {([currentField, ...availableSortFields].filter(Boolean) as SortField[]).map((field) => (
            <SelectItem
              key={field.value}
              value={field.value}
            >
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Direction Toggle */}
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              handleSortDirectionChange(sort.field, sort.direction === "asc" ? "desc" : "asc")
            }
          >
            {sort.direction === "asc" ?
              <ArrowUp />
            : <ArrowDown />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Toggle sort direction ({sort.direction === "asc" ? "ascending" : "descending"})
        </TooltipContent>
      </Tooltip>

      {/* Remove Button */}
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveSort(sort.field)}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Remove sort</p>
        </TooltipContent>
      </Tooltip>
    </Reorder.Item>
  );
}

// SortFieldList Component
function SortFieldList() {
  const { handleAddSort, sortFields } = useSortMenu();

  return (
    <Command className="w-full">
      <CommandInput placeholder="Sort by..." />
      <CommandList>
        <CommandEmpty>No sort fields found.</CommandEmpty>
        <CommandGroup>
          {sortFields.map((field) => (
            <CommandItem
              key={field.value}
              className="cursor-pointer"
              onSelect={() => handleAddSort(field.value)}
            >
              {field.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

// SortFooter Component
function SortFooter() {
  const { handleAddSort, handleClearAll, selectedSorts } = useSortMenu();

  return (
    <div className="flex flex-col gap-3 pt-3">
      <Separator />
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          color="primary"
          onClick={() => handleAddSort()}
          disabled={selectedSorts.some((sort) => sort.field === "")}
        >
          <Plus className="h-4 w-4" />
          Add sorting
        </Button>
        <PopoverClose asChild>
          <Button
            variant="ghost"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
}

function SortMenuContent() {
  const { hasSelectedSorts, selectedSorts, handleReorder, disabled } = useSortMenu();

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        asChild
      >
        <SortButton />
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-72 border-none", hasSelectedSorts ? "p-4" : "p-0")}
        align="end"
      >
        {hasSelectedSorts ?
          <>
            {/* Sort Items */}
            <Reorder.Group
              values={selectedSorts}
              onReorder={handleReorder}
              className="space-y-3"
            >
              {selectedSorts.map((sort) => (
                <SortItem
                  key={sort.field}
                  sort={sort}
                />
              ))}
            </Reorder.Group>

            <SortFooter />
          </>
        : <SortFieldList />}
      </PopoverContent>
    </Popover>
  );
}

export function SortMenu<TField extends string>({
  selectedSorts = [],
  onSortChange,
  className,
  sortFields,
  disabled,
  ...props
}: SortMenuProps<TField>) {
  // Cast for internal use — field values are always preserved from sortFields/selectedSorts
  const emitChange = onSortChange as ((sorts: SortOption[]) => void) | undefined;

  const handleAddSort = (field?: string) => {
    const newSort: SortOption = {
      field: field ?? "",
      direction: "asc",
    };
    emitChange?.([...selectedSorts, newSort]);
  };

  const handleRemoveSort = (field: string) => {
    emitChange?.(selectedSorts.filter((sort) => sort.field !== field));
  };

  const handleSortFieldChange = (currentField: string, newField: string) => {
    emitChange?.(
      selectedSorts.map((sort) =>
        sort.field === currentField ? { ...sort, field: newField } : sort
      )
    );
  };

  const handleSortDirectionChange = (field: string, direction: SortOrder) => {
    emitChange?.(
      selectedSorts.map((sort) => (sort.field === field ? { ...sort, direction } : sort))
    );
  };

  const handleClearAll = () => {
    emitChange?.([]);
  };

  const handleReorder = (sorts: SortOption[]) => {
    emitChange?.(sorts);
  };

  const hasSelectedSorts = selectedSorts.length > 0;

  const availableSortFields = sortFields.filter(
    (field) => !selectedSorts.some((sort) => sort.field === field.value)
  );

  const contextValue: SortMenuContextType = {
    availableSortFields,
    hasSelectedSorts,
    selectedSorts,
    sortFields,
    disabled,
    handleAddSort,
    handleClearAll,
    handleRemoveSort,
    handleReorder,
    handleSortDirectionChange,
    handleSortFieldChange,
  };

  return (
    <SortMenuContext.Provider value={contextValue}>
      <div
        className={cn("flex items-center", className)}
        {...props}
      >
        <SortMenuContent />
      </div>
    </SortMenuContext.Provider>
  );
}
