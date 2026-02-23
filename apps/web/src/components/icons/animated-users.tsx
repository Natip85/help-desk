"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedUsers2(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const frontRef = useRef<SVGGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!frontRef.current || !backRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(frontRef.current, {
          x: -3.5,
          duration: 0.25,
          ease: "power2.out",
        })
        .to(
          backRef.current,
          {
            x: 3.5,
            duration: 0.25,
            ease: "power2.out",
          },
          "<"
        )
        .to(frontRef.current, {
          x: 0,
          duration: 0.7,
          ease: "elastic.out(1.2, 0.3)",
        })
        .to(
          backRef.current,
          {
            x: 0,
            duration: 0.7,
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
        <g ref={frontRef}>
          <path d="M18 21a8 8 0 0 0-16 0" />
          <circle
            cx="10"
            cy="8"
            r="5"
          />
        </g>
        <path
          ref={backRef}
          d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"
        />
      </svg>
    </span>
  );
}
