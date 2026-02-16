"use client";

import { createSerializer, parseAsString, useQueryStates } from "nuqs";

export const prefillTicketParser = {
  contactId: parseAsString,
  contactEmail: parseAsString,
};

export const serializePrefillTicket = createSerializer(prefillTicketParser);

export const usePrefillTicketParams = () => {
  const [prefillTicket, setPrefillTicket] = useQueryStates(prefillTicketParser);

  const clearPrefillTicket = () => {
    void setPrefillTicket({ contactId: null, contactEmail: null });
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
      href: `/tickets/new${serializePrefillTicket(params)}`,
    };
  };

  return {
    prefillTicket,
    setPrefillTicket,
    clearPrefillTicket,
    createTicketForContactLink,
  };
};
