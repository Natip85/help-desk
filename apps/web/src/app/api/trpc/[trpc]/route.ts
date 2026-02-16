import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@help-desk/api";
import { auth } from "@help-desk/auth";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      return createTRPCContext({ session, headers: req.headers });
    },
  });
}
export { handler as GET, handler as POST };
