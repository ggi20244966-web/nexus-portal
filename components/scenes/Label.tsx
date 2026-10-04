"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

type Props = {
  text: string;
  sub?: string;
  color?: string;
  subColor?: string;
  position?: [number, number, number];
  scale?: number;
  opacity?: number;
  /** shift the tag up (positive) or down (negative), in label heights */
  lift?: number;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function Label({
  text,
  sub,
  color = "#00F2FE",
  subColor,
  position = [0, 0, 0],
  scale = 1,
  opacity = 1,
  lift = 0,
}: Props) {
  const { texture, aspect } = useMemo(() => {
    const k = 2; // render at 2x for crisp text
    const pad = 16 * k;
    const f1 = 22 * k;
    const f2 = 15 * k;
    const gap = 6 * k;
    const font1 = `600 ${f1}px ui-sans-serif, system-ui, sans-serif`;
    const font2 = `500 ${f2}px ui-monospace, SFMono-Regular, monospace`;

    const c = document.createElement("canvas");
    const m = c.getContext("2d")!;
    m.font = font1;
    const w1 = m.measureText(text).width;
    m.font = font2;
    const w2 = sub ? m.measureText(sub).width : 0;

    const w = Math.ceil(Math.max(w1, w2) + pad * 2);
    const h = Math.ceil(pad * 2 + f1 + (sub ? gap + f2 : 0));
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d")!;
    roundRect(ctx, 3, 3, w - 6, h - 6, 18);
    ctx.fillStyle = "rgba(7,11,18,0.78)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = font1;
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText(text, w / 2, pad);
    if (sub) {
      ctx.font = font2;
      ctx.fillStyle = subColor ?? color;
      ctx.fillText(sub, w / 2, pad + f1 + gap);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { texture: tex, aspect: w / h };
  }, [text, sub, color, subColor]);

  useEffect(() => () => texture.dispose(), [texture]);

  const hgt = 0.8 * scale;

  return (
    <sprite
      position={position}
      scale={[aspect * hgt, hgt, 1]}
      center-x={0.5}
center-y={0.5 - lift}
      renderOrder={10}
    >
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        fog={false}
        color="#b8b8b8"
      />
    </sprite>
  );
}