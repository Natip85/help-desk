import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { contact } from "@help-desk/db/schema/contacts";
import { conversation, conversationStatus } from "@help-desk/db/schema/conversations";
import { conversationEvent } from "@help-desk/db/schema/events";
import { note } from "@help-desk/db/schema/notes";
import { contactFormSchema } from "@help-desk/db/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { buildContactOrderBy, buildContactWhereConditions } from "../utils/contact-filters";
import { createBasicListInput } from "../utils/list-input-schema";

const contactColumns = getTableColumns(contact);
const sortableColumns = Object.keys(contactColumns).filter(
  (col) => !["id", "organizationId", "companyId"].includes(col)
) as (keyof typeof contactColumns)[];

const listInput = createBasicListInput(sortableColumns, "createdAt").extend({});

function requireActiveOrganizationId(activeOrganizationId: string | null | undefined) {
  if (!activeOrganizationId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No active organization selected",
    });
  }
  return activeOrganizationId;
}

export const contactRouter = createTRPCRouter({
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
      const { whereConditions } = buildContactWhereConditions({
        db: ctx.db,
        organizationId,
        searchQuery: input.q,
      });

      // Build order by with column validation
      const orderBy = buildContactOrderBy({
        sort: input.sort,
        allowedColumns: sortableColumns,
      });

      // Run paginated query + total count in parallel
      const [items, total] = await Promise.all([
        ctx.db.query.contact.findMany({
          where: and(...whereConditions),
          limit: input.limit,
          offset,
          orderBy,
          with: {
            company: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        }),
        ctx.db.$count(contact, and(...whereConditions)),
      ]);

      return {
        items,
        total,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      // eslint-disable-next-line no-console
      console.error("[contacts|all|error]", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch contacts",
        cause: error,
      });
    }
  }),
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);
    const contactId = input;

    const found = await ctx.db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.organizationId, organizationId)),
      with: {
        company: {
          columns: {
            id: true,
            name: true,
            domain: true,
            website: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!found) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contact not found",
      });
    }

    const recentTicketsRaw = await ctx.db.query.conversation.findMany({
      where: and(
        eq(conversation.organizationId, organizationId),
        eq(conversation.contactId, contactId)
      ),
      orderBy: desc(conversation.createdAt),
      limit: 10,
      with: {
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
    });

    const recentTickets = recentTicketsRaw.map(({ conversationTags, ...c }) => ({
      ...c,
      tags: conversationTags.map((ct) => ct.tag),
    }));

    const recentTicketIds = recentTickets.map((t) => t.id);

    const recentEvents =
      recentTicketIds.length === 0 ?
        []
      : await ctx.db.query.conversationEvent.findMany({
          where: and(
            eq(conversationEvent.organizationId, organizationId),
            inArray(conversationEvent.conversationId, recentTicketIds)
          ),
          orderBy: desc(conversationEvent.createdAt),
          limit: 20,
          with: {
            actor: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

    return {
      contact: {
        id: found.id,
        email: found.email,
        firstName: found.firstName,
        lastName: found.lastName,
        displayName: found.displayName,
        avatarUrl: found.avatarUrl,
        phone: found.phone,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      },
      company: found.company,
      recentTickets,
      recentEvents,
    };
  }),
  conversations: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        statuses: z.array(z.enum(conversationStatus)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const where = and(
        eq(conversation.organizationId, organizationId),
        eq(conversation.contactId, input.contactId),
        ...(input.statuses && input.statuses.length > 0 ?
          [inArray(conversation.status, input.statuses)]
        : [])
      );

      const items = await ctx.db.query.conversation.findMany({
        where,
        orderBy: desc(conversation.lastMessageAt),
        limit: input.limit,
        with: {
          assignedTo: {
            columns: { id: true, name: true, image: true },
          },
          conversationTags: {
            with: { tag: true },
          },
          messages: {
            columns: {
              id: true,
              direction: true,
              subject: true,
              textBody: true,
              createdAt: true,
              fromEmail: true,
            },
            orderBy: (m, { desc }) => desc(m.createdAt),
            limit: 1,
          },
        },
      });

      return {
        items: items.map(({ conversationTags, messages, ...c }) => ({
          ...c,
          tags: conversationTags.map((ct) => ct.tag),
          lastMessage: messages[0] ?? null,
        })),
      };
    }),
  conversationThread: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const found = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.conversationId),
          eq(conversation.organizationId, organizationId)
        ),
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
            columns: { id: true, name: true, image: true },
          },
          company: {
            columns: { id: true, name: true },
          },
          conversationTags: {
            with: { tag: true },
          },
          messages: {
            orderBy: (m, { asc }) => asc(m.createdAt),
            with: {
              sender: {
                columns: { id: true, name: true, image: true },
              },
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
              attachments: {
                columns: {
                  id: true,
                  filename: true,
                  mimeType: true,
                  size: true,
                  storageUrl: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!found) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Fetch notes separately to avoid circular schema imports
      const notes = await ctx.db.query.note.findMany({
        where: eq(note.conversationId, input.conversationId),
        orderBy: asc(note.createdAt),
        with: {
          author: {
            columns: { id: true, name: true, image: true },
          },
        },
      });

      const { conversationTags, ...rest } = found;
      return {
        ...rest,
        tags: conversationTags.map((ct) => ct.tag),
        notes,
      };
    }),
  totalCount: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const count = await ctx.db.$count(contact, eq(contact.organizationId, organizationId));

    return { count };
  }),
  getGlobalSearchAll: protectedProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      const searchTerm = input?.trim();

      const organizationId = ctx.session.session.activeOrganizationId;

      if (!searchTerm || searchTerm.length < 2 || !organizationId) {
        return {
          contacts: [],
        };
      }

      try {
        const contacts = await ctx.db.query.contact.findMany({
          where: and(
            eq(contact.organizationId, organizationId),
            or(
              ilike(contact.firstName, `%${searchTerm}%`),
              ilike(contact.lastName, `%${searchTerm}%`),
              ilike(contact.displayName, `%${searchTerm}%`),
              ilike(contact.email, `%${searchTerm}%`),
              exists(
                ctx.db
                  .select({ id: conversation.id })
                  .from(conversation)
                  .where(
                    and(
                      eq(conversation.contactId, contact.id),
                      eq(conversation.organizationId, organizationId),
                      isNull(conversation.deletedAt),
                      or(
                        ilike(conversation.subject, `%${searchTerm}%`),
                        ilike(conversation.id, `%${searchTerm}%`)
                      )
                    )
                  )
              )
            )
          ),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
          limit: 5,
        });

        return {
          contacts,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[tickets|getGlobalSearchAll|error]", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to perform global search",
        });
      }
    }),
  create: protectedProcedure.input(contactFormSchema).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    // Check for duplicate email within the organization
    const existing = await ctx.db.query.contact.findFirst({
      where: and(eq(contact.organizationId, organizationId), eq(contact.email, input.email)),
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A contact with this email already exists",
      });
    }

    const displayName = [input.firstName, input.lastName].filter(Boolean).join(" ") || null;

    const [newContact] = await ctx.db
      .insert(contact)
      .values({
        organizationId,
        email: input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        displayName,
        phone: input.phone ?? null,
      })
      .returning();

    if (!newContact) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create contact",
      });
    }

    return newContact;
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        firstName: z.string().trim().optional(),
        lastName: z.string().trim().optional(),
        phone: z.string().trim().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.contact.findFirst({
        where: and(eq(contact.id, input.id), eq(contact.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }

      if (input.email && input.email !== existing.email) {
        const duplicate = await ctx.db.query.contact.findFirst({
          where: and(eq(contact.organizationId, organizationId), eq(contact.email, input.email)),
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A contact with this email already exists",
          });
        }
      }

      const firstName =
        input.firstName !== undefined ? input.firstName || null : existing.firstName;
      const lastName = input.lastName !== undefined ? input.lastName || null : existing.lastName;
      const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

      const [updated] = await ctx.db
        .update(contact)
        .set({
          ...(input.email !== undefined && { email: input.email }),
          ...(input.firstName !== undefined && { firstName: input.firstName || null }),
          ...(input.lastName !== undefined && { lastName: input.lastName || null }),
          ...(input.phone !== undefined && { phone: input.phone || null }),
          displayName,
        })
        .where(and(eq(contact.id, input.id), eq(contact.organizationId, organizationId)))
        .returning();

      return updated;
    }),
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const existing = await ctx.db.query.contact.findFirst({
      where: and(eq(contact.id, input), eq(contact.organizationId, organizationId)),
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
    }

    await ctx.db
      .delete(contact)
      .where(and(eq(contact.id, input), eq(contact.organizationId, organizationId)));

    return { success: true };
  }),
});
