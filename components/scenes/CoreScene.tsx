"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Label from "./Label";
import SceneFrame from "./SceneFrame";

type OrbitDef = {
  r: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  size: number;
  phase: number;
  label: string;
  sub: string;
};

const ORBITS: OrbitDef[] = [
  { r: 2.0, tilt: [1.15, 0.2, 0], speed: 0.7, color: "#00F2FE", size: 0.15, phase: 0, label: "Acme Corp", sub: "48k rows" },
  { r: 2.5, tilt: [0.5, -0.6, 0.3], speed: -0.5, color: "#34F5A5", size: 0.13, phase: 2, label: "Globex Ltd", sub: "31k rows" },
  { r: 3.0, tilt: [-0.8, 0.4, 0.9], speed: 0.38, color: "#A78BFA", size: 0.17, phase: 4, label: "Initech", sub: "12k rows" },
];

const TRAIL = 46;

function Orbit({ r, tilt, speed, color, size, phase, label, sub }: OrbitDef) {
  const sat = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.BufferGeometry>(null);
  const posArr = useMemo(() => new Float32Array(TRAIL * 3), []);
  const colArr = useMemo(() => {
    const c = new THREE.Color(color);
    const a = new Float32Array(TRAIL * 3);
    for (let i = 0; i < TRAIL; i++) {
      const f = Math.pow(1 - i / TRAIL, 2);
      a[i * 3] = c.r * f;
      a[i * 3 + 1] = c.g * f;
      a[i * 3 + 2] = c.b * f;
    }
    return a;
  }, [color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    const dir = Math.sign(speed);
    if (sat.current) sat.current.position.set(Math.cos(t) * r, Math.sin(t) * r, 0);
    for (let i = 0; i < TRAIL; i++) {
      const a = t - dir * i * 0.045;
      posArr[i * 3] = Math.cos(a) * r;
      posArr[i * 3 + 1] = Math.sin(a) * r;
      posArr[i * 3 + 2] = 0;
    }
    if (trail.current) {
      (trail.current.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group rotation={tilt}>
      <mesh>
        <torusGeometry args={[r, 0.008, 8, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
      <mesh ref={sat}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
        <Label text={label} sub={sub} color={color} lift={0.95} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry ref={trail}>
          <bufferAttribute attach="attributes-position" count={TRAIL} array={posArr} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={TRAIL} array={colArr} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Pulse({ phase }: { phase: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const u = (state.clock.elapsedTime * 0.3 + phase) % 1;
    if (mesh.current) mesh.current.scale.setScalar(1 + u * 3.4);
    if (mat.current) mat.current.opacity = (1 - u) * (1 - u) * 0.6;
  });
  return (
    <mesh ref={mesh}>
      <ringGeometry args={[1.0, 1.03, 128]} />
      <meshBasicMaterial
        ref={mat}
        color="#00F2FE"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Content() {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);

  const stars = useMemo(() => {
    const n = 400;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 3.2 + Math.random() * 1.8;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      a[i * 3 + 2] = r * Math.cos(ph);
    }
    return a;
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (g) {
      g.rotation.y += (state.pointer.x * 0.7 - g.rotation.y) * 0.05;
      g.rotation.x += (-state.pointer.y * 0.5 - g.rotation.x) * 0.05;
    }
    if (wire.current) {
      wire.current.rotation.y += dt * 0.3;
      wire.current.rotation.x += dt * 0.15;
    }
    if (halo.current) {
      halo.current.rotation.y -= dt * 0.12;
      halo.current.rotation.z += dt * 0.08;
    }
    if (glow.current) {
      glow.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.06);
    }
    if (starsRef.current) starsRef.current.rotation.y += dt * 0.04;
  });

  return (
    <group ref={group}>
      <mesh ref={glow}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color="#04202a" emissive="#00F2FE" emissiveIntensity={2.4} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#00F2FE" wireframe />
      </mesh>
      <mesh ref={halo}>
        <icosahedronGeometry args={[1.7, 2]} />
        <meshBasicMaterial color="#34F5A5" wireframe transparent opacity={0.18} />
      </mesh>

      <Label
        text="Control plane"
        sub="RLS · signed claims"
        position={[0, -0.05, 0]}
        lift={-1.6}
      />

      {[0, 0.34, 0.67].map((p) => (
        <Pulse key={p} phase={p} />
      ))}

      {ORBITS.map((o) => (
        <Orbit key={o.color} {...o} />
      ))}

      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length / 3}
            array={stars}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9ffaff"
          size={0.04}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function CoreScene() {
  return (
    <SceneFrame camera={[0, 0, 8.5]} fov={45}>
      <Content />
    </SceneFrame>
  );
}