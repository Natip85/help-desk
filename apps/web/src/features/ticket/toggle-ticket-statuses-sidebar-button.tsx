import { useEffect } from "react";
import { ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarParams } from "../right-sidebars/query-params";

export const ToggleTicketStatusesSidebarButton = ({ ticketId }: { ticketId: string }) => {
  const { toggleTicketStatusesSidebarId } = useSidebarParams();

  useEffect(() => {
    setTimeout(() => {
      toggleTicketStatusesSidebarId(ticketId, true);
    });
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={() => toggleTicketStatusesSidebarId(ticketId)}
        >
          <ListChecks />
          <span className="sr-only">Ticket statuses</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Ticket statuses</TooltipContent>
    </Tooltip>
  );
};
