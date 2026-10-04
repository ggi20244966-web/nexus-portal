"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isLowPower } from "@/lib/perf";

export default function SceneFrame({
  children,
  camera = [0, 0, 8],
  fov = 45,
}: {
  children: ReactNode;
  camera?: [number, number, number];
  fov?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [low] = useState(() => isLowPower());
  const [visible, setVisible] = useState(true);

  // stop rendering while the scene is off-screen
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        camera={{ position: camera, fov }}
        dpr={low ? 1 : [1, 1.75]}
        gl={{ antialias: low, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#070B12"]} />
        <fog attach="fog" args={["#070B12", 12, 26]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 6]} intensity={60} color="#00F2FE" />
        <pointLight position={[-6, -4, 5]} intensity={45} color="#34F5A5" />
        {children}
        {!low && (
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={1.15}
              luminanceThreshold={0.25}
              luminanceSmoothing={0.7}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.2} darkness={0.85} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}