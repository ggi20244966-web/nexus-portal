"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * Velocity-aware scroll entry: sections slide up and scale in; the faster the
 * user scrolls, the more they skew/stretch before settling.
 */
export default function ScrollSection({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.55"],
  });
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 40, stiffness: 300 });
  const skew = useTransform(smoothVelocity, [-3000, 0, 3000], [-2.5, 0, 2.5]);

  const y = useTransform(scrollYProgress, [0, 1], [90, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.8, 1]);

  return (
    <motion.section
      ref={ref}
      id={id}
      style={{ y, scale, opacity, skewY: skew }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.section>
  );
}