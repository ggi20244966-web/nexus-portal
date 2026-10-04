"use client";

import BootIntro from "@/components/BootIntro";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowRight, Boxes, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import MetalButton from "@/components/MetalButton";
import MetricsDashboard from "@/components/MetricsDashboard";
import PageSwap from "@/components/PageSwap";
import RbacPreview from "@/components/RbacPreview";
import ScrollSection from "@/components/ScrollSection";
import TenantIsolation from "@/components/TenantIsolation";
import TiltCard from "@/components/TiltCard";

const NetworkCanvas = dynamic(() => import("@/components/NetworkCanvas"), {
  ssr: false,
});

const CoreScene = dynamic(() => import("@/components/scenes/CoreScene"), {
  ssr: false,
});

const PAGES = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenancy", label: "Tenant isolation", icon: Boxes },
  { id: "access", label: "Access control", icon: ShieldCheck },
] as const;

type PageId = (typeof PAGES)[number]["id"];

function Overview({ goto }: { goto: (id: PageId) => void }) {
  return (
    <div className="space-y-24">
      <ScrollSection className="grid items-center gap-8 pt-4 lg:grid-cols-[1.05fr_1fr]">
  <div className="text-center lg:text-left">
    <p className="eyebrow mb-4 inline-flex items-center gap-2">
      <Sparkles className="h-3.5 w-3.5" /> Multi-tenant enterprise platform
    </p>
    <h1 className="text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
      One platform. Every tenant{" "}
      <span className="text-gradient">cryptographically isolated.</span>
    </h1>
    <p className="mx-auto mt-5 max-w-xl text-base text-white/60 sm:text-lg lg:mx-0">
      A governed control plane with row-level tenant isolation, role-based
      access, and real-time observability — built for teams that can't afford
      a cross-tenant leak.
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
      <MetalButton onClick={() => goto("tenancy")}>
        Explore isolation <ArrowRight className="h-4 w-4" />
      </MetalButton>
      <MetalButton variant="ghost" onClick={() => goto("access")}>
        Preview RBAC
      </MetalButton>
    </div>
  </div>
  <div className="glass h-[340px] overflow-hidden sm:h-[420px] lg:h-[480px]">
    <CoreScene />
  </div>
</ScrollSection>
      <ScrollSection>
        <div className="mb-6">
          <p className="eyebrow">Operations</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">Platform health at a glance</h2>
        </div>
        <MetricsDashboard />
      </ScrollSection>

      <ScrollSection>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Schema-scoped data", "Per-tenant schemas plus RLS policies keep every query inside its boundary."],
            ["Signed tenant claims", "Every request carries a verified tenant and role claim, enforced at the edge."],
            ["Immutable audit trail", "Each policy decision is logged and streamable to your SIEM."],
          ].map(([title, body]) => (
            <TiltCard key={title} className="p-6">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
            </TiltCard>
          ))}
        </div>
      </ScrollSection>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<PageId>("overview");
  const [dir, setDir] = useState<1 | -1>(1);

  const goto = (id: PageId) => {
    if (id === page) return;
    const from = PAGES.findIndex((p) => p.id === page);
    const to = PAGES.findIndex((p) => p.id === id);
    setDir(to > from ? 1 : -1);
    setPage(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <NetworkCanvas />
<BootIntro />
      <header className="sticky top-0 z-30 px-4 pt-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,#00f2fe,#34f5a5)] font-mono text-sm font-bold text-[#04121a]">
              N
            </span>
            <span className="hidden font-semibold tracking-wide sm:inline">Nexus Portal</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {PAGES.map((p) => {
              const Icon = p.icon;
              const active = p.id === page;
              return (
                <button
                  key={p.id}
                  onClick={() => goto(p.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-glow/70 ${
                    active ? "text-cyan-glow" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{p.label}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-px bg-cyan-glow shadow-glow" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-12">
        <PageSwap pageKey={page} direction={dir}>
          {page === "overview" && <Overview goto={goto} />}
          {page === "tenancy" && (
            <div className="space-y-8">
              <div>
                <p className="eyebrow">Tenancy</p>
                <h2 className="text-3xl font-semibold">Isolation you can watch work</h2>
                <p className="mt-2 max-w-2xl text-white/60">
                  Switch tenants, then try a cross-tenant read. Policies fail closed
                  and every decision lands in the audit stream.
                </p>
              </div>
              <TenantIsolation />
            </div>
          )}
          {page === "access" && (
            <div className="space-y-8">
              <div>
                <p className="eyebrow">Governance</p>
                <h2 className="text-3xl font-semibold">See exactly what each role can do</h2>
                <p className="mt-2 max-w-2xl text-white/60">
                  Flip between Admin and User to preview the effective permission set
                  in real time.
                </p>
              </div>
              <RbacPreview />
            </div>
          )}
        </PageSwap>
      </main>
    </>
  );
}