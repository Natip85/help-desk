"use client";

import { useState } from "react";
import Link from "next/link";
import { GlobeIcon, MailIcon, WebhookIcon } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";
import type {
  ConversationChannel,
  ConversationPriority,
  ConversationStatus,
} from "@help-desk/db/schema/conversations";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createContextHook } from "@/hooks/create-context-hook";
import { cn } from "@/lib/utils";

const channelIconMap: Record<ConversationChannel, React.FC<React.SVGProps<SVGSVGElement>>> = {
  email: MailIcon,
  web: GlobeIcon,
  api: WebhookIcon,
};

export const priorityConfig: Record<ConversationPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "text-blue-500" },
  high: { label: "High", className: "text-amber-500" },
  urgent: { label: "Urgent", className: "text-red-500" },
};

export const statusConfig: Record<ConversationStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-sky-700/50",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-700/50",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-700/50",
  },
  closed: {
    label: "Closed",
    className: "bg-zinc-700/50",
  },
};

export type TicketCardContextType = {
  data?: TicketCardData;
};

export type TicketCardData = RouterOutputs["ticket"]["all"]["items"][number];

export type TicketCardProps = React.ComponentProps<typeof Card> &
  Pick<TicketCardContextType, "data"> & {
    href?: string;
    onCardClick?: () => void;
    isActive?: boolean;
  };

const [TicketCardProvider, useTicketCard] = createContextHook<TicketCardContextType>(() => {
  const [data, setData] = useState<TicketCardData | undefined>(undefined);
  return { data, setData };
});

export { useTicketCard };

export const TicketCard = ({
  children,
  data,
  className,
  isActive,
  href,
  onCardClick,
  ...props
}: TicketCardProps) => {
  return (
    <TicketCardProvider value={{ data }}>
      <Card
        {...props}
        className={cn(
          "group border-primary hover:ring-primary hover:bg-accent/5 flex flex-row justify-between border-l-4 p-0 px-6 py-3 shadow-sm transition-all duration-300 group-active:z-10 hover:ring-2 has-data-[slot=card-footer]:pb-3",
          isActive && "ring-primary bg-accent/5 ring-2",
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          (href || onCardClick) && "",
          className
        )}
        onClick={onCardClick}
      >
        {children}
      </Card>
    </TicketCardProvider>
  );
};

export const TicketCardHeader = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) => {
  const { data } = useTicketCard();
  const channel = data?.channel ?? "email";
  const ChannelIcon = channelIconMap[channel];
  const contact = data?.contact;

  if (!contact) return null;

  const displayName = getContactDisplayName(contact);
  const initials = getContactInitials(contact);
  return (
    <CardHeader
      {...props}
      className={cn("flex flex-1 flex-row items-center gap-4 p-0", className)}
    >
      <Avatar className="size-12">
        {contact.avatarUrl && (
          <AvatarImage
            src={contact.avatarUrl}
            alt={displayName ?? contact.email}
          />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1 text-sm leading-tight">
          <span className="text-base">
            <Link
              href={`/tickets/${data?.id}`}
              className="hover:text-sky-700 hover:underline"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {data?.subject}
            </Link>
          </span>
        </div>
        {children}
        <div className="flex flex-row items-center gap-2">
          <ChannelIcon className="text-muted-foreground size-4" />
          <span className="font-medium">{displayName ?? "\u00A0"}</span> »{" "}
          <span className="text-xs">Created: {formatDate(data?.createdAt)}</span>
        </div>
      </div>
    </CardHeader>
  );
};

export const TicketCardTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) => {
  return (
    <CardTitle
      className={cn("", className)}
      {...props}
    />
  );
};

export function getContactInitials(contact: TicketCardData["contact"]) {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName?.charAt(0) ?? ""}${contact.lastName?.charAt(0) ?? ""}`.toUpperCase();
  }
  if (contact.displayName) {
    return contact.displayName.charAt(0).toUpperCase();
  }
  return contact.email.charAt(0).toUpperCase();
}

export function getContactDisplayName(contact: TicketCardData["contact"]) {
  if (contact.displayName) return contact.displayName;
  if (contact.firstName || contact.lastName) {
    return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  }
  return null;
}

export const TicketCardContact = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { data } = useTicketCard();
  const contact = data?.contact;

  if (!contact) return null;

  const displayName = getContactDisplayName(contact);
  const initials = getContactInitials(contact);

  return (
    <div
      {...props}
      className={cn("flex items-center gap-4", className)}
    >
      <Avatar className="size-12">
        {contact.avatarUrl && (
          <AvatarImage
            src={contact.avatarUrl}
            alt={displayName ?? contact.email}
          />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 text-sm leading-tight">
        <span className="font-medium">{displayName ?? "\u00A0"}</span>
        <span className="mb-2 text-xs">{contact.email}</span>
        <span className="text-base">
          <Link
            href={`#`}
            className="hover:text-primary hover:underline"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {data?.subject}
          </Link>
        </span>
      </div>
    </div>
  );
};

export const TicketCardContent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) => {
  return (
    <CardContent
      {...props}
      className={cn("flex-1", className)}
    >
      {children}
    </CardContent>
  );
};

export const TicketCardFooter = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardFooter>) => {
  const { data } = useTicketCard();
  const status = data?.status ? statusConfig[data.status] : null;

  return (
    <CardFooter
      {...props}
      className={cn("flex-col", className)}
    >
      {status && (
        <Badge
          variant="outline"
          className={cn("", status.className)}
        >
          {status.label}
        </Badge>
      )}
      {children}
    </CardFooter>
  );
};

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
