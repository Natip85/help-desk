"use client";

import { useState } from "react";
import { Command, Option } from "lucide-react";

import { AnimatedHelpCircle } from "@/components/icons/animated-help-circle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useKeypress } from "@/hooks/use-keypress";

const WithMeta = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <kbd className="bg-accent/50 flex items-center gap-1 rounded px-2 py-1 font-mono text-sm">
            <Command className="size-3" /> / <Option className="size-3" />
          </kbd>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-foreground bg-accent/40 text-sm"
        >
          <p>Command or Control</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const HelpDialog = (props: React.ComponentProps<"button">) => {
  const [open, setOpen] = useState(false);

  useKeypress(() => setOpen(!open), "?");

  return (
    <>
      <button
        {...props}
        onClick={() => setOpen(!open)}
      >
        <AnimatedHelpCircle /> <span>Help</span>
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Help</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Keyboard Shortcuts</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Toggle left sidebar</span>
                  <div className="flex items-center gap-1">
                    <kbd className="bg-accent/50 rounded px-2 py-1 font-mono text-sm">b</kbd>
                    <span>+</span>
                    <WithMeta />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Help menu (this one)</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <kbd className="bg-accent/50 rounded px-2 py-1 font-mono text-sm">?</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
