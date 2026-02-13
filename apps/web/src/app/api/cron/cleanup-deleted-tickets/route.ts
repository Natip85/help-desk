import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, isNotNull, lt } from "drizzle-orm";

import { db } from "@help-desk/db";
import { conversation } from "@help-desk/db/schema/conversations";
import { env } from "@help-desk/env/server";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);

    const deleted = await db
      .delete(conversation)
      .where(and(isNotNull(conversation.deletedAt), lt(conversation.deletedAt, cutoffDate)))
      .returning({ id: conversation.id });

    // eslint-disable-next-line no-console
    console.log(`[cron] Hard-deleted ${deleted.length} tickets older than 30 days`);

    return NextResponse.json({ success: true, deletedCount: deleted.length });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[cron] cleanup-deleted-tickets error:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
