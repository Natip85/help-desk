import type { FilterType } from "@help-desk/db/validators/default-filter";

import type { FilterComponentProps } from "./types";
import { CheckboxFilter } from "./checkbox-filter";
import { MultiSelectFilter } from "./multi-select-filter";
import { RadioFilter } from "./radio-filter";
import { SelectFilter } from "./select-filter";

export type { FilterComponentProps } from "./types";

export const filterRegistry: Record<FilterType, React.ComponentType<FilterComponentProps>> = {
  select: SelectFilter,
  "multi-select": MultiSelectFilter,
  radio: RadioFilter,
  checkbox: CheckboxFilter,
};

type FilterRendererProps = FilterComponentProps & {
  type: FilterType;
};

export function FilterRenderer({ type, ...props }: FilterRendererProps) {
  const Component = filterRegistry[type] ?? filterRegistry["multi-select"];
  return <Component {...props} />;
}
