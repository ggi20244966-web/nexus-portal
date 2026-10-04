# Nexus Portal: Multi-Tenant Enterprise SaaS Portal

A front-end showcase of a multi-tenant enterprise portal: live tenant isolation,
role-based access control and an operations dashboard, wrapped in a real-time
3D WebGL interface.

**Live demo:** <add your Vercel link after deploying>

## Highlights

- **Tenant isolation visualizer:** switch tenants in a 3D scene, then attempt a
  cross-tenant read. The probe hits the vault wall, the target flips to
  `ACCESS DENIED`, and the decision lands in an audit stream.
- **Real-time RBAC preview:** an Admin/User switch that grants or revokes six
  permissions, with a 3D shield and energy beams that react instantly.
- **Operations dashboard:** animated KPI counters and a live throughput sparkline.
- **WebGL network mesh** background that responds to mouse position and scroll depth.
- **Cinematic boot intro**, played once per session, with a skip button.
- **3D interactions:** cursor-lit tilt cards, magnetic metallic buttons with
  light sweeps and spring presses, velocity-based scroll transitions, and
  directional 3D page flips with blur wipes and no layout shift.
- **Performance-aware:** automatic low-power mode for phones and weaker
  machines, and scenes stop rendering when off-screen.

## Tech stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · Framer Motion ·
Three.js / React Three Fiber · @react-three/postprocessing ·
react-parallax-tilt · Lucide React

## Project structure

```
app/                 layout, global styles, page shell and page-swap routing
components/          TiltCard, MetalButton, ScrollSection, PageSwap,
                     TenantIsolation, RbacPreview, MetricsDashboard, BootIntro
components/scenes/   CoreScene, VaultScene, ShieldScene, SceneFrame, Label
lib/perf.ts          low-power detection
```

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Notes

This is a front-end showcase. Tenant data, roles and policy decisions are
simulated in the browser; there is no backend. The UI models how a real
system would enforce isolation (signed tenant claims, row-level security,
schema-scoped connections).

## Author

<Diruwo Oroge> · <www.linkedin.com/in/diruwo-oroge-9448a1296>