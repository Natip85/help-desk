import type { FilterComponentProps } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

export function CheckboxFilter({
  filterName,
  displayName,
  options,
  selectedValues,
  onValueChange,
}: FilterComponentProps) {
  const selectedSet = new Set(selectedValues);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{displayName}</SidebarGroupLabel>
      <div className="flex flex-col gap-2 px-1">
        {options.map((option) => {
          const isChecked = selectedSet.has(option.value);

          return (
            <div
              key={option.value}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`${filterName}-${option.value}`}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  let next: string[];
                  if (checked) {
                    next = [...selectedValues, option.value];
                  } else {
                    next = selectedValues.filter((v) => v !== option.value);
                  }
                  onValueChange(filterName, next);
                }}
              />
              <Label
                htmlFor={`${filterName}-${option.value}`}
                className="cursor-pointer text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          );
        })}
      </div>
    </SidebarGroup>
  );
}
