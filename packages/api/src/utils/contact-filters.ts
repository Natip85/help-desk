import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm/utils";

import { contact } from "@help-desk/db/schema/contacts";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortInput = {
  field: string;
  direction: "asc" | "desc";
}[];

type BuildContactWhereConditionsOptions = {
  db: unknown;
  organizationId: string;
  searchQuery?: string;
  additionalConditions?: SQL[];
};

type BuildContactOrderByOptions = {
  sort: SortInput;
  defaultSort?: SQL;
  allowedColumns?: readonly string[];
};

// ─── Where Conditions Builder ────────────────────────────────────────────────

/**
 * Builds complete where conditions for contact queries including
 * organization scoping and search across name / email fields.
 * Returns the conditions array to be used with `and(...conditions)`.
 */
export const buildContactWhereConditions = ({
  organizationId,
  searchQuery,
  additionalConditions = [],
}: BuildContactWhereConditionsOptions) => {
  const whereConditions: SQL[] = [
    eq(contact.organizationId, organizationId),
    isNull(contact.deletedAt),
  ];

  // Add ilike search across name / email columns
  const trimmedQuery = searchQuery?.trim();
  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    const searchCondition = or(
      ilike(contact.firstName, pattern),
      ilike(contact.lastName, pattern),
      ilike(contact.displayName, pattern),
      ilike(contact.email, pattern),
      ilike(contact.phone, pattern)
    );
    if (searchCondition) whereConditions.push(searchCondition);
  }

  // Add any additional conditions
  whereConditions.push(...additionalConditions);

  return { whereConditions };
};

// ─── Order By Builder ────────────────────────────────────────────────────────

/**
 * Builds contact order-by clause with column validation and default sort.
 * Validates that sort fields exist in the contact table.
 */
export const buildContactOrderBy = ({
  sort,
  defaultSort,
  allowedColumns,
}: BuildContactOrderByOptions) => {
  const contactColumns = getTableColumns(contact);

  // Use allowedColumns if provided, otherwise use all contact columns
  const validColumns =
    allowedColumns ? new Set(allowedColumns) : new Set(Object.keys(contactColumns));

  const orderBy = sort
    .filter((s) => s.field !== "")
    .map((s) => {
      const columnName = s.field as keyof typeof contactColumns;

      if (!validColumns.has(s.field)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid sort field: ${s.field}`,
        });
      }

      const sortColumn = contactColumns[columnName];
      return s.direction === "desc" ? desc(sortColumn) : asc(sortColumn);
    });

  // Add default sort if no sort specified
  if (orderBy.length === 0) {
    orderBy.push(defaultSort ?? desc(contact.createdAt));
  }

  return orderBy;
};
