"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const LINES = [
  "mounting tenant mesh",
  "verifying signed claims",
  "enforcing row-level security",
  "syncing control plane",
];

const STEP_MS = 520;
const START_MS = 600;

export default function BootIntro() {
  const [show, setShow] = useState(true);
  const [step, setStep] = useState(0);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem("nexus-intro", "1");
    } catch {}
    setShow(false);
  }, []);

  // skip for returning visitors (same tab) and reduced-motion users
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("nexus-intro") === "1";
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) setShow(false);
  }, []);

  // run the sequence
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    const timers = LINES.map((_, i) =>
      window.setTimeout(() => setStep(i + 1), START_MS + i * STEP_MS)
    );
    const end = window.setTimeout(close, START_MS + LINES.length * STEP_MS + 800);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(end);
      document.body.style.overflow = "";
    };
  }, [show, close]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070B12]"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.08,
            filter: "blur(24px)",
            transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          {/* ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 50% 45%, rgba(0,242,254,0.14), transparent 65%)",
            }}
          />

          {/* logo + drawing ring */}
          <div className="relative grid h-40 w-40 place-items-center">
            <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full -rotate-90">
              <defs>
                <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#00F2FE" />
                  <stop offset="1" stopColor="#34F5A5" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(0,242,254,0.12)" strokeWidth="1.5" />
              <motion.circle
                cx="80"
                cy="80"
                r="74"
                fill="none"
                stroke="url(#ring)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: (START_MS + LINES.length * STEP_MS) / 1000,
                  ease: "easeInOut",
                }}
                style={{ filter: "drop-shadow(0 0 6px rgba(0,242,254,0.8))" }}
              />
            </svg>

            <motion.span
              initial={{ scale: 0.4, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.15 }}
              className="grid h-20 w-20 place-items-center rounded-2xl bg-[linear-gradient(135deg,#00f2fe,#34f5a5)] font-mono text-4xl font-bold text-[#04121a]"
              style={{ boxShadow: "0 0 60px rgba(0,242,254,0.55)" }}
            >
              N
            </motion.span>
          </div>

          {/* wordmark */}
          <motion.h1
            initial={{ opacity: 0, letterSpacing: "0.9em", y: 8 }}
            animate={{ opacity: 1, letterSpacing: "0.38em", y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-lg font-semibold uppercase text-white sm:text-xl"
          >
            Nexus Portal
          </motion.h1>

          {/* boot log */}
          <div className="mt-8 h-24 w-[min(88vw,380px)] font-mono text-xs">
            {LINES.slice(0, step).map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between py-0.5 text-white/60"
              >
                <span>
                  <span className="mr-2 text-cyan-glow">▸</span>
                  {line}
                </span>
                <span className="text-emerald-glow">{i < step - 1 || step === LINES.length ? "ok" : "…"}</span>
              </motion.div>
            ))}
          </div>

          {/* progress bar */}
          <div className="mt-2 h-px w-[min(88vw,380px)] overflow-hidden bg-white/10">
            <motion.div
              className="h-full bg-[linear-gradient(90deg,#00f2fe,#34f5a5)]"
              style={{ boxShadow: "0 0 10px rgba(0,242,254,0.9)" }}
              animate={{ width: `${(step / LINES.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <button
            onClick={close}
            className="absolute bottom-8 right-8 rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-white/50 outline-none transition-colors hover:border-cyan-glow/50 hover:text-cyan-glow focus-visible:ring-2 focus-visible:ring-cyan-glow/70"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}