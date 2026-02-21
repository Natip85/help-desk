import { TRPCError } from "@trpc/server";
import {
  and,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { contact } from "@help-desk/db/schema/contacts";
import {
  conversation,
  conversationPriority,
  conversationStatus,
  message,
} from "@help-desk/db/schema/conversations";
import { conversationEvent } from "@help-desk/db/schema/events";
import { mailbox } from "@help-desk/db/schema/mailboxes";
import { note } from "@help-desk/db/schema/notes";
import { notification } from "@help-desk/db/schema/notifications";
import { conversationTag } from "@help-desk/db/schema/tags";
import { emailFormSchema, exportFormSchema, ticketFormSchema } from "@help-desk/db/validators";
import { env } from "@help-desk/env/server";

import { loadTicketFacts, runAutomationsForTicket } from "../lib/automation-engine";
import { pusher } from "../lib/pusher";
import { resend } from "../lib/resend";
import * as slaEngine from "../lib/sla-engine";
import { createTRPCRouter, protectedProcedure, requirePermission } from "../trpc";
import { createListInput } from "../utils/list-input-schema";
import { buildTicketOrderBy, buildTicketWhereConditions } from "../utils/ticket-filters";

const conversationColumns = getTableColumns(conversation);
const sortableColumns = Object.keys(conversationColumns).filter(
  (col) =>
    !["id", "organizationId", "assignedToId", "contactId", "companyId", "mailboxId"].includes(col)
) as (keyof typeof conversationColumns)[];

const listInput = createListInput(sortableColumns, "lastMessageAt").extend({});

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

      try {
        await slaEngine.recomputeOnPriorityChange(ctx.db, input.id, input.priority, organizationId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[SLA] Failed to recompute deadline on priority change:", error);
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

      // Run status_changed automations
      try {
        const facts = await loadTicketFacts(ctx.db, input.id);
        if (facts) {
          await runAutomationsForTicket(ctx.db, organizationId, input.id, facts, "status_changed");
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Automations] Failed to run status_changed automations:", error);
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
        .returning({ id: conversation.id, subject: conversation.subject });

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

      // Send notification to the assigned user (skip if assigning to self)
      if (input.assignedToId && input.assignedToId !== ctx.session.user.id) {
        const ticketLabel = updated.subject ?? `Ticket #${updated.id.slice(0, 8)}`;
        const [newNotification] = await ctx.db
          .insert(notification)
          .values({
            userId: input.assignedToId,
            organizationId,
            type: "ticket_assigned",
            title: `Ticket assigned: ${ticketLabel}`,
            body: `${ctx.session.user.name} assigned "${ticketLabel}" to you`,
            data: {
              conversationId: input.id,
              assignedBy: ctx.session.user.id,
              assignedByName: ctx.session.user.name,
            },
          })
          .returning();

        if (newNotification) {
          await pusher.trigger(
            `private-user-${input.assignedToId}`,
            "notification:new",
            newNotification
          );
        }
      }

      return updated;
    }),

  updateCustomFields: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        customFields: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        removeFields: z.array(z.string()).optional(),
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

      // Fetch the current ticket to merge custom fields
      const existing = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.id),
          eq(conversation.organizationId, organizationId),
          isNull(conversation.deletedAt)
        ),
        columns: { id: true, customFields: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Merge: set new values, then remove any fields marked for removal
      const current = existing.customFields ?? {};
      const merged = { ...current, ...input.customFields };
      if (input.removeFields) {
        for (const key of input.removeFields) {
          delete merged[key];
        }
      }

      const [updated] = await ctx.db
        .update(conversation)
        .set({ customFields: merged })
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

  sendReply: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        htmlBody: z.string().min(1),
        textBody: z.string(),
        cc: z.array(z.string().email()).optional(),
        bcc: z.array(z.string().email()).optional(),
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

      // 6. Build a plus-addressed Reply-To so replies thread back to this conversation
      const [emailLocal, emailDomain] = fromEmail.split("@");
      const replyToAddress =
        emailLocal && emailDomain ? `${emailLocal}+conv_${conv.id}@${emailDomain}` : fromEmail;

      // 7. Send the email via Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        replyTo: [`${fromName} <${replyToAddress}>`],
        to: [toEmail],
        cc: input.cc?.length ? input.cc : undefined,
        bcc: input.bcc?.length ? input.bcc : undefined,
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

      // 8. Persist message + update conversation + log event in a transaction
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
            cc: input.cc?.length ? input.cc : null,
            bcc: input.bcc?.length ? input.bcc : null,
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

        // Update conversation lastMessageAt + auto-assign if unassigned
        const conversationUpdates: Partial<typeof conversation.$inferInsert> = {
          lastMessageAt: new Date(),
        };

        if (!conv.assignedToId) {
          conversationUpdates.assignedToId = ctx.session.user.id;
        }

        await tx.update(conversation).set(conversationUpdates).where(eq(conversation.id, conv.id));

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

        // Log auto-assignment event if ticket was unassigned
        if (!conv.assignedToId) {
          await tx.insert(conversationEvent).values({
            organizationId,
            conversationId: conv.id,
            actorId: ctx.session.user.id,
            type: "assigned",
            payload: {
              assignedToId: ctx.session.user.id,
            },
          });
        }

        return newMessage;
      });

      // Record first response for SLA tracking
      try {
        await slaEngine.recordFirstResponse(ctx.db, conv.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[SLA] Failed to record first response:", error);
      }

      // Run ticket_replied automations
      try {
        const facts = await loadTicketFacts(ctx.db, conv.id);
        if (facts) {
          await runAutomationsForTicket(ctx.db, organizationId, conv.id, facts, "ticket_replied");
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Automations] Failed to run ticket_replied automations:", error);
      }

      return { messageId: result.id };
    }),

  forwardEmail: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        toEmail: z.string().email(),
        htmlBody: z.string().min(1),
        textBody: z.string(),
        cc: z.array(z.string().email()).optional(),
        bcc: z.array(z.string().email()).optional(),
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

      // 4. Build a plus-addressed Reply-To so replies thread back to this conversation
      const [emailLocal, emailDomain] = fromEmail.split("@");
      const replyToAddress =
        emailLocal && emailDomain ? `${emailLocal}+conv_${conv.id}@${emailDomain}` : fromEmail;

      // 5. Send the email via Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        replyTo: [`${fromName} <${replyToAddress}>`],
        to: [input.toEmail],
        cc: input.cc?.length ? input.cc : undefined,
        bcc: input.bcc?.length ? input.bcc : undefined,
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

      // 6. Persist message + update conversation + log event in a transaction
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
            cc: input.cc?.length ? input.cc : null,
            bcc: input.bcc?.length ? input.bcc : null,
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
  getUpdatesCheck: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      return { latestMessageAt: null, totalCount: 0, latestSlaBreachedAt: null };
    }

    const whereCondition = and(
      eq(conversation.organizationId, organizationId),
      isNull(conversation.deletedAt)
    );

    const [latestConversation, totalCount, latestBreached] = await Promise.all([
      ctx.db.query.conversation.findFirst({
        where: whereCondition,
        orderBy: [desc(conversation.lastMessageAt)],
        columns: { lastMessageAt: true },
      }),
      ctx.db.$count(conversation, whereCondition),
      ctx.db.query.conversation.findFirst({
        where: and(whereCondition, isNotNull(conversation.slaBreachedAt)),
        orderBy: [desc(conversation.slaBreachedAt)],
        columns: { slaBreachedAt: true },
      }),
    ]);

    return {
      latestMessageAt: latestConversation?.lastMessageAt ?? null,
      totalCount,
      latestSlaBreachedAt: latestBreached?.slaBreachedAt ?? null,
    };
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

  bulkAssign: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        assigneeId: z.string().nullable(),
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

      const { rowCount } = await ctx.db
        .update(conversation)
        .set({ assignedToId: input.assigneeId })
        .where(
          and(
            eq(conversation.organizationId, organizationId),
            isNull(conversation.deletedAt),
            or(...input.ids.map((id) => eq(conversation.id, id)))
          )
        );

      // Send notification to the assigned user (skip if assigning to self or unassigning)
      if (
        input.assigneeId &&
        input.assigneeId !== ctx.session.user.id &&
        rowCount &&
        rowCount > 0
      ) {
        const [newNotification] = await ctx.db
          .insert(notification)
          .values({
            userId: input.assigneeId,
            organizationId,
            type: "ticket_assigned",
            title:
              rowCount === 1 ? "Ticket assigned to you" : `${rowCount} tickets assigned to you`,
            body: `${ctx.session.user.name} assigned ${rowCount === 1 ? "a ticket" : `${rowCount} tickets`} to you`,
            data: {
              conversationIds: input.ids,
              assignedBy: ctx.session.user.id,
              assignedByName: ctx.session.user.name,
            },
          })
          .returning();

        if (newNotification) {
          await pusher.trigger(
            `private-user-${input.assigneeId}`,
            "notification:new",
            newNotification
          );
        }
      }

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
              ilike(conversation.id, `%${searchTerm}%`),
              exists(
                ctx.db
                  .select({ id: message.id })
                  .from(message)
                  .where(
                    and(
                      eq(message.conversationId, conversation.id),
                      ilike(message.textBody, `%${searchTerm}%`)
                    )
                  )
              ),
              exists(
                ctx.db
                  .select({ id: contact.id })
                  .from(contact)
                  .where(
                    and(
                      eq(contact.id, conversation.contactId),
                      ilike(contact.email, `%${searchTerm}%`)
                    )
                  )
              )
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
  create: protectedProcedure.input(ticketFormSchema).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    // 1. Resolve the contact: use existing or create a new one
    let ticketContact: { id: string; email: string; companyId: string | null };

    if (input.contactId) {
      const existing = await ctx.db.query.contact.findFirst({
        where: and(
          eq(contact.id, input.contactId),
          eq(contact.organizationId, organizationId),
          isNull(contact.deletedAt)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      ticketContact = existing;
    } else if (input.newContact) {
      // Check for duplicate email within the org
      const duplicate = await ctx.db.query.contact.findFirst({
        where: and(
          eq(contact.organizationId, organizationId),
          eq(contact.email, input.newContact.email),
          isNull(contact.deletedAt)
        ),
      });

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A contact with this email already exists",
        });
      }

      const displayName =
        [input.newContact.firstName, input.newContact.lastName].filter(Boolean).join(" ") || null;

      const [created] = await ctx.db
        .insert(contact)
        .values({
          organizationId,
          email: input.newContact.email,
          firstName: input.newContact.firstName ?? null,
          lastName: input.newContact.lastName ?? null,
          displayName,
          phone: input.newContact.phone ?? null,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create contact",
        });
      }

      ticketContact = created;
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either an existing contact or new contact details are required",
      });
    }

    // 2. Resolve the mailbox for fromEmail (org default mailbox -> env fallback)
    const defaultMailbox = await ctx.db.query.mailbox.findFirst({
      where: and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)),
    });

    const fromEmail = defaultMailbox?.email ?? env.SENDER_EMAIL;

    // 3. Run all inserts in a transaction
    const result = await ctx.db.transaction(async (tx) => {
      // Insert the conversation
      const [newTicket] = await tx
        .insert(conversation)
        .values({
          organizationId,
          contactId: ticketContact.id,
          companyId: ticketContact.companyId,
          mailboxId: defaultMailbox?.id,
          subject: input.subject,
          channel: input.channel ?? "email",
          status: input.status,
          priority: input.priority,
          assignedToId: input.assignedToId,
          lastMessageAt: new Date(),
        })
        .returning();

      if (!newTicket) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create ticket",
        });
      }

      // Insert the first message (from the description field)
      const [newMessage] = await tx
        .insert(message)
        .values({
          conversationId: newTicket.id,
          senderId: ctx.session.user.id,
          direction: "outbound",
          fromEmail,
          toEmail: [ticketContact.email],
          subject: input.subject,
          htmlBody: input.description,
        })
        .returning();

      if (!newMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create message",
        });
      }

      // Log the conversation_created event
      await tx.insert(conversationEvent).values({
        organizationId,
        conversationId: newTicket.id,
        actorId: ctx.session.user.id,
        type: "conversation_created",
        payload: {
          messageId: newMessage.id,
          subject: input.subject,
          contactId: ticketContact.id,
        },
      });

      // Insert tags into the join table
      if (input.tagIds && input.tagIds.length > 0) {
        await tx.insert(conversationTag).values(
          input.tagIds.map((tagId) => ({
            conversationId: newTicket.id,
            tagId,
          }))
        );
      }

      return newTicket;
    });

    // Compute SLA deadline outside the transaction
    try {
      const deadline = await slaEngine.computeDeadline(
        ctx.db,
        organizationId,
        input.priority ?? "normal",
        result.createdAt
      );
      if (deadline) {
        await ctx.db
          .update(conversation)
          .set({ slaFirstResponseDueAt: deadline })
          .where(eq(conversation.id, result.id));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[SLA] Failed to compute deadline on ticket create:", error);
    }

    return result;
  }),

  createEmail: protectedProcedure.input(emailFormSchema).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    // 1. Resolve the contact: use existing or create a new one
    let emailContact: { id: string; email: string; companyId: string | null };

    if (input.contactId) {
      const existing = await ctx.db.query.contact.findFirst({
        where: and(
          eq(contact.id, input.contactId),
          eq(contact.organizationId, organizationId),
          isNull(contact.deletedAt)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      emailContact = existing;
    } else if (input.newContact) {
      // Check for duplicate email within the org
      const duplicate = await ctx.db.query.contact.findFirst({
        where: and(
          eq(contact.organizationId, organizationId),
          eq(contact.email, input.newContact.email),
          isNull(contact.deletedAt)
        ),
      });

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A contact with this email already exists",
        });
      }

      const displayName =
        [input.newContact.firstName, input.newContact.lastName].filter(Boolean).join(" ") || null;

      const [created] = await ctx.db
        .insert(contact)
        .values({
          organizationId,
          email: input.newContact.email,
          firstName: input.newContact.firstName ?? null,
          lastName: input.newContact.lastName ?? null,
          displayName,
          phone: input.newContact.phone ?? null,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create contact",
        });
      }

      emailContact = created;
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either an existing contact or new contact details are required",
      });
    }

    // 2. Resolve the selected mailbox
    const selectedMailbox = await ctx.db.query.mailbox.findFirst({
      where: and(eq(mailbox.id, input.mailboxId), eq(mailbox.organizationId, organizationId)),
    });

    if (!selectedMailbox) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mailbox not found",
      });
    }

    const fromEmail = selectedMailbox.email;
    const fromName = selectedMailbox.name;

    // 3. Create the conversation first (we need the ID for the Reply-To address)
    const result = await ctx.db.transaction(async (tx) => {
      // Insert the conversation
      const [newConversation] = await tx
        .insert(conversation)
        .values({
          organizationId,
          contactId: emailContact.id,
          companyId: emailContact.companyId,
          mailboxId: selectedMailbox.id,
          subject: input.subject,
          channel: "email",
          status: input.status,
          priority: input.priority,
          assignedToId: input.assignedToId,
          customFields: input.customFields ?? {},
          lastMessageAt: new Date(),
        })
        .returning();

      if (!newConversation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }

      // 4. Build plus-addressed Reply-To so replies thread back
      const [emailLocal, emailDomain] = fromEmail.split("@");
      const replyToAddress =
        emailLocal && emailDomain ?
          `${emailLocal}+conv_${newConversation.id}@${emailDomain}`
        : fromEmail;

      // 5. Send the email via Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        replyTo: [`${fromName} <${replyToAddress}>`],
        to: [emailContact.email],
        cc: input.cc?.length ? input.cc : undefined,
        bcc: input.bcc?.length ? input.bcc : undefined,
        subject: input.subject,
        html: input.description,
      });

      if (emailError) {
        // eslint-disable-next-line no-console
        console.error("[tickets|createEmail|resend-error]", emailError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }

      // 6. Insert the outbound message
      const [newMessage] = await tx
        .insert(message)
        .values({
          conversationId: newConversation.id,
          senderId: ctx.session.user.id,
          direction: "outbound",
          resendEmailId: emailData?.id ?? null,
          fromEmail,
          toEmail: [emailContact.email],
          cc: input.cc?.length ? input.cc : null,
          bcc: input.bcc?.length ? input.bcc : null,
          subject: input.subject,
          htmlBody: input.description,
        })
        .returning();

      if (!newMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create message record",
        });
      }

      // 7. Log conversation_created and email_sent events
      await tx.insert(conversationEvent).values({
        organizationId,
        conversationId: newConversation.id,
        actorId: ctx.session.user.id,
        type: "conversation_created",
        payload: {
          messageId: newMessage.id,
          subject: input.subject,
          contactId: emailContact.id,
        },
      });

      await tx.insert(conversationEvent).values({
        organizationId,
        conversationId: newConversation.id,
        actorId: ctx.session.user.id,
        type: "email_sent",
        payload: {
          messageId: newMessage.id,
          to: emailContact.email,
          subject: input.subject,
        },
      });

      // 8. Insert tags into the join table
      if (input.tagIds && input.tagIds.length > 0) {
        await tx.insert(conversationTag).values(
          input.tagIds.map((tagId) => ({
            conversationId: newConversation.id,
            tagId,
          }))
        );
      }

      return newConversation;
    });

    // Compute SLA deadline outside the transaction
    try {
      const deadline = await slaEngine.computeDeadline(
        ctx.db,
        organizationId,
        input.priority ?? "normal",
        result.createdAt
      );
      if (deadline) {
        await ctx.db
          .update(conversation)
          .set({ slaFirstResponseDueAt: deadline })
          .where(eq(conversation.id, result.id));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[SLA] Failed to compute deadline on email create:", error);
    }

    return result;
  }),

  merge: protectedProcedure
    .input(
      z.object({
        primaryTicketId: z.string(),
        secondaryTicketId: z.string(),
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

      if (input.primaryTicketId === input.secondaryTicketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge a ticket into itself",
        });
      }

      // Fetch both tickets and validate
      const [primary, secondary] = await Promise.all([
        ctx.db.query.conversation.findFirst({
          where: and(
            eq(conversation.id, input.primaryTicketId),
            eq(conversation.organizationId, organizationId),
            isNull(conversation.deletedAt)
          ),
          columns: { id: true, subject: true, status: true },
        }),
        ctx.db.query.conversation.findFirst({
          where: and(
            eq(conversation.id, input.secondaryTicketId),
            eq(conversation.organizationId, organizationId),
            isNull(conversation.deletedAt)
          ),
          columns: { id: true, subject: true, status: true },
        }),
      ]);

      if (!primary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Primary ticket not found",
        });
      }

      if (!secondary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Secondary ticket not found",
        });
      }

      if (primary.status === "merged") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge into a ticket that is already merged",
        });
      }

      if (secondary.status === "merged") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ticket has already been merged",
        });
      }

      // Execute merge in a transaction
      await ctx.db.transaction(async (tx) => {
        // Update secondary ticket: mark as merged
        await tx
          .update(conversation)
          .set({
            status: "merged",
            mergedIntoId: primary.id,
            closedAt: new Date(),
          })
          .where(eq(conversation.id, secondary.id));

        // Create merge event on the primary ticket
        await tx.insert(conversationEvent).values({
          organizationId,
          conversationId: primary.id,
          actorId: ctx.session.user.id,
          type: "ticket_merged",
          payload: {
            mergedTicketId: secondary.id,
            mergedTicketSubject: secondary.subject,
          },
        });

        // Create merge event on the secondary ticket
        await tx.insert(conversationEvent).values({
          organizationId,
          conversationId: secondary.id,
          actorId: ctx.session.user.id,
          type: "ticket_merged",
          payload: {
            mergedIntoTicketId: primary.id,
            mergedIntoTicketSubject: primary.subject,
          },
        });
      });

      return { primaryTicketId: primary.id, secondaryTicketId: secondary.id };
    }),

  getMergedTickets: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const mergedTickets = await ctx.db.query.conversation.findMany({
      where: and(
        eq(conversation.organizationId, organizationId),
        eq(conversation.mergedIntoId, input)
      ),
      columns: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
      },
      with: {
        contact: {
          columns: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: [desc(conversation.createdAt)],
    });

    return mergedTickets;
  }),

  unmerge: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const ticket = await ctx.db.query.conversation.findFirst({
      where: and(eq(conversation.id, input), eq(conversation.organizationId, organizationId)),
      columns: { id: true, subject: true, status: true, mergedIntoId: true },
    });

    if (!ticket) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "merged" || !ticket.mergedIntoId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This ticket is not merged",
      });
    }

    const primaryTicketId = ticket.mergedIntoId;

    await ctx.db.transaction(async (tx) => {
      // Restore the ticket to open status
      await tx
        .update(conversation)
        .set({
          status: "open",
          mergedIntoId: null,
          closedAt: null,
        })
        .where(eq(conversation.id, ticket.id));

      // Log unmerge event on the (formerly) secondary ticket
      await tx.insert(conversationEvent).values({
        organizationId,
        conversationId: ticket.id,
        actorId: ctx.session.user.id,
        type: "ticket_unmerged",
        payload: {
          previouslyMergedIntoId: primaryTicketId,
        },
      });

      // Log unmerge event on the primary ticket
      await tx.insert(conversationEvent).values({
        organizationId,
        conversationId: primaryTicketId,
        actorId: ctx.session.user.id,
        type: "ticket_unmerged",
        payload: {
          unmergedTicketId: ticket.id,
          unmergedTicketSubject: ticket.subject,
        },
      });
    });

    return { id: ticket.id };
  }),

  getTicketEvents: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const events = await ctx.db.query.conversationEvent.findMany({
      where: and(
        eq(conversationEvent.conversationId, input),
        eq(conversationEvent.organizationId, organizationId),
        or(
          eq(conversationEvent.type, "ticket_merged"),
          eq(conversationEvent.type, "ticket_unmerged")
        )
      ),
      with: {
        actor: {
          columns: { id: true, name: true, image: true },
        },
      },
      orderBy: [desc(conversationEvent.createdAt)],
    });

    return events;
  }),

  export: protectedProcedure
    .use(requirePermission({ ticket: ["export"] }))
    .input(exportFormSchema)
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active organization selected",
        });
      }

      const MAX_EXPORT_ROWS = 10_000;

      const { whereConditions } = buildTicketWhereConditions({
        db: ctx.db,
        organizationId,
        filter: input.filter,
        searchQuery: input.q,
      });

      // Apply export-specific date range on top of existing filters
      if (input.dateRange?.from) {
        whereConditions.push(gte(conversation.createdAt, input.dateRange.from));
      }
      if (input.dateRange?.to) {
        const { endOfDay } = await import("date-fns");
        whereConditions.push(lte(conversation.createdAt, endOfDay(input.dateRange.to)));
      }

      const items = await ctx.db.query.conversation.findMany({
        where: and(...whereConditions),
        limit: MAX_EXPORT_ROWS,
        orderBy: [desc(conversation.createdAt)],
        with: {
          contact: {
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              displayName: true,
              phone: true,
            },
          },
          assignedTo: {
            columns: {
              id: true,
              name: true,
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

      const ticketFieldSet = new Set(input.ticketFields);
      const contactFieldSet = new Set(input.contactFields);

      const rows = items.map((item) => {
        const row: Record<string, string> = {};

        if (ticketFieldSet.has("id")) row["Ticket ID"] = item.id;
        if (ticketFieldSet.has("subject")) row.Subject = item.subject ?? "";
        if (ticketFieldSet.has("status")) row.Status = item.status;
        if (ticketFieldSet.has("priority")) row.Priority = item.priority;
        if (ticketFieldSet.has("channel")) row.Channel = item.channel;
        if (ticketFieldSet.has("assignedTo")) row["Assigned Agent"] = item.assignedTo?.name ?? "";
        if (ticketFieldSet.has("company")) row.Company = item.company?.name ?? "";
        if (ticketFieldSet.has("tags"))
          row.Tags = item.conversationTags.map((ct) => ct.tag.name).join(", ");
        if (ticketFieldSet.has("createdAt"))
          row["Created At"] = item.createdAt?.toISOString() ?? "";
        if (ticketFieldSet.has("updatedAt"))
          row["Updated At"] = item.updatedAt?.toISOString() ?? "";
        if (ticketFieldSet.has("lastMessageAt"))
          row["Last Message At"] = item.lastMessageAt?.toISOString() ?? "";
        if (ticketFieldSet.has("closedAt")) row["Closed At"] = item.closedAt?.toISOString() ?? "";

        if (contactFieldSet.has("contactName")) {
          const c = item.contact;
          row["Contact Name"] =
            c?.displayName ?? [c?.firstName, c?.lastName].filter(Boolean).join(" ") ?? "";
        }
        if (contactFieldSet.has("contactEmail")) row["Contact Email"] = item.contact?.email ?? "";
        if (contactFieldSet.has("contactPhone")) row["Contact Phone"] = item.contact?.phone ?? "";

        return row;
      });

      return { rows, total: items.length };
    }),
});
