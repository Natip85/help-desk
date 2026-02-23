"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function AnimatedLayoutTemplate(props: React.SVGProps<SVGSVGElement>) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panelsRef = useRef<SVGGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!panelsRef.current) return;
      const panels = panelsRef.current.children;

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(panels, {
          scaleX: 1.3,
          scaleY: 1.35,
          transformOrigin: "center center",
          duration: 0.2,
          ease: "power2.out",
          stagger: 0.06,
        })
        .to(panels, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.7,
          ease: "elastic.out(1.2, 0.3)",
          stagger: 0.06,
        });
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
        <g ref={panelsRef}>
          <rect
            width="18"
            height="7"
            x="3"
            y="3"
            rx="1"
          />
          <rect
            width="9"
            height="7"
            x="3"
            y="14"
            rx="1"
          />
          <rect
            width="5"
            height="7"
            x="16"
            y="14"
            rx="1"
          />
        </g>
      </svg>
    </span>
  );
}
