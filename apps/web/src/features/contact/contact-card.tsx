"use client";

import { useState } from "react";
import { BuildingIcon, MailIcon, PhoneIcon } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { createContextHook } from "@/hooks/create-context-hook";
import { cn } from "@/lib/utils";
import { formatDate, getContactDisplayName, getContactInitials } from "../tickets/ticket-card";

export type ContactCardData = RouterOutputs["contact"]["all"]["items"][number];

export type ContactCardContextType = {
  data?: ContactCardData;
};

export type ContactCardProps = React.ComponentProps<typeof Card> &
  Pick<ContactCardContextType, "data"> & {
    onCardClick?: () => void;
    isActive?: boolean;
  };

const [ContactCardProvider, useContactCard] = createContextHook<ContactCardContextType>(() => {
  const [data, setData] = useState<ContactCardData | undefined>(undefined);
  return { data, setData };
});

export { useContactCard };

export const ContactCard = ({
  children,
  data,
  className,
  isActive,
  onCardClick,
  ...props
}: ContactCardProps) => {
  return (
    <ContactCardProvider value={{ data }}>
      <Card
        {...props}
        className={cn(
          "group border-primary hover:ring-primary hover:bg-accent/5 flex min-h-28 flex-row items-center justify-between border-l-4 p-0 px-6 py-3 shadow-sm transition-all duration-300 group-active:z-10 hover:ring-2 has-data-[slot=card-footer]:pb-3",
          isActive && "ring-primary bg-accent/5 ring-1",
          onCardClick && "cursor-pointer",
          className
        )}
        onClick={onCardClick}
      >
        {children}
      </Card>
    </ContactCardProvider>
  );
};

export const ContactCardHeader = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) => {
  const { data } = useContactCard();

  if (!data) return null;

  const displayName = getContactDisplayName(data);
  const initials = getContactInitials(data);

  return (
    <CardHeader
      {...props}
      className={cn("flex flex-1 flex-row items-start gap-3 p-0", className)}
    >
      <Avatar className="mt-0.5 size-10 shrink-0">
        {data.avatarUrl && (
          <AvatarImage
            src={data.avatarUrl}
            alt={displayName ?? data.email}
          />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{displayName ?? data.email}</span>
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <MailIcon className="size-3.5" />
          <span>{data.email}</span>
          {data.phone && (
            <>
              <span>·</span>
              <PhoneIcon className="size-3.5" />
              <span>{data.phone}</span>
            </>
          )}
          {data.company && (
            <>
              <span>·</span>
              <BuildingIcon className="size-3.5" />
              <span>{data.company.name}</span>
            </>
          )}
          <span>·</span>
          <span>{formatDate(data.createdAt)}</span>
        </div>
        {children}
      </div>
    </CardHeader>
  );
};

export const ContactCardCompany = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { data } = useContactCard();

  if (!data?.company) return null;

  return (
    <div
      {...props}
      className={cn("flex items-center gap-1.5", className)}
    >
      <Badge
        variant="outline"
        className="px-2 py-0 text-xs font-normal"
      >
        <BuildingIcon className="mr-1 size-3" />
        {data.company.name}
      </Badge>
    </div>
  );
};

export const ContactCardFooter = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardFooter>) => {
  return (
    <CardFooter
      {...props}
      className={cn("flex flex-col items-end justify-between p-0", className)}
    >
      {children}
    </CardFooter>
  );
};
