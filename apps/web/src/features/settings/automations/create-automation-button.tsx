"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AutomationFormDialog } from "./automation-form-dialog";

export function CreateAutomationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add Automation
      </Button>
      <AutomationFormDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
