import { parseAsJson } from "nuqs";
import { createLoader } from "nuqs/server";
import { z } from "zod/v4";

import { columns as columnDefs } from "./ticket-columns";
import { useGenericTableParams } from "./use-table-params";

const availableColumns = [
  "id",
  "status",
  "subject",
  "contact",
  "createdAt",
  "priority",
  "tags",
  "assignee",
] as const;
type ColumnName = (typeof availableColumns)[number];

const columnLabelsMap: Record<ColumnName, string> = {
  id: "ID",
  status: "Status",
  subject: "Subject",
  contact: "Contact",
  createdAt: "Created At",
  priority: "Priority",
  tags: "Tags",
  assignee: "Assignee",
};

const availableColumnsEnum = z.enum(availableColumns);

const columnSchema = z.partialRecord(availableColumnsEnum, z.boolean());

const columnsListSchema = z.array(columnSchema);

type ColumnsList = z.infer<typeof columnsListSchema>;

const defaultColumns: ColumnsList = [
  { id: false },
  { status: true },
  { subject: true },
  { contact: true },
  { createdAt: true },
  { priority: true },
  { tags: true },
  { assignee: true },
];

export const tableParamsParser = {
  columns: parseAsJson((value) => columnsListSchema.parse(value)).withDefault(defaultColumns),
};

export const loadTableParams = createLoader(tableParamsParser);

export const useTicketTableParams = () => {
  return useGenericTableParams({
    columnLabelsMap,
    columnDefs,
    availableColumns,
    tableParamsParser,
  });
};
