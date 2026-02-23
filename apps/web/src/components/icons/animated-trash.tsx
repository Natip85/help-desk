"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedTrash2(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lidRef = useRef<SVGGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!lidRef.current || !svgRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(lidRef.current, {
          y: -6,
          rotation: -18,
          transformOrigin: "right bottom",
          duration: 0.25,
          ease: "power2.out",
        })
        .to(
          svgRef.current,
          {
            scale: 1.2,
            transformOrigin: "center center",
            duration: 0.25,
            ease: "power2.out",
          },
          "<"
        )
        .to(lidRef.current, {
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
        <g ref={lidRef}>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </g>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </span>
  );
}
