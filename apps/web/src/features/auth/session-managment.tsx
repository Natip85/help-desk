"use client";

import type { Session } from "better-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function SessionManagement({
  sessions,
  currentSessionId,
}: {
  sessions: Session[];
  currentSessionId: string;
}) {
  const router = useRouter();
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  async function handleRevokeOtherSessions() {
    setIsRevokingAll(true);
    try {
      const res = await authClient.revokeOtherSessions();

      if (res.error) {
        toast.error(res.error.message ?? "Failed to revoke sessions");
      } else {
        toast.success("Other sessions revoked");
        router.refresh();
      }
    } finally {
      setIsRevokingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      {currentSession && (
        <SessionCard
          session={currentSession}
          isCurrentSession
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Other Active Sessions</h3>
          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeOtherSessions}
              disabled={isRevokingAll}
            >
              {isRevokingAll ? "Revoking..." : "Revoke Other Sessions"}
            </Button>
          )}
        </div>

        {otherSessions.length === 0 ?
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              No other active sessions
            </CardContent>
          </Card>
        : <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
              />
            ))}
          </div>
        }
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isCurrentSession = false,
}: {
  session: Session;
  isCurrentSession?: boolean;
}) {
  const router = useRouter();
  const [isRevoking, setIsRevoking] = useState(false);
  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null;

  function getBrowserInformation() {
    if (userAgentInfo == null) return "Unknown Device";
    if (userAgentInfo.browser.name == null && userAgentInfo.os.name == null) {
      return "Unknown Device";
    }

    if (userAgentInfo.browser.name == null) return userAgentInfo.os.name;
    if (userAgentInfo.os.name == null) return userAgentInfo.browser.name;

    return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`;
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  async function handleRevokeSession() {
    setIsRevoking(true);
    try {
      const res = await authClient.revokeSession({
        token: session.token,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to revoke session");
      } else {
        toast.success("Session revoked");
        router.refresh();
      }
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>{getBrowserInformation()}</CardTitle>
        {isCurrentSession && <Badge>Current Session</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userAgentInfo?.device.type === "mobile" ?
              <Smartphone />
            : <Monitor />}
            <div>
              <p className="text-muted-foreground text-sm">
                Created: {formatDate(session.createdAt)}
              </p>
              <p className="text-muted-foreground text-sm">
                Expires: {formatDate(session.expiresAt)}
              </p>
            </div>
          </div>
          {!isCurrentSession && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeSession}
              disabled={isRevoking}
            >
              {isRevoking ? "..." : <Trash2 />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
