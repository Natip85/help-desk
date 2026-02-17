"use client";

import type { PresenceChannel } from "pusher-js";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getPusherClient } from "./use-pusher";

export type PresenceMember = {
  id: string;
  info: {
    name: string;
    image: string | null;
  };
};

export function useTicketPresence(ticketId: string) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const [viewers, setViewers] = useState<PresenceMember[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    const pusher = getPusherClient();
    const channelName = `presence-ticket-${ticketId}`;
    const channel = pusher.subscribe(channelName) as PresenceChannel;

    const syncMembers = () => {
      const members: PresenceMember[] = [];
      channel.members.each((member: { id: string; info: PresenceMember["info"] }) => {
        if (member.id !== currentUserId) {
          members.push({ id: member.id, info: member.info });
        }
      });
      setViewers(members);
    };

    channel.bind("pusher:subscription_succeeded", syncMembers);

    channel.bind("pusher:member_added", (member: { id: string; info: PresenceMember["info"] }) => {
      if (member.id === currentUserId) return;
      setViewers((prev) => [
        ...prev.filter((v) => v.id !== member.id),
        { id: member.id, info: member.info },
      ]);
    });

    channel.bind("pusher:member_removed", (member: { id: string }) => {
      setViewers((prev) => prev.filter((v) => v.id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setViewers([]);
    };
  }, [ticketId, currentUserId]);

  return { viewers };
}
