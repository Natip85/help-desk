"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DefaultFilterDialog } from "./default-filter-dialog";

export function CreateDefaultFilterButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add Filter
      </Button>
      <DefaultFilterDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
