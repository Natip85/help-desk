import { Resend } from "resend";

import { env } from "@help-desk/env/server";

const resend = new Resend(env.RESEND_API_KEY);

export function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  return resend.emails.send({
    from: env.SENDER_EMAIL,
    to,
    subject,
    html,
    text,
  });
}
