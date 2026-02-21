"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SlaStatus = "met" | "breached" | "active" | "none";

function getSlaStatus(
  firstResponseAt: Date | null,
  slaFirstResponseDueAt: Date | null,
  slaBreachedAt: Date | null
): SlaStatus {
  if (!slaFirstResponseDueAt) return "none";

  if (slaBreachedAt) return "breached";
  if (firstResponseAt) {
    return firstResponseAt <= slaFirstResponseDueAt ? "met" : "breached";
  }

  return new Date() > slaFirstResponseDueAt ? "breached" : "active";
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0m";

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SlaBadge({
  firstResponseAt,
  slaFirstResponseDueAt,
  slaBreachedAt,
  size = "default",
}: {
  firstResponseAt: Date | string | null;
  slaFirstResponseDueAt: Date | string | null;
  slaBreachedAt: Date | string | null;
  size?: "default" | "sm";
}) {
  const dueAt = slaFirstResponseDueAt ? new Date(slaFirstResponseDueAt) : null;
  const respondedAt = firstResponseAt ? new Date(firstResponseAt) : null;
  const breachedAt = slaBreachedAt ? new Date(slaBreachedAt) : null;

  const status = getSlaStatus(respondedAt, dueAt, breachedAt);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "active") return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "none") return null;

  const remaining = dueAt ? dueAt.getTime() - now : 0;
  const iconSize = size === "sm" ? "size-3" : "size-3.5";

  const content = {
    met: {
      variant: "outline" as const,
      className: "border-green-500/30 text-green-600 bg-green-500/10",
      icon: <Check className={iconSize} />,
      label: "SLA Met",
    },
    breached: {
      variant: "outline" as const,
      className: "border-red-500/30 text-red-600 bg-red-500/10",
      icon: <AlertTriangle className={iconSize} />,
      label: "SLA Breached",
    },
    active: {
      variant: "outline" as const,
      className: "border-amber-500/30 text-amber-600 bg-amber-500/10",
      icon: <Clock className={iconSize} />,
      label: formatTimeRemaining(remaining),
    },
  }[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={content.variant}
          className={`${content.className} gap-1 text-[10px] font-medium`}
        >
          {content.icon}
          {content.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {status === "met" && "First response sent within SLA target"}
        {status === "breached" && "First response SLA has been breached"}
        {status === "active" &&
          `${formatTimeRemaining(remaining)} remaining to send first response`}
      </TooltipContent>
    </Tooltip>
  );
}
