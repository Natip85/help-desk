"use client";

import { ChevronDown } from "lucide-react";

import type { TicketCardData } from "./ticket-card";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type SelectAction = {
  type: "select";
  label: string;
  value: string;
  options: { label: string; value: string; className?: string }[];
  onValueChange: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

// Extensible union -- add more action types here (toggle, badge, etc.)
export type TicketCardAction = SelectAction;

export type CreateTicketCardActions = (item: TicketCardData) => TicketCardAction[];

type TicketCardActionsProps = React.ComponentProps<"div"> & {
  actions: TicketCardAction[];
};

export const TicketCardActions = ({ actions, className, ...props }: TicketCardActionsProps) => {
  return (
    <div
      {...props}
      className={cn("flex flex-col gap-2", className)}
    >
      {actions.map((action) => {
        if (action.type === "select") {
          return (
            <SelectActionField
              key={action.label}
              action={action}
            />
          );
        }
        // Future action types would be handled here
        return null;
      })}
    </div>
  );
};

type OptionItem = SelectAction["options"][number];

const SelectActionField = ({ action }: { action: SelectAction }) => {
  const defaultOption = action.options.find((o) => o.value === action.value);

  return (
    <div className="flex flex-col gap-1">
      {/* <span className="text-muted-foreground text-xs">{action.label}</span> */}

      <Combobox
        items={action.options}
        value={defaultOption ?? null}
        onValueChange={(option) => {
          if (option) void action.onValueChange(option.value);
        }}
        isItemEqualToValue={(a, b) => a.value === b.value}
        disabled={action.disabled}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="ghost"
              className="w-fit justify-between border-0 bg-transparent font-normal"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <ComboboxValue placeholder="Select..." />
              <ChevronDown className="size-4" />
            </Button>
          }
        />
        <ComboboxContent
          className="w-42"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ComboboxInput
            showTrigger={false}
            placeholder="Search"
          />
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item: OptionItem) => (
              <ComboboxItem
                key={item.value}
                value={item}
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
