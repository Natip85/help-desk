"use client";

import { MessageCircleCodeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarParams } from "../right-sidebars/query-params";

type ToggleCannedResponsesSidebarButtonProps = {
  className?: string;
};

export const ToggleCannedResponsesSidebarButton = ({
  className,
}: ToggleCannedResponsesSidebarButtonProps) => {
  const { toggleCannedResponsesSidebarId, sidebarParams } = useSidebarParams();
  const isActive = !!sidebarParams.cannedResponsesId;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleCannedResponsesSidebarId("open")}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-accent size-8 p-0",
            isActive && "bg-accent text-foreground",
            className
          )}
        >
          <MessageCircleCodeIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Canned responses</TooltipContent>
    </Tooltip>
  );
};
