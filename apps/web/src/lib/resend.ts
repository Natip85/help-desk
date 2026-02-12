import { Resend } from "resend";

import { env } from "@help-desk/env/server";

export const resend = new Resend(env.RESEND_API_KEY);
