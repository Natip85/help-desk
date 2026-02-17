"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Eye } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTicketPresenceContext } from "./ticket-presence-context";

function getTooltipText(viewers: { id: string; info: { name: string; image: string | null } }[]) {
  const first = viewers[0];
  if (!first) return "";

  if (viewers.length === 1) {
    return `${first.info.name} is also viewing`;
  }

  const second = viewers[1];
  if (viewers.length === 2 && second) {
    return `${first.info.name} and ${second.info.name} are also viewing`;
  }

  return `${first.info.name} and ${viewers.length - 1} others are also viewing`;
}

export function PresenceEyeIndicator() {
  const { viewers } = useTicketPresenceContext();
  const iconRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const hasViewers = viewers.length > 0;

  useEffect(() => {
    if (!iconRef.current) return;

    if (hasViewers) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0, rotation: -20 },
        { scale: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }
      );

      tlRef.current = gsap.timeline({ repeat: -1, delay: 1 });
      tlRef.current
        .to(iconRef.current, {
          scale: 1.3,
          opacity: 0.4,
          duration: 0.4,
          ease: "power2.out",
        })
        .to(iconRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "power2.in",
        })
        .to({}, { duration: 2 });
    }

    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, [hasViewers]);

  if (!hasViewers) return null;

  const tooltipText = getTooltipText(viewers);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={iconRef}
          className="text-primary flex cursor-default items-center"
        >
          <Eye className="size-5 text-yellow-500" />
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
