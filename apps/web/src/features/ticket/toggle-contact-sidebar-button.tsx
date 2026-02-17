"use client";

import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarParams } from "../right-sidebars/query-params";

export const ToggleContactSidebarButton = ({ contactId }: { contactId: string | undefined }) => {
  const { toggleContactSidebarId } = useSidebarParams();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          disabled={!contactId}
          onClick={() => contactId && toggleContactSidebarId(contactId)}
        >
          <User />
          <span className="hidden sm:block">View contact</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>View contact</TooltipContent>
    </Tooltip>
  );
};
