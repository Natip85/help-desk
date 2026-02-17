"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Pusher from "pusher-js";
import { toast } from "sonner";

import type { Notification } from "@help-desk/db/schema/notifications";
import { env } from "@help-desk/env/web";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc";

let pusherInstance: Pusher | null = null;

export function getPusherClient() {
  pusherInstance ??= new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    authEndpoint: "/api/pusher/auth",
  });
  return pusherInstance;
}

export function usePusherNotifications() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const subscribedRef = useRef(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || subscribedRef.current) return;

    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);
    subscribedRef.current = true;

    channel.bind("notification:new", (data: Notification) => {
      // Invalidate notification queries so the UI updates
      void queryClient.invalidateQueries({
        queryKey: trpc.notification.getUnreadCount.queryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: trpc.notification.getAll.queryKey(),
      });

      // Show a toast
      toast.info(data.title, {
        description: data.body ?? undefined,
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      subscribedRef.current = false;
    };
  }, [session?.user?.id, queryClient, trpc]);
}
