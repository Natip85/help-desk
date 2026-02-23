"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";

import type { Notification } from "@help-desk/db/schema/notifications";

import { AnimatedBell } from "@/components/icons/animated-bell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

export function NotificationBell() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: unreadData } = useQuery(
    trpc.notification.getUnreadCount.queryOptions(undefined, {
      refetchInterval: 60_000,
    })
  );

  const { data: notificationsData } = useQuery(
    trpc.notification.getAll.queryOptions({ limit: 20, offset: 0 })
  );

  const { mutate: markAsReadMutation } = useMutation(
    trpc.notification.markAsRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.notification.getUnreadCount.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.notification.getAll.queryKey(),
        });
      },
    })
  );

  const { mutate: markAllAsReadMutation, isPending } = useMutation(
    trpc.notification.markAllAsRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.notification.getUnreadCount.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.notification.getAll.queryKey(),
        });
      },
    })
  );

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.items ?? [];

  function handleNotificationClick(item: Notification) {
    if (!item.read) {
      markAsReadMutation({ id: item.id });
    }

    const data = item.data;
    const conversationId = data?.conversationId;
    if (typeof conversationId === "string") {
      router.push(`/tickets/${conversationId}`);
    } else if (Array.isArray(data?.conversationIds)) {
      router.push("/tickets");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
        >
          <AnimatedBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        side="bottom"
        align="start"
      >
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-auto px-2 py-1 text-xs"
                onClick={() => markAllAsReadMutation()}
                disabled={isPending}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ?
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-sm">
              <Bell className="mb-2 h-8 w-8 opacity-40" />
              <p>No notifications yet</p>
            </div>
          : <div className="divide-y">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "hover:bg-accent flex w-full gap-3 px-4 py-3 text-left transition-colors",
                    !item.read && "bg-accent/50"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    {!item.read && <span className="bg-primary block h-2 w-2 rounded-full" />}
                    {item.read && <span className="block h-2 w-2" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", !item.read && "font-medium")}>
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">{item.body}</p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          }
        </div>
      </PopoverContent>
    </Popover>
  );
}
