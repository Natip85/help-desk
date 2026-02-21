import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { processOrgSla } from "@help-desk/api/lib/sla-engine";
import { db } from "@help-desk/db";
import { organization } from "@help-desk/db/schema/auth";
import { env } from "@help-desk/env/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgs = await db.select({ id: organization.id }).from(organization);

    let totalWarnings = 0;
    let totalBreaches = 0;

    for (const org of orgs) {
      const { warningCount, breachedCount } = await processOrgSla(db, org.id);
      totalWarnings += warningCount;
      totalBreaches += breachedCount;
    }

    // eslint-disable-next-line no-console
    console.log(`[cron] SLA check: ${totalWarnings} warning(s), ${totalBreaches} breach(es)`);

    return NextResponse.json({
      success: true,
      warningCount: totalWarnings,
      breachedCount: totalBreaches,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[cron] sla-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
