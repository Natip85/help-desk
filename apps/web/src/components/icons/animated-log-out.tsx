"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedLogOut(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowRef = useRef<SVGGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!arrowRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(arrowRef.current, {
          x: 14,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .set(arrowRef.current, { x: -14 })
        .to(arrowRef.current, {
          x: 0,
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
        });
    },
    { scope: wrapperRef }
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const anchor = wrapper.closest("a, button, [role='menuitem']");
    if (!anchor) return;

    const onEnter = () => {
      delayRef.current = setTimeout(() => void tlRef.current?.restart(), 150);
    };
    const onLeave = () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };

    anchor.addEventListener("mouseenter", onEnter);
    anchor.addEventListener("mouseleave", onLeave);
    return () => {
      anchor.removeEventListener("mouseenter", onEnter);
      anchor.removeEventListener("mouseleave", onLeave);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <g ref={arrowRef}>
          <polyline points="16 17 21 12 16 7" />
          <line
            x1="21"
            y1="12"
            x2="9"
            y2="12"
          />
        </g>
      </svg>
    </span>
  );
}
