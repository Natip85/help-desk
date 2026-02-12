"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ImpersonationIndicator() {
  const router = useRouter();
  const { data: session, refetch } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (session?.session.impersonatedBy == null) return null;

  async function handleStopImpersonating() {
    setIsLoading(true);
    try {
      const res = await authClient.admin.stopImpersonating();

      if (res.error) {
        toast.error(res.error.message ?? "Failed to stop impersonating");
      } else {
        toast.success("Stopped impersonating user");
        router.push("#");
        void refetch();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed right-10 bottom-4 z-50">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleStopImpersonating}
        disabled={isLoading}
      >
        {isLoading ?
          <Loader2 className="size-4 animate-spin" />
        : <UserX className="size-4" />}
      </Button>
    </div>
  );
}
