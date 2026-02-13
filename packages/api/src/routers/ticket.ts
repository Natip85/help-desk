import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, ilike, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";

import {
  conversation,
  conversationPriority,
  conversationStatus,
  message,
} from "@help-desk/db/schema/conversations";
import { conversationEvent } from "@help-desk/db/schema/events";
import { mailbox } from "@help-desk/db/schema/mailboxes";
import { note } from "@help-desk/db/schema/notes";
import { env } from "@help-desk/env/server";

import { resend } from "../lib/resend";
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

  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const conv = await ctx.db.query.conversation.findFirst({
      where: and(
        eq(conversation.id, input),
        eq(conversation.organizationId, organizationId),
        isNull(conversation.deletedAt)
      ),
      with: {
        contact: {
          columns: { id: true, email: true, firstName: true, lastName: true, displayName: true },
        },
        assignedTo: {
          columns: { id: true, name: true, image: true },
        },
        mailbox: {
          columns: { id: true, email: true, name: true },
        },
        conversationTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!conv) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
    }

    // Resolve the "from" email the same way sendReply does
    let fromEmail = conv.mailbox?.email;
    if (!fromEmail) {
      const defaultMailbox = await ctx.db.query.mailbox.findFirst({
        where: and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)),
        columns: { email: true },
      });
      fromEmail = defaultMailbox?.email ?? env.SENDER_EMAIL;
    }

    const { conversationTags, ...rest } = conv;
    return {
      ...rest,
      fromEmail,
      tags: conversationTags.map((ct) => ct.tag),
    };
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

  updateAssignee: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToId: z.string().nullable(),
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
        .set({ assignedToId: input.assignedToId })
        .where(and(eq(conversation.id, input.id), eq(conversation.organizationId, organizationId)))
        .returning({ id: conversation.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Log assigned / unassigned event
      await ctx.db.insert(conversationEvent).values({
        organizationId,
        conversationId: input.id,
        actorId: ctx.session.user.id,
        type: input.assignedToId ? "assigned" : "unassigned",
        payload: {
          assignedToId: input.assignedToId,
        },
      });

      return updated;
    }),

  sendReply: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        htmlBody: z.string().min(1),
        textBody: z.string(),
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

      // 1. Fetch the conversation with mailbox, contact, and latest inbound message
      const conv = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.conversationId),
          eq(conversation.organizationId, organizationId)
        ),
        with: {
          mailbox: true,
          contact: true,
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // 2. Resolve the mailbox to send from:
      //    conversation mailbox -> org default mailbox -> SENDER_EMAIL fallback
      const resolvedMailbox =
        conv.mailbox ??
        (await ctx.db.query.mailbox.findFirst({
          where: and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)),
        }));

      const fromEmail = resolvedMailbox?.email ?? env.SENDER_EMAIL;
      const fromName = resolvedMailbox?.name ?? "Support";

      // 3. Find the last inbound message for email threading headers
      const lastInboundMessage = await ctx.db.query.message.findFirst({
        where: and(eq(message.conversationId, conv.id), eq(message.direction, "inbound")),
        orderBy: desc(message.createdAt),
      });

      // 4. Build email fields
      const toEmail = conv.contact.email;
      const subject =
        conv.subject ?
          conv.subject.startsWith("Re:") ?
            conv.subject
          : `Re: ${conv.subject}`
        : "Re: (no subject)";

      // 5. Build In-Reply-To and References headers for proper email threading
      let inReplyToHeader: string | null = null;
      let referencesHeader: string | null = null;
      if (lastInboundMessage?.emailMessageId) {
        inReplyToHeader = lastInboundMessage.emailMessageId;
        const existingRefs = lastInboundMessage.references ?? "";
        referencesHeader =
          existingRefs ?
            `${existingRefs} ${lastInboundMessage.emailMessageId}`
          : lastInboundMessage.emailMessageId;
      }

      // 6. Send the email via Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [toEmail],
        subject,
        html: input.htmlBody,
        text: input.textBody,
        headers:
          inReplyToHeader ?
            { "In-Reply-To": inReplyToHeader, References: referencesHeader ?? "" }
          : undefined,
      });

      if (emailError) {
        // eslint-disable-next-line no-console
        console.error("[tickets|sendReply|resend-error]", emailError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }

      // 7. Persist message + update conversation + log event in a transaction
      const result = await ctx.db.transaction(async (tx) => {
        // Insert outbound message
        const [newMessage] = await tx
          .insert(message)
          .values({
            conversationId: conv.id,
            senderId: ctx.session.user.id,
            direction: "outbound",
            resendEmailId: emailData?.id ?? null,
            fromEmail,
            toEmail: [toEmail],
            subject,
            textBody: input.textBody,
            htmlBody: input.htmlBody,
            emailMessageId: null,
            inReplyTo: inReplyToHeader,
            references: referencesHeader,
          })
          .returning();

        if (!newMessage) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create message record",
          });
        }

        // Update conversation lastMessageAt
        await tx
          .update(conversation)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversation.id, conv.id));

        // Log email_sent event
        await tx.insert(conversationEvent).values({
          organizationId,
          conversationId: conv.id,
          actorId: ctx.session.user.id,
          type: "email_sent",
          payload: {
            messageId: newMessage.id,
            to: toEmail,
            subject,
          },
        });

        return newMessage;
      });

      return { messageId: result.id };
    }),

  forwardEmail: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        toEmail: z.string().email(),
        htmlBody: z.string().min(1),
        textBody: z.string(),
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

      // 1. Fetch the conversation with mailbox
      const conv = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.conversationId),
          eq(conversation.organizationId, organizationId)
        ),
        with: {
          mailbox: true,
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // 2. Resolve the mailbox to send from
      const resolvedMailbox =
        conv.mailbox ??
        (await ctx.db.query.mailbox.findFirst({
          where: and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)),
        }));

      const fromEmail = resolvedMailbox?.email ?? env.SENDER_EMAIL;
      const fromName = resolvedMailbox?.name ?? "Support";

      // 3. Build subject with Fwd: prefix
      const subject =
        conv.subject ?
          conv.subject.startsWith("Fwd:") ?
            conv.subject
          : `Fwd: ${conv.subject}`
        : "Fwd: (no subject)";

      // 4. Send the email via Resend (no threading headers for forwards)
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [input.toEmail],
        subject,
        html: input.htmlBody,
        text: input.textBody,
      });

      if (emailError) {
        // eslint-disable-next-line no-console
        console.error("[tickets|forwardEmail|resend-error]", emailError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to forward email",
        });
      }

      // 5. Persist message + update conversation + log event in a transaction
      const result = await ctx.db.transaction(async (tx) => {
        const [newMessage] = await tx
          .insert(message)
          .values({
            conversationId: conv.id,
            senderId: ctx.session.user.id,
            direction: "outbound",
            messageType: "forward",
            resendEmailId: emailData?.id ?? null,
            fromEmail,
            toEmail: [input.toEmail],
            subject,
            textBody: input.textBody,
            htmlBody: input.htmlBody,
            emailMessageId: null,
            inReplyTo: null,
            references: null,
          })
          .returning();

        if (!newMessage) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create message record",
          });
        }

        // Update conversation lastMessageAt
        await tx
          .update(conversation)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversation.id, conv.id));

        // Log email_sent event
        await tx.insert(conversationEvent).values({
          organizationId,
          conversationId: conv.id,
          actorId: ctx.session.user.id,
          type: "email_sent",
          payload: {
            messageId: newMessage.id,
            to: input.toEmail,
            subject,
            forwarded: true,
          },
        });

        return newMessage;
      });

      return { messageId: result.id };
    }),

  addNote: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        body: z.string().min(1),
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

      // Verify conversation belongs to the organization
      const conv = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.conversationId),
          eq(conversation.organizationId, organizationId)
        ),
        columns: { id: true },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Insert note + event in a transaction
      const result = await ctx.db.transaction(async (tx) => {
        const [newNote] = await tx
          .insert(note)
          .values({
            conversationId: conv.id,
            authorId: ctx.session.user.id,
            body: input.body,
          })
          .returning();

        if (!newNote) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create note",
          });
        }

        await tx.insert(conversationEvent).values({
          organizationId,
          conversationId: conv.id,
          actorId: ctx.session.user.id,
          type: "note_added",
          payload: { noteId: newNote.id },
        });

        return newNote;
      });

      return { noteId: result.id };
    }),
  totalCount: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      return { count: 0 };
    }

    const count = await ctx.db.$count(
      conversation,
      and(eq(conversation.organizationId, organizationId), isNull(conversation.deletedAt))
    );

    return { count };
  }),

  softDelete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const [updated] = await ctx.db
      .update(conversation)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(conversation.id, input),
          eq(conversation.organizationId, organizationId),
          isNull(conversation.deletedAt)
        )
      )
      .returning({ id: conversation.id });

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket not found",
      });
    }

    return updated;
  }),

  bulkSoftDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active organization selected",
        });
      }

      const { rowCount } = await ctx.db
        .update(conversation)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(conversation.organizationId, organizationId),
            isNull(conversation.deletedAt),
            or(...input.ids.map((id) => eq(conversation.id, id)))
          )
        );

      return { count: rowCount };
    }),

  restore: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const [updated] = await ctx.db
      .update(conversation)
      .set({ deletedAt: null })
      .where(
        and(
          eq(conversation.id, input),
          eq(conversation.organizationId, organizationId),
          isNotNull(conversation.deletedAt)
        )
      )
      .returning({ id: conversation.id });

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket not found or not deleted",
      });
    }

    return updated;
  }),

  hardDelete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const [deleted] = await ctx.db
      .delete(conversation)
      .where(
        and(
          eq(conversation.id, input),
          eq(conversation.organizationId, organizationId),
          isNotNull(conversation.deletedAt)
        )
      )
      .returning({ id: conversation.id });

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket not found or not in trash",
      });
    }

    return deleted;
  }),

  listDeleted: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active organization selected",
        });
      }

      const offset = (input.page - 1) * input.limit;

      const whereCondition = and(
        eq(conversation.organizationId, organizationId),
        isNotNull(conversation.deletedAt)
      );

      const [items, total] = await Promise.all([
        ctx.db.query.conversation.findMany({
          where: whereCondition,
          limit: input.limit,
          offset,
          orderBy: [desc(conversation.deletedAt)],
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
          },
        }),
        ctx.db.$count(conversation, whereCondition),
      ]);

      return { items, total };
    }),

  getGlobalSearchAll: protectedProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      const searchTerm = input?.trim();

      const organizationId = ctx.session.session.activeOrganizationId;

      if (!searchTerm || searchTerm.length < 2 || !organizationId) {
        return {
          tickets: [],
        };
      }

      try {
        const tickets = await ctx.db.query.conversation.findMany({
          where: and(
            eq(conversation.organizationId, organizationId),
            isNull(conversation.deletedAt),
            or(
              ilike(conversation.subject, `%${searchTerm}%`),
              ilike(conversation.id, `%${searchTerm}%`)
            )
          ),
          columns: {
            id: true,
            subject: true,
            channel: true,
          },
          limit: 5,
        });

        return {
          tickets,
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
});
