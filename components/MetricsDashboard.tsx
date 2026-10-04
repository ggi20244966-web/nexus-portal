"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { Activity, Gauge, Server, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import TiltCard from "./TiltCard";

function Counter({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => n.toFixed(decimals) + suffix);

  useEffect(() => {
    if (inView) {
      const c = animate(v, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
      return () => c.stop();
    }
  }, [inView, to, v]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 28 - ((d - min) / (max - min || 1)) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-10 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" x2="1">
          <stop offset="0" stopColor="#00F2FE" />
          <stop offset="1" stopColor="#34F5A5" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={pts}
        fill="none"
        stroke="url(#spark)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4 }}
      />
    </svg>
  );
}

export default function MetricsDashboard() {
  const [series, setSeries] = useState<number[]>(() =>
    Array.from({ length: 28 }, (_, i) => 40 + Math.sin(i / 3) * 12 + (i % 5) * 2)
  );

  // live-ish request throughput feed
  useEffect(() => {
    const id = window.setInterval(() => {
      setSeries((s) => [...s.slice(1), 38 + Math.random() * 30]);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  const kpis = useMemo(
    () => [
      { label: "Active tenants", value: 1248, decimals: 0, suffix: "", icon: Users, delta: "+12.4%" },
      { label: "p95 latency", value: 84, decimals: 0, suffix: " ms", icon: Gauge, delta: "−9.1%" },
      { label: "Uptime (90d)", value: 99.99, decimals: 2, suffix: "%", icon: Server, delta: "SLA met" },
      { label: "Requests / min", value: 482, decimals: 0, suffix: "k", icon: Activity, delta: "+4.7%" },
    ],
    []
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <TiltCard key={k.label} className="p-5" max={10}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-white/50">{k.label}</p>
                <Icon className="h-4 w-4 text-cyan-glow" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-gradient">
                <Counter to={k.value} decimals={k.decimals} suffix={k.suffix} />
              </p>
              <p className="mt-1 font-mono text-[11px] text-emerald-glow">{k.delta}</p>
            </TiltCard>
          );
        })}
      </div>

      <TiltCard className="p-6" max={3}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Control plane</p>
            <h3 className="text-xl font-semibold">Throughput (live)</h3>
          </div>
          <span className="flex items-center gap-2 font-mono text-xs text-emerald-glow">
            <span className="relative h-2 w-2 rounded-full bg-emerald-glow">
              <span className="absolute inset-0 animate-pulseRing rounded-full bg-emerald-glow" />
            </span>
            streaming
          </span>
        </div>
        <Sparkline data={series} />
      </TiltCard>
    </div>
  );
}