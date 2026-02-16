"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ColumnMenuOption = {
  label: string;
  value: string;
  visible: boolean;
};

type ColumnItemProps = {
  column: ColumnMenuOption;
  onColumnToggle: (column: string) => void;
};

function ColumnMenuItem({ column, onColumnToggle }: ColumnItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={column}
      dragControls={controls}
      dragListener={false}
      className="flex items-center justify-between gap-2 py-1.5"
    >
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <GripVertical
            className="size-4 cursor-grab"
            onPointerDown={(e: React.PointerEvent) => controls.start(e)}
          />
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>

      <Label
        htmlFor={column.value}
        className="flex-1 cursor-pointer text-sm"
      >
        {column.label}
      </Label>

      <Switch
        id={column.value}
        checked={column.visible}
        onCheckedChange={() => onColumnToggle(column.value)}
      />
    </Reorder.Item>
  );
}

export type ColumnsMenuProps = {
  columns: ColumnMenuOption[];
  onColumnToggle: (column: string) => void;
  onColumnReorder: (columns: ColumnMenuOption[]) => void;
  onReset: () => void;
};

export function ColumnsMenu({
  columns,
  onColumnToggle,
  onColumnReorder,
  onReset,
}: ColumnsMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredColumns = columns.filter((column) =>
    column.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReorder = (reorderedColumns: ColumnMenuOption[]) => {
    onColumnReorder?.(reorderedColumns);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        size="sm"
        showSearch
        onClear={() => setSearchQuery("")}
        placeholder="Search columns..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />
      <Reorder.Group
        values={filteredColumns}
        onReorder={handleReorder}
      >
        {filteredColumns.map((column) => (
          <ColumnMenuItem
            key={column.value}
            column={column}
            onColumnToggle={onColumnToggle}
          />
        ))}
      </Reorder.Group>
      {filteredColumns.length === 0 && (
        <div className="text-muted-foreground py-2 text-center text-sm">
          No columns match your search
        </div>
      )}
      <Button
        className="self-end"
        onClick={() => {
          onReset();
          setSearchQuery("");
        }}
        color="destructive"
        variant="ghost"
        size="sm"
      >
        Reset
      </Button>
    </div>
  );
}
