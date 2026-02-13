"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateTagDialog } from "./create-tag-dialog";

export function CreateTagButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add Tag
      </Button>
      <CreateTagDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
