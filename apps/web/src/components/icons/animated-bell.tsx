"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedBell(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bellRef = useRef<SVGGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!bellRef.current) return;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(bellRef.current, {
          rotation: -15,
          transformOrigin: "center top",
          duration: 0.08,
          ease: "power2.out",
        })
        .to(bellRef.current, {
          rotation: 15,
          transformOrigin: "center top",
          duration: 0.1,
          ease: "power2.inOut",
        })
        .to(bellRef.current, {
          rotation: -8,
          transformOrigin: "center top",
          duration: 0.1,
          ease: "power2.inOut",
        })
        .to(bellRef.current, {
          rotation: 0,
          scale: 1,
          transformOrigin: "center top",
          duration: 0.8,
          ease: "elastic.out(1.2, 0.3)",
        });
    },
    { scope: wrapperRef }
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const anchor = wrapper.closest("a, button, [role='menuitem']");
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
        <g ref={bellRef}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </g>
      </svg>
    </span>
  );
}
