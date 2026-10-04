"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Label from "./Label";
import SceneFrame from "./SceneFrame";

type Role = "admin" | "user";

const ADMIN = new THREE.Color("#00F2FE");
const USER = new THREE.Color("#7C8DA8");
const ON = new THREE.Color("#34F5A5");
const OFF = new THREE.Color("#2a3345");
const SWARM = 220;

function Orb({ angle, granted }: { angle: number; granted: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!mesh.current || !mat.current) return;
    const s = granted ? 1 : 0.55;
    mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, s, 0.1));
    const c = granted ? ON : OFF;
    mat.current.color.lerp(c, 0.1);
    mat.current.emissive.lerp(c, 0.1);
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(
      mat.current.emissiveIntensity,
      granted ? 2.6 : 0.1,
      0.1
    );
  });

  return (
    <mesh ref={mesh} position={[Math.cos(angle) * 2.7, Math.sin(angle) * 2.7, 0]}>
      <sphereGeometry args={[0.2, 24, 24]} />
      <meshStandardMaterial
        ref={mat}
        color="#2a3345"
        emissive="#2a3345"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function Content({
  role,
  granted,
  labels,
}: {
  role: Role;
  granted: boolean[];
  labels: string[];
}) {
  const shield = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const swarm = useRef<THREE.Points>(null);
  const swarmMat = useRef<THREE.PointsMaterial>(null);
  const beamGeo = useRef<THREE.BufferGeometry>(null);
  const labelRefs = useRef<(THREE.Group | null)[]>([]);
  const reach = useRef<number[]>([]);
  const spin = useRef({ cur: 0, target: 0 });
  const prev = useRef(role);

  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.5);
    s.bezierCurveTo(0.6, 1.2, 1.1, 1.15, 1.3, 1.1);
    s.lineTo(1.3, 0.1);
    s.bezierCurveTo(1.3, -0.7, 0.7, -1.3, 0, -1.7);
    s.bezierCurveTo(-0.7, -1.3, -1.3, -0.7, -1.3, 0.1);
    s.lineTo(-1.3, 1.1);
    s.bezierCurveTo(-1.1, 1.15, -0.6, 1.2, 0, 1.5);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 5,
      curveSegments: 32,
    });
    g.center();
    return g;
  }, []);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo, 25), [geo]);

  const swarmPos = useMemo(() => {
    const a = new Float32Array(SWARM * 3);
    for (let i = 0; i < SWARM; i++) {
      const r = 1.9 + Math.random() * 0.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      a[i * 3 + 2] = r * Math.cos(ph);
    }
    return a;
  }, []);

  const beamPos = useMemo(() => new Float32Array(granted.length * 6), [granted.length]);

  // spin the shield a full turn whenever the role flips
  useEffect(() => {
    if (prev.current !== role) {
      prev.current = role;
      spin.current.target += Math.PI * 2;
    }
  }, [role]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    spin.current.cur += (spin.current.target - spin.current.cur) * 0.06;
    if (shield.current) {
      shield.current.rotation.y =
        spin.current.cur + state.pointer.x * 0.5 + Math.sin(t * 0.6) * 0.15;
      shield.current.rotation.x = -state.pointer.y * 0.3;
      shield.current.position.y = Math.sin(t * 1.2) * 0.08;
    }
    if (ring.current) ring.current.rotation.z += dt * 0.12;

    const c = role === "admin" ? ADMIN : USER;
    if (mat.current) {
      mat.current.emissive.lerp(c, 0.08);
      mat.current.emissiveIntensity +=
        ((role === "admin" ? 0.9 : 0.25) - mat.current.emissiveIntensity) * 0.08;
    }
    if (edgeMat.current) edgeMat.current.color.lerp(c, 0.08);

    // particle swarm around the shield
    if (swarm.current) {
      swarm.current.rotation.y += dt * 0.35;
      swarm.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (swarmMat.current) swarmMat.current.color.lerp(c, 0.08);

    // beams from the shield to every granted orb + labels that follow the orbs
    const rz = ring.current ? ring.current.rotation.z : 0;
    const n = granted.length;
    for (let i = 0; i < n; i++) {
      const target = granted[i] ? 1 : 0;
      const cur = reach.current[i] ?? 0;
      const nxt = cur + (target - cur) * 0.08;
      reach.current[i] = nxt;
      const a = (i / n) * Math.PI * 2 + rz;
      beamPos[i * 6] = 0;
      beamPos[i * 6 + 1] = 0;
      beamPos[i * 6 + 2] = 0;
      beamPos[i * 6 + 3] = Math.cos(a) * 2.7 * nxt;
      beamPos[i * 6 + 4] = Math.sin(a) * 2.7 * nxt;
      beamPos[i * 6 + 5] = 0;

      const grp = labelRefs.current[i];
      if (grp) {
        grp.position.set(Math.cos(a) * 2.7, Math.sin(a) * 2.7, 0);
        grp.scale.setScalar(
          THREE.MathUtils.lerp(grp.scale.x, granted[i] ? 1 : 0.8, 0.1)
        );
      }
    }
    if (beamGeo.current) {
      (beamGeo.current.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={shield}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial
            ref={mat}
            color="#0f1b2d"
            metalness={0.6}
            roughness={0.3}
            clearcoat={1}
            emissive="#00F2FE"
            emissiveIntensity={0.9}
          />
        </mesh>
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial ref={edgeMat} color="#00F2FE" />
        </lineSegments>
      </group>

      <points ref={swarm} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={SWARM}
            array={swarmPos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={swarmMat}
          color="#00F2FE"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={beamGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={beamPos.length / 3}
            array={beamPos}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#34F5A5"
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <group ref={ring}>
        <mesh>
          <torusGeometry args={[2.7, 0.01, 8, 160]} />
          <meshBasicMaterial color="#00F2FE" transparent opacity={0.3} />
        </mesh>
        {granted.map((g, i) => (
          <Orb key={i} angle={(i / granted.length) * Math.PI * 2} granted={g} />
        ))}
      </group>

      {granted.map((g, i) => (
        <group
          key={i}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
        >
          <Label
            text={labels[i] ?? ""}
            sub={g ? "granted" : "denied"}
            color={g ? "#34F5A5" : "#6b7a93"}
            lift={-0.95}
            scale={1.1}
            opacity={g ? 1 : 0.5}
          />
        </group>
      ))}
    </group>
  );
}

export default function ShieldScene({
  role,
  granted,
  labels,
}: {
  role: Role;
  granted: boolean[];
  labels: string[];
}) {
  return (
    <SceneFrame camera={[0, 0, 8]} fov={45}>
      <Content role={role} granted={granted} labels={labels} />
    </SceneFrame>
  );
}