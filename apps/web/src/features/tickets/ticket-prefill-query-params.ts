"use client";

import { createSerializer, parseAsString, useQueryStates } from "nuqs";

export const prefillTicketParser = {
  prefillContactId: parseAsString,
  prefillContactEmail: parseAsString,
};

export const serializePrefillTicket = createSerializer(prefillTicketParser);

export const usePrefillTicketParams = () => {
  const [prefillTicket, setPrefillTicket] = useQueryStates(prefillTicketParser);

  const clearPrefillTicket = () => {
    void setPrefillTicket({ prefillContactId: null, prefillContactEmail: null });
  };

  const createTicketForContactLink = (params: { contactId?: string; contactEmail?: string }) => {
    if (!params.contactId || !params.contactEmail) {
      return {
        label: "New Ticket",
        disabled: true,
        href: "/tickets/new",
      };
    }

    return {
      label: "New Ticket",
      disabled: false,
      href: `/tickets/new${serializePrefillTicket({ prefillContactId: params.contactId, prefillContactEmail: params.contactEmail })}`,
    };
  };

  return {
    prefillTicket,
    setPrefillTicket,
    clearPrefillTicket,
    createTicketForContactLink,
  };
};
