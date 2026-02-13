"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { EmailEditor } from "./email-editor";
import { ForwardEmailEditor } from "./forward-email-editor";

type ActiveEditorProps = {
  ticketId: string;
};

export function ActiveEditor({ ticketId }: ActiveEditorProps) {
  const [activeEditor] = useQueryState(
    "editor",
    parseAsStringLiteral(["reply", "forward"] as const)
  );

  if (activeEditor === "forward") {
    return <ForwardEmailEditor ticketId={ticketId} />;
  }

  return <EmailEditor ticketId={ticketId} />;
}
