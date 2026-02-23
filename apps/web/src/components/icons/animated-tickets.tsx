"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedTickets(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const backTicketRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!backTicketRef.current || !svgRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(backTicketRef.current, {
          y: -5,
          rotation: -8,
          transformOrigin: "center bottom",
          duration: 0.25,
          ease: "power2.out",
        })
        .to(
          svgRef.current,
          {
            scale: 1.12,
            transformOrigin: "center center",
            duration: 0.25,
            ease: "power2.out",
          },
          "<"
        )
        .to(backTicketRef.current, {
          y: 0,
          rotation: 0,
          duration: 0.75,
          ease: "elastic.out(1.2, 0.3)",
        })
        .to(
          svgRef.current,
          {
            scale: 1,
            duration: 0.75,
            ease: "elastic.out(1.2, 0.3)",
          },
          "<"
        );
    },
    { scope: wrapperRef }
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const anchor = wrapper.closest("a, [role='menuitem']");
    if (!anchor) return;

    const restart = () => void tlRef.current?.restart();
    anchor.addEventListener("mouseenter", restart);
    return () => anchor.removeEventListener("mouseenter", restart);
  }, []);

  return (
    <span
      ref={wrapperRef}
      style={{ display: "inline-flex", pointerEvents: "auto" }}
    >
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        overflow="visible"
        {...props}
      >
        <path
          ref={backTicketRef}
          d="m4.5 8 10.58-5.06a1 1 0 0 1 1.342.488L18.5 8"
        />
        <path d="M6 10V8" />
        <path d="M6 14v1" />
        <path d="M6 19v2" />
        <rect
          x="2"
          y="8"
          width="20"
          height="13"
          rx="2"
        />
      </svg>
    </span>
  );
}
