"use client";

import { isLowPower } from "@/lib/perf";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const LOW = isLowPower();
const NODE_COUNT = LOW ? 45 : 90;
const LINK_DIST = LOW ? 3.2 : 2.6;
const PARTICLE_COUNT = LOW ? 24 : 60;

function Mesh({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(NODE_COUNT * 3);
    const v = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8;
      v[i * 3] = (Math.random() - 0.5) * 0.004;
      v[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }
    return { positions: p, velocities: v };
  }, []);

  const pointsGeo = useRef<THREE.BufferGeometry>(null);
  const linesGeo = useRef<THREE.BufferGeometry>(null);
  const linePositions = useMemo(
    () => new Float32Array(NODE_COUNT * NODE_COUNT * 6),
    []
  );

  // data particles travelling along random edges
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        a: Math.floor(Math.random() * NODE_COUNT),
        b: Math.floor(Math.random() * NODE_COUNT),
        t: Math.random(),
        speed: 0.004 + Math.random() * 0.01,
      })),
    []
  );
  const particlePositions = useMemo(
    () => new Float32Array(PARTICLE_COUNT * 3),
    []
  );
  const particleGeo = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;

    // mouse parallax + scroll depth
    const tx = pointer.current.y * 0.25;
    const ty = pointer.current.x * 0.35;
    g.rotation.x += (tx - g.rotation.x) * 0.04;
    g.rotation.y += (ty + state.clock.elapsedTime * 0.02 - g.rotation.y) * 0.04;
    const targetZ = -scrollRef.current * 4.5;
    g.position.z += (targetZ - g.position.z) * 0.06;
    g.position.y += (scrollRef.current * 1.5 - g.position.y) * 0.06;

    // drift nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let k = 0; k < 3; k++) {
        const idx = i * 3 + k;
        positions[idx] += velocities[idx];
        const lim = k === 0 ? 8 : k === 1 ? 5 : 4;
        if (Math.abs(positions[idx]) > lim) velocities[idx] *= -1;
      }
    }
    // pointer repulsion (in group space approx)
    const px = pointer.current.x * (viewport.width / 2);
    const py = pointer.current.y * (viewport.height / 2);
    for (let i = 0; i < NODE_COUNT; i++) {
      const dx = positions[i * 3] - px;
      const dy = positions[i * 3 + 1] - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < 3) {
        positions[i * 3] += dx * 0.01;
        positions[i * 3 + 1] += dy * 0.01;
      }
    }

    // links
    let n = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
          linePositions[n++] = positions[i * 3];
          linePositions[n++] = positions[i * 3 + 1];
          linePositions[n++] = positions[i * 3 + 2];
          linePositions[n++] = positions[j * 3];
          linePositions[n++] = positions[j * 3 + 1];
          linePositions[n++] = positions[j * 3 + 2];
        }
      }
    }
    if (linesGeo.current) {
      const attr = linesGeo.current.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      attr.needsUpdate = true;
      linesGeo.current.setDrawRange(0, n / 3);
    }
    if (pointsGeo.current) {
      const attr = pointsGeo.current.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }

    // particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.t += p.speed * (1 + Math.abs(pointer.current.x) * 2);
      if (p.t >= 1) {
        p.t = 0;
        p.a = p.b;
        // hop to a nearby node when possible
        let best = Math.floor(Math.random() * NODE_COUNT);
        for (let tries = 0; tries < 8; tries++) {
          const c = Math.floor(Math.random() * NODE_COUNT);
          const dx = positions[p.a * 3] - positions[c * 3];
          const dy = positions[p.a * 3 + 1] - positions[c * 3 + 1];
          const dz = positions[p.a * 3 + 2] - positions[c * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST * 1.5) {
            best = c;
            break;
          }
        }
        p.b = best;
      }
      particlePositions[i * 3] =
        positions[p.a * 3] + (positions[p.b * 3] - positions[p.a * 3]) * p.t;
      particlePositions[i * 3 + 1] =
        positions[p.a * 3 + 1] +
        (positions[p.b * 3 + 1] - positions[p.a * 3 + 1]) * p.t;
      particlePositions[i * 3 + 2] =
        positions[p.a * 3 + 2] +
        (positions[p.b * 3 + 2] - positions[p.a * 3 + 2]) * p.t;
    }
    if (particleGeo.current) {
      const attr = particleGeo.current.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry ref={pointsGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={NODE_COUNT}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00F2FE"
          size={0.07}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={linesGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00F2FE"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points frustumCulled={false}>
        <bufferGeometry ref={particleGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#34F5A5"
          size={0.14}
          sizeAttenuation
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function NetworkCanvas() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(1200px 700px at 70% -10%, rgba(0,242,254,0.10), transparent 60%), radial-gradient(900px 600px at 0% 100%, rgba(52,245,165,0.08), transparent 60%), #0B0F17",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        dpr={LOW ? 1 : [1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#0B0F17", 8, 18]} />
        <Mesh scrollRef={scrollRef} />
      </Canvas>
    </div>
  );
}