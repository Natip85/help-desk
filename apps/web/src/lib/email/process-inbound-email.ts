import { and, eq, inArray } from "drizzle-orm";

import { runAutomationsForTicket } from "@help-desk/api/lib/automation-engine";
import * as slaEngine from "@help-desk/api/lib/sla-engine";
import { db } from "@help-desk/db";
import {
  attachment,
  company,
  contact,
  conversation,
  conversationEvent,
  domain,
  mailbox,
  message,
  organization,
} from "@help-desk/db/schema/index";

import { resend } from "../resend";

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailAttachment = {
  id: string;
  filename: string;
  content_type: string;
  content_disposition: string;
  content_id?: string;
};

type EmailReceivedData = {
  email_id: string;
  created_at: string;
  from: string;
  to: string[];
  bcc: string[];
  cc: string[];
  message_id: string;
  subject: string;
  attachments: EmailAttachment[];
};

export type EmailReceivedEvent = {
  type: "email.received";
  created_at: string;
  data: EmailReceivedData;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "outlook.co.uk",
  "live.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
]);

const EMAIL_ADDRESS_REGEX = /^(.+?)\s*<(.+?)>$/;

/**
 * Parses an email address from RFC 5322 format.
 * "John Doe <john@acme.com>" -> { email: "john@acme.com", name: "John Doe" }
 * "john@acme.com" -> { email: "john@acme.com", name: null }
 */
