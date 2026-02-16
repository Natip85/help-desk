"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmailRecipientPicker } from "./email-recipient-picker";

export type CcBccSectionHandle = {
  getCc: () => string[];
  getBcc: () => string[];
  reset: () => void;
};

export const CcBccSection = forwardRef<CcBccSectionHandle>(function CcBccSection(_, ref) {
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    getCc: () => cc,
    getBcc: () => bcc,
    reset: () => {
      setCc([]);
      setBcc([]);
      setShowCcBcc(false);
    },
  }));

  return (
    <>
      {!showCcBcc && (
        <div className="flex items-center justify-end border-b px-3 py-1.5">
          <Button
            variant="ghost"
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            onClick={() => setShowCcBcc(true)}
          >
            Cc / Bcc
          </Button>
        </div>
      )}
      {showCcBcc && (
        <>
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <Label>Cc:</Label>
            <div className="flex-1">
              <EmailRecipientPicker
                value={cc}
                onChange={setCc}
                placeholder="Add Cc recipients..."
              />
            </div>
            <button
              type="button"
              aria-label="Close CC/BCC"
              className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              onClick={() => {
                setCc([]);
                setBcc([]);
                setShowCcBcc(false);
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <Label>Bcc:</Label>
            <div className="flex-1">
              <EmailRecipientPicker
                value={bcc}
                onChange={setBcc}
                placeholder="Add Bcc recipients..."
              />
            </div>
          </div>
        </>
      )}
    </>
  );
});
