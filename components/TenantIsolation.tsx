"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Database, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import MetalButton from "./MetalButton";
import TiltCard from "./TiltCard";
const VaultScene = dynamic(() => import("./scenes/VaultScene"), { ssr: false });

const TENANTS = [
  { id: "acme", name: "Acme Corp", color: "#00F2FE", rows: 48210, schema: "tenant_acme" },
  { id: "globex", name: "Globex Ltd", color: "#34F5A5", rows: 31877, schema: "tenant_globex" },
  { id: "initech", name: "Initech", color: "#A78BFA", rows: 12904, schema: "tenant_initech" },
] as const;

type TenantId = (typeof TENANTS)[number]["id"];

export default function TenantIsolation() {
  const [active, setActive] = useState<TenantId>("acme");
  const [attempt, setAttempt] = useState<TenantId | null>(null);
  const [log, setLog] = useState<string[]>([
    "session bound → tenant_acme (RLS enforced)",
  ]);

  const current = TENANTS.find((t) => t.id === active)!;

  const switchTenant = (id: TenantId) => {
    setActive(id);
    setAttempt(null);
    const t = TENANTS.find((x) => x.id === id)!;
    setLog((l) => [`session bound → ${t.schema} (RLS enforced)`, ...l].slice(0, 5));
  };

  const crossTenant = () => {
    const i = TENANTS.findIndex((t) => t.id === active);
const target = TENANTS[i === 2 ? 1 : i + 1];
    setAttempt(target.id);
    setLog((l) =>
      [
        `✗ DENIED  SELECT * FROM ${target.schema}.invoices  (policy: tenant_id = ${active})`,
        ...l,
      ].slice(0, 5)
    );
    window.setTimeout(() => setAttempt(null), 1800);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <TiltCard className="p-6" max={5}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Live demo</p>
            <h3 className="text-xl font-semibold">Tenant isolation visualizer</h3>
          </div>
          <Lock className="h-5 w-5 text-emerald-glow" />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {TENANTS.map((t) => (
            <MetalButton
              key={t.id}
              variant={t.id === active ? "primary" : "ghost"}
              pressed={t.id === active}
              onClick={() => switchTenant(t.id)}
            >
              <Building2 className="h-4 w-4" />
              {t.name}
            </MetalButton>
          ))}
        </div>
<div className="mb-5 h-64 overflow-hidden rounded-xl border border-white/10 bg-black/30">
  <VaultScene
  active={TENANTS.findIndex((t) => t.id === active)}
  attempt={attempt ? TENANTS.findIndex((t) => t.id === attempt) : null}
  colors={TENANTS.map((t) => t.color)}
  labels={TENANTS.map((t) => ({
    name: t.name,
    sub: `${t.rows.toLocaleString()} rows`,
  }))}
/>
</div>
        {/* isolation diagram */}
        <div className="relative grid grid-cols-3 gap-3">
          {TENANTS.map((t) => {
            const isActive = t.id === active;
            const isTarget = t.id === attempt;
            return (
              <motion.div
                key={t.id}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  scale: isActive ? 1 : 0.96,
                  borderColor: isTarget ? "#FF4D6D" : isActive ? t.color : "rgba(255,255,255,0.12)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative rounded-xl border bg-black/30 p-4"
                style={{
                  boxShadow: isActive ? `0 0 28px ${t.color}33` : "none",
                }}
              >
                <Database className="mb-3 h-5 w-5" style={{ color: t.color }} />
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="mt-1 font-mono text-[11px] text-white/50">{t.schema}</p>
                <p className="mt-3 font-mono text-xs" style={{ color: t.color }}>
                  {t.rows.toLocaleString()} rows
                </p>
                {isActive && (
                  <span
                    className="absolute right-3 top-3 h-2 w-2 rounded-full"
                    style={{ background: t.color }}
                  >
                    <span
                      className="absolute inset-0 animate-pulseRing rounded-full"
                      style={{ background: t.color }}
                    />
                  </span>
                )}
                <AnimatePresence>
                  {isTarget && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#FF4D6D]/15 backdrop-blur-sm"
                    >
                      <ShieldAlert className="h-8 w-8 text-[#FF4D6D]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <MetalButton variant="ghost" onClick={crossTenant}>
            <ShieldCheck className="h-4 w-4" />
            Attempt cross-tenant read
          </MetalButton>
          <span className="text-xs text-white/50">
            Active scope:{" "}
            <span className="font-mono" style={{ color: current.color }}>
              {current.schema}
            </span>
          </span>
        </div>
      </TiltCard>

      <TiltCard className="p-6" max={5}>
        <p className="eyebrow">Audit stream</p>
        <h3 className="mb-4 text-xl font-semibold">Policy decisions</h3>
        <ul className="space-y-2 font-mono text-xs">
          <AnimatePresence initial={false}>
            {log.map((line, i) => (
              <motion.li
                key={line + i}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-lg border px-3 py-2 ${
                  line.startsWith("✗")
                    ? "border-[#FF4D6D]/40 bg-[#FF4D6D]/10 text-[#FF8FA3]"
                    : "border-emerald-glow/25 bg-emerald-glow/5 text-emerald-glow/90"
                }`}
              >
                {line}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          Each request carries a signed tenant claim. Row-level security and
          schema-scoped connections make cross-tenant reads fail closed.
        </p>
      </TiltCard>
    </div>
  );
}