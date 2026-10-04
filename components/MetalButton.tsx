"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  pressed?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
};

/**
 * Metallic neon button: magnetic pull toward the cursor, light-sweep
 * highlight on hover, and a spring press state (scale 0.96).
 */
export default function MetalButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  pressed,
  type = "button",
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 16, mass: 0.4 });
  const tx = useTransform(x, (v) => v * 0.4);
  const ty = useTransform(y, (v) => v * 0.4);

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.35);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const base =
    variant === "primary"
      ? "text-[#04121a] bg-[linear-gradient(135deg,#9ffaff_0%,#00f2fe_40%,#34f5a5_100%)] shadow-[0_0_24px_rgba(0,242,254,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]"
      : "text-cyan-glow bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] border border-cyan-glow/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

  return (
    <motion.button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: tx, y: ty }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/70 ${base} ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      {/* light sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:animate-sweep group-hover:opacity-100"
      />
    </motion.button>
  );
}