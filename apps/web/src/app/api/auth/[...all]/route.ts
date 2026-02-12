import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@help-desk/auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
