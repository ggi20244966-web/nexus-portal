"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Label from "./Label";
import SceneFrame from "./SceneFrame";

const XS = [-3.4, 0, 3.4];
const RED = new THREE.Color("#FF4D6D");
const N_PARTICLES = 36;

type TagInfo = { name: string; sub: string };

function Rising({ color, active }: { color: string; active: boolean }) {
  const pts = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const p = new Float32Array(N_PARTICLES * 3);
    const s = new Float32Array(N_PARTICLES);
    for (let i = 0; i < N_PARTICLES; i++) {
      p[i * 3] = (Math.random() - 0.5) * 1.7;
      p[i * 3 + 1] = (Math.random() - 0.5) * 2;
      p[i * 3 + 2] = (Math.random() - 0.5) * 1.7;
      s[i] = 0.2 + Math.random() * 0.6;
    }
    return { p, s };
  }, []);

  useFrame((_, dt) => {
    const k = active ? 1.6 : 0.4;
    for (let i = 0; i < N_PARTICLES; i++) {
      data.p[i * 3 + 1] += dt * data.s[i] * k;
      if (data.p[i * 3 + 1] > 1) data.p[i * 3 + 1] = -1;
    }
    if (pts.current) {
      (pts.current.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pts} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={N_PARTICLES}
          array={data.p}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Vault({
  x,
  color,
  active,
  hit,
  name,
  sub,
}: {
  x: number;
  color: string;
  active: boolean;
  hit: boolean;
  name: string;
  sub: string;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const edges = useRef<THREE.LineBasicMaterial>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);

  const base = useMemo(() => new THREE.Color(color), [color]);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(2.2, 2.2, 2.2), []);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const ty = active ? 0.4 : 0;
    const ts = active ? 1.08 : 0.9;
    g.position.y += (ty - g.position.y) * 0.08;
    g.scale.setScalar(g.scale.x + (ts - g.scale.x) * 0.08);

    if (core.current) {
      core.current.rotation.y += dt * (active ? 1.2 : 0.3);
      core.current.rotation.x += dt * 0.5;
    }

    const target = hit ? RED : base;
    if (edges.current) {
      edges.current.color.lerp(target, 0.12);
      edges.current.opacity += ((active || hit ? 1 : 0.3) - edges.current.opacity) * 0.1;
    }
    if (coreMat.current) {
      coreMat.current.color.lerp(target, 0.12);
      coreMat.current.emissive.lerp(target, 0.12);
      coreMat.current.emissiveIntensity +=
        ((active ? 2.6 : 0.3) - coreMat.current.emissiveIntensity) * 0.1;
    }
    if (beamMat.current) {
      beamMat.current.color.lerp(target, 0.12);
      beamMat.current.opacity += ((active ? 0.09 : 0) - beamMat.current.opacity) * 0.08;
    }
  });

  return (
    <group ref={group} position-x={x}>
      <mesh geometry={boxGeo}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial ref={edges} color={color} transparent opacity={0.3} />
      </lineSegments>
      <mesh ref={core}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          ref={coreMat}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Rising color={color} active={active} />
      <mesh position-y={4.6}>
        <cylinderGeometry args={[0.85, 0.85, 8, 32, 1, true]} />
        <meshBasicMaterial
          ref={beamMat}
          color={color}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Label
        text={name}
        sub={hit ? "ACCESS DENIED" : sub}
        color={hit ? "#FF4D6D" : color}
        position={[0, 1.95, 0]}
        scale={1.7}
        opacity={active || hit ? 1 : 0.5}
      />
    </group>
  );
}

function Content({
  active,
  attempt,
  colors,
  labels,
}: {
  active: number;
  attempt: number | null;
  colors: string[];
  labels: TagInfo[];
}) {
  const root = useRef<THREE.Group>(null);
  const probe = useRef<THREE.Mesh>(null);
  const anim = useRef<{ t0: number; from: number; to: number } | null>(null);

  useEffect(() => {
    if (attempt === null) return;
    anim.current = { t0: performance.now(), from: active, to: attempt };
  }, [attempt]);

  useFrame((state) => {
    const r = root.current;
    if (r) {
      r.rotation.y += (state.pointer.x * 0.3 - r.rotation.y) * 0.05;
    }

    const p = probe.current;
    const a = anim.current;
    let shake = 0;

    if (p) {
      if (!a) {
        p.visible = false;
      } else {
        const u = (performance.now() - a.t0) / 1700;
        if (u >= 1) {
          anim.current = null;
          p.visible = false;
        } else {
          const fromX = XS[a.from];
          const dir = Math.sign(XS[a.to] - fromX);
          const wall = XS[a.to] - dir * 1.3;
          let x: number;
          if (u < 0.5) {
            const k = 1 - Math.pow(1 - u / 0.5, 3); // ease-out toward the wall
            x = fromX + (wall - fromX) * k;
          } else {
            const v = (u - 0.5) / 0.5;
            const k = v * v * (3 - 2 * v); // smooth bounce back
            x = wall + (fromX - wall) * k;
          }
          p.visible = true;
          p.position.set(x, 0.4, 0);
          p.scale.setScalar(1 + Math.sin(u * Math.PI * 8) * 0.25);
          // impact shake around the moment of collision
          shake = Math.max(0, 1 - Math.abs(u - 0.5) * 6) * Math.sin(u * 90) * 0.07;
        }
      }
    }
    if (r) r.position.x = shake;
  });

  return (
    <group ref={root} rotation-x={0.22}>
      {XS.map((x, i) => (
        <Vault
          key={i}
          x={x}
          color={colors[i]}
          active={i === active}
          hit={i === attempt}
          name={labels[i]?.name ?? ""}
          sub={labels[i]?.sub ?? ""}
        />
      ))}

      <mesh ref={probe} visible={false}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#FF4D6D" emissive="#FF4D6D" emissiveIntensity={4} />
      </mesh>

      <gridHelper args={[18, 18, "#0e3a47", "#10202c"]} position={[0, -1.5, 0]} />
    </group>
  );
}

export default function VaultScene({
  active,
  attempt,
  colors,
  labels,
}: {
  active: number;
  attempt: number | null;
  colors: string[];
  labels: TagInfo[];
}) {
  return (
    <SceneFrame camera={[0, 1, 11]} fov={45}>
      <Content active={active} attempt={attempt} colors={colors} labels={labels} />
    </SceneFrame>
  );
}