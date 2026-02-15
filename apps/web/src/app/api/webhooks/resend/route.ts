/* eslint-disable no-console */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { EmailReceivedEvent } from "@/lib/email/process-inbound-email";
import { processInboundEmail } from "@/lib/email/process-inbound-email";

function isEmailReceivedEvent(event: unknown): event is EmailReceivedEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "type" in event &&
    (event as { type: string }).type === "email.received" &&
    "data" in event
  );
}

export const POST = async (request: NextRequest) => {
  const event: unknown = await request.json();

  console.log("Webhook event received:", JSON.stringify(event, null, 2));

  if (!isEmailReceivedEvent(event)) {
    // Acknowledge non-inbound events (email.sent, email.delivered, etc.)
    // to prevent Resend from retrying them.
    const eventType =
      typeof event === "object" && event !== null && "type" in event ?
        (event as { type: string }).type
      : "unknown";
    console.log(`Ignoring webhook event type: ${eventType}`);
    return NextResponse.json({ received: true });
  }

  try {
    await processInboundEmail(event);
    console.log("Inbound email processed successfully");
  } catch (error) {
    console.error("Failed to process inbound email:", error);
    // Still return 200 to acknowledge receipt and avoid Resend retries
  }

  return NextResponse.json({ received: true });
};
