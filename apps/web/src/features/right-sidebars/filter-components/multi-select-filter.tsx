import { Fragment } from "react";

import type { FilterComponentProps } from "./types";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

export function MultiSelectFilter({
  filterName,
  displayName,
  options,
  selectedValues,
  onValueChange,
}: FilterComponentProps) {
  const anchor = useComboboxAnchor();
  const items = options.map((o) => o.value);
  const labelMap = new Map(options.map((o) => [o.value, o.label]));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{displayName}</SidebarGroupLabel>
      <Combobox
        key={selectedValues.join("|")}
        multiple
        autoHighlight
        items={items}
        value={selectedValues.length > 0 ? selectedValues : null}
        onValueChange={(values: string[] | null) => {
          onValueChange(filterName, values ?? []);
        }}
      >
        <ComboboxChips
          ref={anchor}
          className="w-full max-w-xs"
        >
          <ComboboxValue>
            {(values: string[] | null) => {
              const selected = values ?? [];
              return (
                <Fragment>
                  {selected.map((value: string) => (
                    <ComboboxChip key={value}>{labelMap.get(value) ?? value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder="" />
                </Fragment>
              );
            }}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem
                key={item}
                value={item}
              >
                <span>{labelMap.get(item) ?? item}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </SidebarGroup>
  );
}
