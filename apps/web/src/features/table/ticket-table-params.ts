import { parseAsJson } from "nuqs";
import { createLoader } from "nuqs/server";
import { z } from "zod/v4";

import { columns as columnDefs } from "./ticket-columns";
import { useGenericTableParams } from "./use-table-params";

const availableColumns = [
  "subject",
  "contact",
  "status",
  "channel",
  "assignee",
  "createdAt",
  "priority",
  "tags",
  "id",
] as const;
type ColumnName = (typeof availableColumns)[number];

const columnLabelsMap: Record<ColumnName, string> = {
  subject: "Subject",
  contact: "Contact",
  status: "Status",
  channel: "Channel",
  assignee: "Assignee",
  createdAt: "Created At",
  priority: "Priority",
  tags: "Tags",
  id: "ID",
};

const availableColumnsEnum = z.enum(availableColumns);

const columnSchema = z.partialRecord(availableColumnsEnum, z.boolean());

const columnsListSchema = z.array(columnSchema);

type ColumnsList = z.infer<typeof columnsListSchema>;

const defaultColumns: ColumnsList = [
  { subject: true },
  { contact: true },
  { status: true },
  { channel: true },
  { assignee: true },
  { createdAt: true },
  { priority: true },
  { tags: true },
  { id: false },
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
