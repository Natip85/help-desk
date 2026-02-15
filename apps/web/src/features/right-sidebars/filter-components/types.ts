export type FilterComponentProps = {
  filterName: string;
  displayName: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onValueChange: (filterName: string, values: string[]) => void;
};
