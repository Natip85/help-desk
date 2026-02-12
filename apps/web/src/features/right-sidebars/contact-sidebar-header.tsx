"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getContactDisplayName, getContactInitials } from "../tickets/ticket-card";

type ContactGetById = RouterOutputs["contact"]["getById"];

export type ContactSidebarHeaderProps = {
  contact: ContactGetById["contact"];
  company: ContactGetById["company"];
};

export const ContactSidebarHeader = ({ contact, company }: ContactSidebarHeaderProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const displayName = getContactDisplayName(contact) ?? contact.email;
  const initials = getContactInitials(contact);

  return (
    <SidebarHeader className="border-accent/50 relative border-b p-4 pr-6">
      <div className="flex items-start gap-2">
        <Avatar className="size-12 shrink-0">
          {contact.avatarUrl && (
            <AvatarImage
              src={contact.avatarUrl}
              alt={displayName}
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{displayName}</h2>
              <p className="text-muted-foreground truncate text-sm">{contact.email}</p>
              {company?.name && (
                <p className="text-muted-foreground truncate text-xs">
                  {company.name}
                  {company.domain ? ` · ${company.domain}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(contact.email).then(() => {
                  setCopied(true);
                });
              }}
            >
              <Mail className="size-3.5" />
              Copy email
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(contact.email).then(() => {
                      setCopied(true);
                    });
                  }}
                  className="h-auto p-1"
                >
                  {copied ?
                    <Check className="size-5" />
                  : <Copy className="size-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied" : "Copy to clipboard"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </SidebarHeader>
  );
};
