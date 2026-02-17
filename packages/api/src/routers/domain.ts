import { TRPCError } from "@trpc/server";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";

import { domain } from "@help-desk/db/schema/domains";
import { mailbox } from "@help-desk/db/schema/mailboxes";

import { resend } from "../lib/resend";
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

export const domainRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.domain.findMany({
      where: eq(domain.organizationId, organizationId),
      orderBy: [desc(domain.createdAt)],
    });

    return { items };
  }),

  create: protectedProcedure
    .input(
      z.object({
        domain: z
          .string()
          .min(1, "Domain is required")
          .regex(
            /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
            "Invalid domain format"
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);
      const domainName = input.domain.toLowerCase();

      // Check if domain already exists for this org
      const existing = await ctx.db.query.domain.findFirst({
        where: and(eq(domain.organizationId, organizationId), eq(domain.domain, domainName)),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already registered for your organization.",
        });
      }

      // Register domain with Resend
      const { data: resendData, error: resendError } = await resend.domains.create({
        name: domainName,
      });

      if (resendError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to register domain with Resend: ${resendError.message}`,
        });
      }

      const [created] = await ctx.db
        .insert(domain)
        .values({
          organizationId,
          domain: domainName,
          resendDomainId: resendData.id,
          status: resendData.status ?? "pending",
          region: resendData.region ?? null,
          dnsRecords: resendData.records ?? null,
        })
        .returning();

      return created;
    }),

  verify: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.domain.findFirst({
        where: and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
      }

      if (!existing.resendDomainId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain has no Resend ID. Please re-register it.",
        });
      }

      // Trigger verification in Resend
      const { error: verifyError } = await resend.domains.verify(existing.resendDomainId);

      if (verifyError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to verify domain: ${verifyError.message}`,
        });
      }

      // Poll for updated status -- Resend verification is async so we
      // retry a few times with a short delay before giving up.
      const maxAttempts = 5;
      const delayMs = 2000;
      let domainData: Awaited<ReturnType<typeof resend.domains.get>>["data"] = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        const { data, error: getError } = await resend.domains.get(existing.resendDomainId);

        if (getError || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch domain status: ${getError?.message ?? "Unknown error"}`,
          });
        }

        domainData = data;

        if (data.status === "verified") {
          break;
        }
      }

      if (!domainData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch domain status after verification.",
        });
      }

      const [updated] = await ctx.db
        .update(domain)
        .set({
          status: domainData.status ?? existing.status,
          dnsRecords: domainData.records ?? existing.dnsRecords,
        })
        .where(and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)))
        .returning();

      return updated;
    }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const existing = await ctx.db.query.domain.findFirst({
      where: and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)),
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
    }

    // Refresh status from Resend if we have a Resend domain ID
    if (existing.resendDomainId) {
      const { data: domainData } = await resend.domains.get(existing.resendDomainId);

      if (domainData) {
        const [updated] = await ctx.db
          .update(domain)
          .set({
            status: domainData.status ?? existing.status,
            dnsRecords: domainData.records ?? existing.dnsRecords,
          })
          .where(and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)))
          .returning();

        return updated;
      }
    }

    return existing;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.domain.findFirst({
        where: and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
      }

      // Check if there are mailboxes using this domain
      const mailboxesOnDomain = await ctx.db.query.mailbox.findMany({
        where: and(
          eq(mailbox.organizationId, organizationId),
          like(mailbox.email, `%@${existing.domain}`)
        ),
      });

      if (mailboxesOnDomain.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete domain. ${mailboxesOnDomain.length} mailbox(es) are still using it. Delete them first.`,
        });
      }

      // Remove from Resend
      if (existing.resendDomainId) {
        const { error: removeError } = await resend.domains.remove(existing.resendDomainId);

        if (removeError) {
          // eslint-disable-next-line no-console
          console.error("Failed to remove domain from Resend:", removeError);
          // Continue with local deletion even if Resend fails
        }
      }

      await ctx.db
        .delete(domain)
        .where(and(eq(domain.id, input.id), eq(domain.organizationId, organizationId)));

      return { success: true };
    }),
});
