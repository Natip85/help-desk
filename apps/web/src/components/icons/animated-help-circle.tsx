"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedHelpCircle(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const questionRef = useRef<SVGGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!questionRef.current) return;

      const spin = gsap.timeline({ paused: true });

      for (let i = 0; i < 3; i++) {
        spin
          .to(questionRef.current, {
            x: 12,
            opacity: 0,
            duration: 0.15,
            ease: "power2.in",
          })
          .set(questionRef.current, { x: -12 })
          .to(questionRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
          });
      }

      tlRef.current = spin;
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
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <g ref={questionRef}>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </g>
      </svg>
    </span>
  );
}
