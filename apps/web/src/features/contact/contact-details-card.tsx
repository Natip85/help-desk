import Link from "next/link";

import type { ContactCardData, ContactCardProps } from "./contact-card";
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
  const displayName = getContactDisplayName(item);

  return (
    <Link
      href={`/contacts/${item.id}`}
      className="block"
    >
      <ContactCard
        data={item}
        key={item.id}
        {...props}
      >
        <ContactCardHeader>
          <ContactCardCompany />
        </ContactCardHeader>
        <ContactCardFooter>
          {displayName && <span className="text-muted-foreground text-xs">{item.email}</span>}
        </ContactCardFooter>
      </ContactCard>
    </Link>
  );
};
