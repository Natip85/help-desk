"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedTicket(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!svgRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(svgRef.current, {
          rotation: -15,
          scale: 1.18,
          transformOrigin: "center center",
          duration: 0.25,
          ease: "power2.out",
        })
        .to(svgRef.current, {
          rotation: 0,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1.2, 0.3)",
        });
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
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    </span>
  );
}
