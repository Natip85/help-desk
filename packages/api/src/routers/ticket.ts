import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";

import {
  conversation,
  conversationPriority,
  conversationStatus,
} from "@help-desk/db/schema/conversations";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createListInput } from "../utils/list-input-schema";
import { buildTicketOrderBy, buildTicketWhereConditions } from "../utils/ticket-filters";

const conversationColumns = getTableColumns(conversation);
const sortableColumns = Object.keys(conversationColumns).filter(
  (col) =>
    !["id", "organizationId", "assignedToId", "contactId", "companyId", "mailboxId"].includes(col)
) as (keyof typeof conversationColumns)[];

const listInput = createListInput(sortableColumns, "createdAt").extend({});

export const ticketRouter = createTRPCRouter({
  all: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const offset = (input.page - 1) * input.limit;

    try {
      // Build where conditions from filter + search
      const { whereConditions } = buildTicketWhereConditions({
        db: ctx.db,
        organizationId,
        filter: input.filter,
        searchQuery: input.q,
      });

      // Build order by with column validation
      const orderBy = buildTicketOrderBy({
        sort: input.sort,
        allowedColumns: sortableColumns,
      });

      // Run paginated query + total count in parallel
      const [items, total] = await Promise.all([
        ctx.db.query.conversation.findMany({
          where: and(...whereConditions),
          limit: input.limit,
          offset,
          orderBy,
          with: {
            contact: {
              columns: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            assignedTo: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
            company: {
              columns: {
                id: true,
                name: true,
              },
            },
            conversationTags: {
              with: {
                tag: true,
              },
            },
          },
        }),
        ctx.db.$count(conversation, and(...whereConditions)),
      ]);

      return {
        items: items.map(({ conversationTags, ...item }) => ({
          ...item,
          tags: conversationTags.map((ct) => ct.tag),
        })),
        total,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      // eslint-disable-next-line no-console
      console.error("[tickets|all|error]", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tickets",
        cause: error,
      });
    }
  }),

  updatePriority: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        priority: z.enum(conversationPriority),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active organization selected",
        });
      }

      const [updated] = await ctx.db
        .update(conversation)
        .set({ priority: input.priority })
        .where(and(eq(conversation.id, input.id), eq(conversation.organizationId, organizationId)))
        .returning({ id: conversation.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return updated;
    }),
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(conversationStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active organization selected",
        });
      }

      const [updated] = await ctx.db
        .update(conversation)
        .set({ status: input.status })
        .where(and(eq(conversation.id, input.id), eq(conversation.organizationId, organizationId)))
        .returning({ id: conversation.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return updated;
    }),
});
