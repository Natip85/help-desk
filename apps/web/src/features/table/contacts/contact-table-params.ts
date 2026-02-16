import { parseAsJson } from "nuqs";
import { createLoader } from "nuqs/server";
import { z } from "zod/v4";

import { useGenericTableParams } from "../use-table-params";
import { columns as columnDefs } from "./contact-columns";

const availableColumns = [
  "name",
  "email",
  "phone",
  "company",
  "createdAt",
  "updatedAt",
  "id",
] as const;
type ColumnName = (typeof availableColumns)[number];

const columnLabelsMap: Record<ColumnName, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  createdAt: "Created At",
  updatedAt: "Updated At",
  id: "ID",
};

const availableColumnsEnum = z.enum(availableColumns);

const columnSchema = z.partialRecord(availableColumnsEnum, z.boolean());

const columnsListSchema = z.array(columnSchema);

type ColumnsList = z.infer<typeof columnsListSchema>;

const defaultColumns: ColumnsList = [
  { name: true },
  { email: true },
  { phone: true },
  { company: true },
  { createdAt: true },
  { updatedAt: false },
  { id: false },
];

export const tableParamsParser = {
  columns: parseAsJson((value) => columnsListSchema.parse(value)).withDefault(defaultColumns),
};

export const loadTableParams = createLoader(tableParamsParser);

export const useContactTableParams = () => {
  return useGenericTableParams({
    columnLabelsMap,
    columnDefs,
    availableColumns,
    tableParamsParser,
  });
};
