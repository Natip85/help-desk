import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { contact } from "@help-desk/db/schema/contacts";
import { conversation, conversationStatus } from "@help-desk/db/schema/conversations";
import { conversationEvent } from "@help-desk/db/schema/events";
import { note } from "@help-desk/db/schema/notes";

import { createTRPCRouter, protectedProcedure } from "../trpc";

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
  /**
   * Contact sidebar "profile" payload.
   * Input is a string to match existing client usage: `queryOptions(contactId)`.
   */
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
});
