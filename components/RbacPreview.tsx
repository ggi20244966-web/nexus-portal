"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, KeyRound, Settings, Trash2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import TiltCard from "./TiltCard";
const ShieldScene = dynamic(() => import("./scenes/ShieldScene"), { ssr: false });

type Role = "admin" | "user";

const ACTIONS = [
  { id: "view", label: "View dashboards", icon: Eye, roles: ["admin", "user"] },
  { id: "invite", label: "Invite members", icon: Users, roles: ["admin"] },
  { id: "roles", label: "Edit roles & policies", icon: UserCog, roles: ["admin"] },
  { id: "keys", label: "Rotate API keys", icon: KeyRound, roles: ["admin"] },
  { id: "settings", label: "Tenant settings", icon: Settings, roles: ["admin"] },
  { id: "delete", label: "Delete workspace", icon: Trash2, roles: ["admin"] },
] as const;
const SHORT = ["View", "Invite", "Roles", "API keys", "Settings", "Delete"];
export default function RbacPreview() {
  const [role, setRole] = useState<Role>("admin");
  const isAdmin = role === "admin";

  return (
    <TiltCard className="p-6" max={4}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Access control</p>
          <h3 className="text-xl font-semibold">Real-time RBAC preview</h3>
        </div>

        {/* toggle switch */}
        <button
          role="switch"
          aria-checked={isAdmin}
          aria-label="Toggle between Admin and User role"
          onClick={() => setRole(isAdmin ? "user" : "admin")}
          className="relative flex h-11 w-52 items-center rounded-full border border-cyan-glow/30 bg-black/40 p-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/70"
        >
          <motion.span
            initial={false}
            animate={{ x: isAdmin ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="absolute left-1 top-1 h-9 w-[calc(50%-4px)] rounded-full bg-[linear-gradient(135deg,#9ffaff,#00f2fe,#34f5a5)] shadow-glow"
          />
          <span
            className={`relative z-10 w-1/2 text-center text-sm font-semibold transition-colors ${
              isAdmin ? "text-[#04121a]" : "text-white/60"
            }`}
          >
            Admin
          </span>
          <span
            className={`relative z-10 w-1/2 text-center text-sm font-semibold transition-colors ${
              !isAdmin ? "text-[#04121a]" : "text-white/60"
            }`}
          >
            User
          </span>
        </button>
      </div>
<div className="mb-5 h-72 overflow-hidden rounded-xl border border-white/10 bg-black/30">
  <ShieldScene
  role={role}
  granted={ACTIONS.map((a) => (a.roles as readonly Role[]).includes(role))}
  labels={SHORT}
/>
</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const allowed = (a.roles as readonly Role[]).includes(role);
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              animate={{
                opacity: allowed ? 1 : 0.38,
                filter: allowed ? "blur(0px)" : "blur(0.6px)",
              }}
              transition={{ duration: 0.35 }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                allowed
                  ? "border-emerald-glow/30 bg-emerald-glow/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${allowed ? "text-emerald-glow" : "text-white/40"}`}
              />
              <span className="flex-1 text-sm">{a.label}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={allowed ? "ok" : "no"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    allowed ? "text-emerald-glow" : "text-white/40"
                  }`}
                >
                  {allowed ? "granted" : "denied"}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[11px] text-white/45">
        effective policy: role=<span className="text-cyan-glow">{role}</span> ·
        scopes={isAdmin ? "tenant:*" : "tenant:read"}
      </p>
    </TiltCard>
  );
}