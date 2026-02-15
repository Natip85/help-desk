import type { FilterComponentProps } from "./types";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

export function RadioFilter({
  filterName,
  displayName,
  options,
  selectedValues,
  onValueChange,
}: FilterComponentProps) {
  const currentValue = selectedValues[0] ?? "";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{displayName}</SidebarGroupLabel>
      <RadioGroup
        value={currentValue}
        onValueChange={(value: string) => {
          // If the user selects the same value, deselect it
          if (value === currentValue) {
            onValueChange(filterName, []);
          } else {
            onValueChange(filterName, [value]);
          }
        }}
        className="gap-2 px-1"
      >
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-center gap-2"
          >
            <RadioGroupItem
              value={option.value}
              id={`${filterName}-${option.value}`}
              onClick={() => {
                // Allow deselection by clicking the already-selected radio
                if (option.value === currentValue) {
                  onValueChange(filterName, []);
                }
              }}
            />
            <Label
              htmlFor={`${filterName}-${option.value}`}
              className="cursor-pointer text-sm font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </SidebarGroup>
  );
}
