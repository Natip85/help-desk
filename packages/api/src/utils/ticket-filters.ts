import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, gte, ilike, inArray, lte } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm/utils";

import type { Database } from "@help-desk/db";
import type { TicketFilter } from "@help-desk/db/validators";
import { conversation } from "@help-desk/db/schema/conversations";
import { conversationTag } from "@help-desk/db/schema/tags";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortInput = {
  field: string;
  direction: "asc" | "desc";
}[];

type BuildTicketWhereConditionsOptions = {
  db: Database;
  organizationId: string;
  filter?: TicketFilter | null;
  searchQuery?: string;
  additionalConditions?: SQL[];
};

type BuildTicketOrderByOptions = {
  sort: SortInput;
  defaultSort?: SQL;
  allowedColumns?: readonly string[];
};

// ─── Filter Builder ──────────────────────────────────────────────────────────

/**
 * Converts a TicketFilter object into an array of Drizzle SQL conditions
 * scoped to a specific organization.
 */
export const createTicketFilters = (
  db: Database,
  organizationId: string,
  filter?: TicketFilter | null
): SQL[] => {
  const conditions: SQL[] = [eq(conversation.organizationId, organizationId)];

  if (!filter) return conditions;

  // Enum array filters
  if (filter.statuses && filter.statuses.length > 0) {
    conditions.push(inArray(conversation.status, filter.statuses));
  }

  if (filter.priorities && filter.priorities.length > 0) {
    conditions.push(inArray(conversation.priority, filter.priorities));
  }

  if (filter.channels && filter.channels.length > 0) {
    conditions.push(inArray(conversation.channel, filter.channels));
  }

  // FK ID array filters
  if (filter.assignedToIds && filter.assignedToIds.length > 0) {
    conditions.push(inArray(conversation.assignedToId, filter.assignedToIds));
  }

  if (filter.contactIds && filter.contactIds.length > 0) {
    conditions.push(inArray(conversation.contactId, filter.contactIds));
  }

  if (filter.companyIds && filter.companyIds.length > 0) {
    conditions.push(inArray(conversation.companyId, filter.companyIds));
  }

  if (filter.mailboxIds && filter.mailboxIds.length > 0) {
    conditions.push(inArray(conversation.mailboxId, filter.mailboxIds));
  }

  // Tag filter via exists subquery on junction table
  if (filter.tagIds && filter.tagIds.length > 0) {
    conditions.push(
      exists(
        db
          .select()
          .from(conversationTag)
          .where(
            and(
              eq(conversationTag.conversationId, conversation.id),
              inArray(conversationTag.tagId, filter.tagIds)
            )
          )
          .limit(1)
      )
    );
  }

  // Date range filters
  if (filter.createdAt) {
    if (filter.createdAt.from) {
      conditions.push(gte(conversation.createdAt, filter.createdAt.from));
    }
    if (filter.createdAt.to) {
      conditions.push(lte(conversation.createdAt, filter.createdAt.to));
    }
  }

  if (filter.lastMessageAt) {
    if (filter.lastMessageAt.from) {
      conditions.push(gte(conversation.lastMessageAt, filter.lastMessageAt.from));
    }
    if (filter.lastMessageAt.to) {
      conditions.push(lte(conversation.lastMessageAt, filter.lastMessageAt.to));
    }
  }

  if (filter.closedAt) {
    if (filter.closedAt.from) {
      conditions.push(gte(conversation.closedAt, filter.closedAt.from));
    }
    if (filter.closedAt.to) {
      conditions.push(lte(conversation.closedAt, filter.closedAt.to));
    }
  }

  return conditions;
};

// ─── Where Conditions Builder ────────────────────────────────────────────────

/**
 * Builds complete where conditions for ticket queries including filters,
 * search, and optional additional conditions.
 * Returns the conditions array to be used with `and(...conditions)`.
 */
export const buildTicketWhereConditions = ({
  db,
  organizationId,
  filter,
  searchQuery,
  additionalConditions = [],
}: BuildTicketWhereConditionsOptions) => {
  const whereConditions = createTicketFilters(db, organizationId, filter);

  // Add ilike search on conversation subject
  const trimmedQuery = searchQuery?.trim();
  if (trimmedQuery) {
    whereConditions.push(ilike(conversation.subject, `%${trimmedQuery}%`));
  }

  // Add any additional conditions
  whereConditions.push(...additionalConditions);

  return { whereConditions };
};

// ─── Order By Builder ────────────────────────────────────────────────────────

/**
 * Builds ticket order-by clause with column validation and default sort.
 * Validates that sort fields exist in the conversation table.
 */
export const buildTicketOrderBy = ({
  sort,
  defaultSort,
  allowedColumns,
}: BuildTicketOrderByOptions) => {
  const conversationColumns = getTableColumns(conversation);

  // Use allowedColumns if provided, otherwise use all conversation columns
  const validColumns =
    allowedColumns ? new Set(allowedColumns) : new Set(Object.keys(conversationColumns));

  const orderBy = sort
    .filter((s) => s.field !== "")
    .map((s) => {
      const columnName = s.field as keyof typeof conversationColumns;

      if (!validColumns.has(s.field)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid sort field: ${s.field}`,
        });
      }

      const sortColumn = conversationColumns[columnName];
      return s.direction === "desc" ? desc(sortColumn) : asc(sortColumn);
    });

  // Add default sort if no sort specified
  if (orderBy.length === 0) {
    orderBy.push(defaultSort ?? desc(conversation.createdAt));
  }

  return orderBy;
};
