"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedUser(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!headRef.current || !bodyRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(headRef.current, {
          y: -3,
          scale: 1.08,
          transformOrigin: "center center",
          duration: 0.25,
          ease: "power2.out",
        })
        .to(
          bodyRef.current,
          {
            y: 2,
            transformOrigin: "center bottom",
            duration: 0.25,
            ease: "power2.out",
          },
          "<"
        )
        .to(headRef.current, {
          y: 0,
          scale: 1,
          transformOrigin: "center center",
          duration: 0.75,
          ease: "elastic.out(1.2, 0.3)",
        })
        .to(
          bodyRef.current,
          {
            y: 0,
            transformOrigin: "center bottom",
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
        <path
          ref={bodyRef}
          d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
        />
        <circle
          ref={headRef}
          cx="12"
          cy="7"
          r="4"
        />
      </svg>
    </span>
  );
}
