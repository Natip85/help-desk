"use client";

import { createContext, useContext } from "react";

import type { PresenceMember } from "@/hooks/use-ticket-presence";
import { useTicketPresence } from "@/hooks/use-ticket-presence";

type TicketPresenceContextValue = {
  viewers: PresenceMember[];
};

const TicketPresenceContext = createContext<TicketPresenceContextValue>({
  viewers: [],
});

export function useTicketPresenceContext() {
  return useContext(TicketPresenceContext);
}

type TicketPresenceProviderProps = {
  ticketId: string;
  children: React.ReactNode;
};

export function TicketPresenceProvider({ ticketId, children }: TicketPresenceProviderProps) {
  const { viewers } = useTicketPresence(ticketId);

  return (
    <TicketPresenceContext.Provider value={{ viewers }}>{children}</TicketPresenceContext.Provider>
  );
}
