"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Directional 3D card flip + cross-fading blur wipe.
 * The wrapper has a fixed grid cell so entering/leaving pages overlap in the
 * same space (no layout shift).
 */
export default function PageSwap({
  pageKey,
  direction,
  children,
}: {
  pageKey: string;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <div
      className="relative grid"
      style={{ perspective: 1800, transformStyle: "preserve-3d" }}
    >
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={pageKey}
          custom={direction}
          variants={{
            enter: (d: number) => ({
              rotateY: d * 70,
              x: d * 80,
              opacity: 0,
              filter: "blur(18px)",
              scale: 0.96,
            }),
            center: {
              rotateY: 0,
              x: 0,
              opacity: 1,
              filter: "blur(0px)",
              scale: 1,
            },
            exit: (d: number) => ({
              rotateY: d * -70,
              x: d * -80,
              opacity: 0,
              filter: "blur(18px)",
              scale: 0.96,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{
            gridArea: "1 / 1",
            transformOrigin: "center",
            backfaceVisibility: "hidden",
            willChange: "transform, filter, opacity",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}