function parseEmailAddress(raw: string): { email: string; name: string | null } {
  const match = EMAIL_ADDRESS_REGEX.exec(raw);
  if (match?.[1] && match[2]) {
    return {
      name: match[1].replace(/^["']|["']$/g, "").trim(),
      email: match[2].toLowerCase().trim(),
    };
  }
  return { email: raw.toLowerCase().trim(), name: null };
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Safely access a header value from the headers object (case-insensitive).
 */
function getHeader(
  headers: Record<string, string> | null | undefined,
  name: string
): string | null {
  if (!headers) return null;
  // Try exact match first, then case-insensitive
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[capitalizeHeader(name)];
  return value ?? null;
}

function capitalizeHeader(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

// ─── Main Processing Function ────────────────────────────────────────────────

export async function processInboundEmail(event: EmailReceivedEvent) {
  const { email_id, from, to, cc, bcc, message_id, subject, attachments } = event.data;

  // 1. Fetch full email content from Resend API (webhook only has metadata)
  const { data: emailContent, error: fetchError } = await resend.emails.receiving.get(email_id);

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch email content from Resend:", fetchError);
    throw new Error(`Failed to fetch email content: ${fetchError.message}`);
  }

  const headers = emailContent?.headers as Record<string, string> | null | undefined;

  // 2. Parse the sender
  const { email: senderEmail, name: senderName } = parseEmailAddress(from);

  // 3. Resolve organization via mailbox match, then domain match
  let matchedMailbox: typeof mailbox.$inferSelect | undefined;
  for (const toAddress of to) {
    const found = await db.query.mailbox.findFirst({
      where: eq(mailbox.email, toAddress.toLowerCase()),
    });
    if (found) {
      matchedMailbox = found;
      break;
    }
  }

  let org: typeof organization.$inferSelect | undefined;

  if (matchedMailbox) {
    // Use the organization that owns the matched mailbox
    org = await db.query.organization.findFirst({
      where: eq(organization.id, matchedMailbox.organizationId),
    });
  }

  // Fallback: try domain-based routing if no mailbox matched
  if (!org) {
    for (const toAddress of to) {
      const emailDomain = toAddress.toLowerCase().split("@")[1];
      if (!emailDomain) continue;

      const verifiedDomain = await db.query.domain.findFirst({
        where: and(eq(domain.domain, emailDomain), eq(domain.status, "verified")),
      });

      if (verifiedDomain) {
        org = await db.query.organization.findFirst({
          where: eq(organization.id, verifiedDomain.organizationId),
        });

        // Assign the org's default mailbox so the conversation has a mailboxId
        if (org) {
          matchedMailbox = await db.query.mailbox.findFirst({
            where: and(eq(mailbox.organizationId, org.id), eq(mailbox.isDefault, true)),
          });
        }
        break;
      }
    }
  }

  if (!org) {
    // No mailbox match and no verified domain match -- drop the email
    // eslint-disable-next-line no-console
    console.log(
      `No organization found for recipients: ${to.join(", ")}. Dropping email ${email_id}.`
    );
    return;
  }

  // 4-9. Run all DB operations in a transaction
  const txResult = await db.transaction(async (tx) => {
    let isNewConversation = false;
    // ── 4. Find or create contact ──────────────────────────────────────────

    let existingContact = await tx.query.contact.findFirst({
      where: and(eq(contact.organizationId, org.id), eq(contact.email, senderEmail)),
    });

    // Restore soft-deleted contact when they send a new email
    if (existingContact?.deletedAt) {
      await tx.update(contact).set({ deletedAt: null }).where(eq(contact.id, existingContact.id));
      existingContact = { ...existingContact, deletedAt: null };
    }

    if (!existingContact) {
      // Try to auto-match company by email domain
      const domain = senderEmail.split("@")[1] ?? "";
      let companyId: string | null = null;

      if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
        let existingCompany = await tx.query.company.findFirst({
          where: and(eq(company.organizationId, org.id), eq(company.domain, domain)),
        });

        if (!existingCompany) {
          const domainName = domain.split(".")[0] ?? domain;
          const [newCompany] = await tx
            .insert(company)
            .values({
              organizationId: org.id,
              name: capitalize(domainName),
              domain,
            })
            .returning();

          if (newCompany) {
            existingCompany = newCompany;
          }
        }

        if (existingCompany) {
          companyId = existingCompany.id;
        }
      }

      // Parse name into first/last
      let firstName: string | null = null;
      let lastName: string | null = null;
      if (senderName) {
        // Display name present: "John Doe" -> first: "John", last: "Doe"
        const parts = senderName.split(" ");
        firstName = parts[0] ?? null;
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
      } else {
        // No display name: derive from email local part
        // "nati.peretz1985@gmail.com" -> first: "Nati", last: "Peretz1985"
        const localPart = senderEmail.split("@")[0] ?? "";
        const nameParts = localPart.split(/[._-]/).filter(Boolean);
        if (nameParts.length > 0) {
          firstName = capitalize(nameParts[0] ?? "");
          lastName = nameParts.length > 1 ? capitalize(nameParts.slice(1).join(" ")) : null;
        }
      }

      const [newContact] = await tx
        .insert(contact)
        .values({
          organizationId: org.id,
          email: senderEmail,
          firstName,
          lastName,
          displayName: senderName ?? ([firstName, lastName].filter(Boolean).join(" ") || null),
          companyId,
        })
        .returning();

      if (!newContact) {
        throw new Error("Failed to create contact");
      }

      existingContact = newContact;
    }

    // ── 5. Find or create conversation (threading) ─────────────────────────

    let existingConversation: typeof conversation.$inferSelect | undefined;

    // 5-pre. Check for plus-addressed Reply-To threading (e.g. support+conv_{id}@domain.com)
    //        This is the most reliable threading mechanism for replies to forwards.
    const allRecipients = [...to, ...cc, ...bcc];
    for (const addr of allRecipients) {
      const plusMatch = /\+conv_([a-f0-9-]+)@/i.exec(addr);
      if (plusMatch?.[1]) {
        existingConversation = await tx.query.conversation.findFirst({
          where: eq(conversation.id, plusMatch[1]),
        });
        if (existingConversation) break;
      }
    }

    // 5a. Try matching via In-Reply-To header
    const inReplyToHeader = getHeader(headers, "in-reply-to");

    if (!existingConversation && inReplyToHeader) {
      const referencedMessage = await tx.query.message.findFirst({
        where: eq(message.emailMessageId, inReplyToHeader),
      });

      if (referencedMessage) {
        existingConversation = await tx.query.conversation.findFirst({
          where: eq(conversation.id, referencedMessage.conversationId),
        });
      }
    }

    // 5a2. Fallback: try matching via References header (handles longer threads)
    if (!existingConversation) {
      const referencesHeader = getHeader(headers, "references");
      if (referencesHeader) {
        const refIds = referencesHeader.split(/\s+/).filter(Boolean);
        if (refIds.length > 0) {
          const referencedMessage = await tx.query.message.findFirst({
            where: inArray(message.emailMessageId, refIds),
          });

          if (referencedMessage) {
            existingConversation = await tx.query.conversation.findFirst({
              where: eq(conversation.id, referencedMessage.conversationId),
            });
          }
        }
      }
    }

    // 5a3. Fallback: match outbound messages by Resend email ID extracted from
    //       In-Reply-To / References headers. Resend assigns its own Message-ID
    //       to sent emails (format: <resend-email-id@resend.dev>) so we extract
    //       the local part and match it against the stored resendEmailId.
    if (!existingConversation) {
      const allMessageIds: string[] = [];
      if (inReplyToHeader) allMessageIds.push(inReplyToHeader);
      const referencesHeader = getHeader(headers, "references");
      if (referencesHeader) {
        allMessageIds.push(...referencesHeader.split(/\s+/).filter(Boolean));
      }

      // Extract local parts from Message-ID values, e.g. "<abc-123@resend.dev>" → "abc-123"
      const localParts = allMessageIds
        .map((id) => /^<([^@>]+)@/.exec(id)?.[1])
        .filter((id): id is string => Boolean(id));

      if (localParts.length > 0) {
        const referencedMessage = await tx.query.message.findFirst({
          where: inArray(message.resendEmailId, localParts),
        });

        if (referencedMessage) {
          existingConversation = await tx.query.conversation.findFirst({
            where: eq(conversation.id, referencedMessage.conversationId),
          });
        }
      }
    }

    // Note: Subject-based fallback matching was removed because it caused
    // unrelated emails with common subjects (e.g. "Hi", "Help") to be
    // incorrectly merged into existing conversations. Genuine replies are
    // threaded reliably via In-Reply-To, References, Resend email ID, and
    // plus-addressed Reply-To headers (steps 5-pre through 5a3 above).

    // 5b. Create new conversation if no match found
    if (!existingConversation) {
      const [newConversation] = await tx
        .insert(conversation)
        .values({
          organizationId: org.id,
          subject: subject || "(no subject)",
          contactId: existingContact.id,
          companyId: existingContact.companyId,
          mailboxId: matchedMailbox?.id ?? null,
          channel: "email",
          status: "open",
          priority: "normal",
          lastMessageAt: new Date(),
        })
        .returning();

      if (!newConversation) {
        throw new Error("Failed to create conversation");
      }

      existingConversation = newConversation;
      isNewConversation = true;

      // Log conversation_created event
      await tx.insert(conversationEvent).values({
        organizationId: org.id,
        conversationId: existingConversation.id,
        type: "conversation_created",
      });
    }

    // ── 6. Create message ──────────────────────────────────────────────────

    const referencesHeader = getHeader(headers, "references");

    const [newMessage] = await tx
      .insert(message)
      .values({
        conversationId: existingConversation.id,
        contactId: existingContact.id,
        direction: "inbound",
        resendEmailId: email_id,
        fromEmail: from,
        toEmail: to,
        cc: cc.length > 0 ? cc : null,
        bcc: bcc.length > 0 ? bcc : null,
        subject,
        textBody: emailContent?.text ?? null,
        htmlBody: emailContent?.html ?? null,
        emailMessageId: message_id,
        inReplyTo: inReplyToHeader,
        references: referencesHeader,
        rawHeaders: headers ?? null,
      })
      .returning();

    if (!newMessage) {
      throw new Error("Failed to create message");
    }

    // ── 7. Update conversation ─────────────────────────────────────────────
    //    Clear deletedAt so soft-deleted conversations resurface when a
    //    genuine reply arrives (e.g. via In-Reply-To / References headers).

    const updates: Partial<typeof conversation.$inferInsert> = {
      lastMessageAt: new Date(),
      status: "open",
      deletedAt: null,
    };

    await tx.update(conversation).set(updates).where(eq(conversation.id, existingConversation.id));

    // ── 8. Create attachment records ───────────────────────────────────────

    if (attachments.length > 0) {
      await tx.insert(attachment).values(
        attachments.map((att) => ({
          messageId: newMessage.id,
          resendAttachmentId: att.id,
          filename: att.filename,
          mimeType: att.content_type,
        }))
      );
    }

    // ── 9. Log email_received event ────────────────────────────────────────

    await tx.insert(conversationEvent).values({
      organizationId: org.id,
      conversationId: existingConversation.id,
      type: "email_received",
      payload: {
        messageId: newMessage.id,
        from: senderEmail,
        subject,
      },
    });

    // eslint-disable-next-line no-console
    console.log(
      `Processed inbound email: contact=${existingContact.id}, conversation=${existingConversation.id}, message=${newMessage.id}`
    );

    return { conversationId: existingConversation.id, isNewConversation };
  });

  // ── 10. Run automations for newly created tickets ─────────────────────────

  if (txResult.isNewConversation) {
    // Compute SLA deadline for the new inbound ticket
    try {
      const deadline = await slaEngine.computeDeadline(db, org.id, "normal", new Date());
      if (deadline) {
        await db
          .update(conversation)
          .set({ slaFirstResponseDueAt: deadline })
          .where(eq(conversation.id, txResult.conversationId));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[SLA] Failed to compute deadline for inbound email:", error);
    }

    try {
      await runAutomationsForTicket(db, org.id, txResult.conversationId, {
        mailboxEmail: matchedMailbox?.email ?? null,
        senderEmail,
        subject: subject || "(no subject)",
        channel: "email",
        priority: "normal",
        status: "open",
        tags: [],
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Automations] Failed to run automations for new ticket:", error);
    }
  }
}
