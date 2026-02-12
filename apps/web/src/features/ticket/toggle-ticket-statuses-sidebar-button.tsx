import { useEffect } from "react";
import { ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebarParams } from "../right-sidebars/query-params";

export const ToggleTicketStatusesSidebarButton = ({ ticketId }: { ticketId: string }) => {
  const { toggleTicketStatusesSidebarId } = useSidebarParams();

  useEffect(() => {
    setTimeout(() => {
      toggleTicketStatusesSidebarId(ticketId, true);
    });
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Button
      variant="outline"
      onClick={() => toggleTicketStatusesSidebarId(ticketId)}
    >
      <ListChecks />
      Ticket statuses
    </Button>
  );
};
