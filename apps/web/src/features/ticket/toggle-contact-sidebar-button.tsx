"use client";

import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebarParams } from "../right-sidebars/query-params";

export const ToggleContactSidebarButton = ({ contactId }: { contactId: string | undefined }) => {
  const { toggleContactSidebarId } = useSidebarParams();
  return (
    <Button
      variant="outline"
      disabled={!contactId}
      onClick={() => contactId && toggleContactSidebarId(contactId)}
    >
      <User />
      View contact
    </Button>
  );
};
