"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "./create-organization-dialog";

export function CreateOrganizationButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 size-4" />
        Create Organization
      </Button>

      <CreateOrganizationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
