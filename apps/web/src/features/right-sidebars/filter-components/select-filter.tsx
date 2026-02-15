import { X } from "lucide-react";

import type { FilterComponentProps } from "./types";
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
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

type OptionItem = { value: string; label: string };

export function SelectFilter({
  filterName,
  displayName,
  options,
  selectedValues,
  onValueChange,
}: FilterComponentProps) {
  const items: OptionItem[] = options.map((o) => ({ value: o.value, label: o.label }));
  const currentOption = items.find((o) => o.value === selectedValues[0]) ?? null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{displayName}</SidebarGroupLabel>
      <div className="relative">
        <Combobox
          items={items}
          value={currentOption}
          onValueChange={(option: OptionItem | null) => {
            onValueChange(filterName, option ? [option.value] : []);
          }}
          isItemEqualToValue={(a, b) => a?.value === b?.value}
        >
          <ComboboxTrigger
            render={
              <Button
                variant="outline"
                className="bg-accent/50 hover:bg-accent/50 w-full justify-between font-normal"
              >
                <ComboboxValue />
              </Button>
            }
          />
          <ComboboxContent className="w-42">
            <ComboboxInput
              showTrigger={false}
              placeholder="Search"
            />
            <ComboboxEmpty>No options found.</ComboboxEmpty>
            <ComboboxList>
              {(item: OptionItem) => (
                <ComboboxItem
                  key={item.value}
                  value={item}
                >
                  <span>{item.label}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {currentOption && (
          <Button
            variant="ghost"
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
            onClick={() => onValueChange(filterName, [])}
            aria-label={`Clear ${displayName}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </SidebarGroup>
  );
}
