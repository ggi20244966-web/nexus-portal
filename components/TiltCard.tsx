"use client";

import Tilt from "react-parallax-tilt";
import { useCallback, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
};

/**
 * Glassmorphic card with 3D spatial tilt (react-parallax-tilt) and a
 * cursor-following light spot driven by CSS variables.
 */
export default function TiltCard({
  children,
  className = "",
  style,
  max = 9,
}: Props) {
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <Tilt
      perspective={1000}
      tiltMaxAngleX={max}
      tiltMaxAngleY={max}
      scale={1.015}
      transitionSpeed={900}
      glareEnable
      glareMaxOpacity={0.12}
      glareColor="#00F2FE"
      glarePosition="all"
      glareBorderRadius="1.25rem"
      className="tilt-host h-full"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        onMouseMove={onMove}
        className={`glass glass-glow relative h-full overflow-hidden transition-[border-color,box-shadow] duration-300 ${className}`}
        style={style}
      >
        <span className="spot" />
        <div className="relative h-full" style={{ transform: "translateZ(30px)" }}>
          {children}
        </div>
      </div>
    </Tilt>
  );
}