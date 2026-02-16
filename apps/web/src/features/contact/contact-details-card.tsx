"use client";

import type { ContactCardData, ContactCardProps } from "./contact-card";
import { useSidebarParams } from "../right-sidebars/query-params";
import { getContactDisplayName } from "../tickets/ticket-card";
import {
  ContactCard,
  ContactCardCompany,
  ContactCardFooter,
  ContactCardHeader,
} from "./contact-card";

type ContactDetailsCardProps = Omit<ContactCardProps, "data"> & {
  item: ContactCardData;
};

export const ContactDetailsCard = ({ item, ...props }: ContactDetailsCardProps) => {
  const { toggleContactSidebarId, sidebarParams } = useSidebarParams();
  const displayName = getContactDisplayName(item);

  return (
    <ContactCard
      data={item}
      key={item.id}
      {...props}
      onCardClick={() => {
        toggleContactSidebarId(item.id);
      }}
      isActive={sidebarParams.contactId === item.id}
    >
      <ContactCardHeader>
        <ContactCardCompany />
      </ContactCardHeader>
      <ContactCardFooter>
        {displayName && <span className="text-muted-foreground text-xs">{item.email}</span>}
      </ContactCardFooter>
    </ContactCard>
  );
};
