import { Forward, GitBranchPlus, Notebook, Reply, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export const TicketHeader = () => {
  return (
    <div className="flex gap-3">
      <Button variant="outline">
        <Reply />
        Reply
      </Button>
      <Button variant="outline">
        <Notebook />
        Add note
      </Button>
      <Button variant="outline">
        <Forward />
        Forward
      </Button>
      <Button variant="outline">
        <X />
        Close
      </Button>
      <Button variant="outline">
        <GitBranchPlus />
        Merge
      </Button>
      <Button variant="outline">
        <Trash2 />
        Delete
      </Button>
    </div>
  );
};
