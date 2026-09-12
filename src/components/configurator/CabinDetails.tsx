import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { INTERIOR_FINISHES } from "./config";

// Source CAD coordinates, shared with all four GLB files.
const SHELL: { position: [number, number, number]; size: [number, number, number] }[] = [
  { position: [0, 0.425, -2.36], size: [1.43, 0.04, 2.65] },
  { position: [0, 0.73, -0.99], size: [1.43, 0.62, 0.04] },
  { position: [0, 0.89, -3.72], size: [1.43, 0.92, 0.04] },
  { position: [0, 1.69, -3.0], size: [1.43, 0.035, 1.3] },
  { position: [-0.68, 1.69, -1.69], size: [0.12, 0.035, 1.32] },
  { position: [0.68, 1.69, -1.69], size: [0.12, 0.035, 1.32] },
  { position: [0, 1.69, -1.08], size: [1.43, 0.035, 0.12] },
];

function instrumentTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#080d12";
  ctx.fillRect(0, 0, 1024, 256);
  const sheen = ctx.createLinearGradient(0, 0, 0, 256);
  sheen.addColorStop(0, "rgba(120,155,180,.16)");
  sheen.addColorStop(0.35, "rgba(25,34,43,.06)");
  sheen.addColorStop(1, "rgba(0,0,0,.24)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 1024, 256);
  for (const x of [155, 405]) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#8eabb5";
    ctx.beginPath();
    ctx.arc(x, 132, 86, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4b5962";
    ctx.beginPath();
    ctx.arc(x, 132, 67, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#f0ede5";
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (0.75 + (i / 12) * 1.5);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 73, 132 + Math.sin(a) * 73);
      ctx.lineTo(x + Math.cos(a) * 82, 132 + Math.sin(a) * 82);
      ctx.stroke();
    }
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2f4f4";
  ctx.font = "48px sans-serif";
  ctx.fillText("0", 155, 146);
  ctx.fillText("P", 405, 146);
  ctx.font = "18px sans-serif";
  ctx.fillText("km/h", 155, 177);
  ctx.fillStyle = "#26323b";
  ctx.fillRect(553, 20, 2, 216);
  ctx.textAlign = "left";
  ctx.fillStyle = "#eee9dc";
  ctx.font = "25px sans-serif";
  ctx.fillText("M MONOGRAM", 595, 76);
  ctx.fillStyle = "#b5c1c8";
  ctx.font = "18px sans-serif";
  ctx.fillText("ICONIC", 595, 108);
  ctx.strokeStyle = "#9a8053";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(595, 133);
  ctx.lineTo(938, 133);
  ctx.stroke();
  ctx.fillStyle = "#71808a";
  ctx.font = "16px sans-serif";
  ctx.fillText("DUBAI  ·  STUDIO", 595, 166);
  ctx.fillText("22.0 C", 595, 203);
  ctx.fillText("22.0 C", 863, 203);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function CabinDetails({ night, interior, instrumentsOnly = false }: { night: boolean; interior: number; instrumentsOnly?: boolean }) {
  const display = useMemo(instrumentTexture, []);
  const finish = INTERIOR_FINISHES[interior] ?? INTERIOR_FINISHES[0];
  useEffect(() => () => display.dispose(), [display]);
  const instruments = (
    <group>
      {!instrumentsOnly && (
        <RoundedBox position={[0.24, 1.315, -1.16]} args={[0.87, 0.24, 0.025]} radius={0.01} smoothness={2}>
          <meshStandardMaterial color="#080a0d" roughness={0.28} />
        </RoundedBox>
      )}
      {!instrumentsOnly && (
        <RoundedBox position={[0.395, 1.16, -1.437]} args={[0.19, 0.125, 0.065]} radius={0.025} smoothness={3}>
          <meshStandardMaterial color={finish.primary} roughness={0.75} />
        </RoundedBox>
      )}
      {instrumentsOnly && (
        <RoundedBox position={[0.18, 1.19, -1.145]} args={[0.91, 0.185, 0.028]} radius={0.015} smoothness={3}>
          <meshStandardMaterial color="#050607" metalness={0.12} roughness={0.22} />
        </RoundedBox>
      )}
      <mesh
        position={instrumentsOnly ? [0.18, 1.19, -1.162] : [0.24, 1.315, -1.174]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={instrumentsOnly ? [0.88, 0.166] : [0.84, 0.21]} />
        <meshBasicMaterial map={display} toneMapped={false} />
      </mesh>
    </group>
  );

  if (instrumentsOnly) {
    return (
      <group>
        {instruments}
        <mesh position={[0.18, 1.085, -1.17]}>
          <boxGeometry args={[0.92, 0.007, 0.008]} />
          <meshStandardMaterial color="#c7a461" emissive="#8d6835" emissiveIntensity={night ? 1.4 : 0.55} />
        </mesh>
        {[-0.12, -0.04, 0.04, 0.12].map((x) => (
          <RoundedBox key={x} position={[x, 1.055, -1.18]} args={[0.052, 0.018, 0.016]} radius={0.004} smoothness={2}>
            <meshStandardMaterial color="#b5aa96" metalness={0.8} roughness={0.34} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  return (
    <group>
      {[-0.395, 0.395].map((x) => (
        <group key={x}>
          <RoundedBox position={[x, 1.095, -2.055]} args={[0.43, 0.60, 0.13]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color={finish.primary} roughness={0.8} />
          </RoundedBox>
          <RoundedBox position={[x, 1.06, -2.855]} args={[0.44, 0.52, 0.14]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color={finish.primary} roughness={0.8} />
          </RoundedBox>
        </group>
      ))}
      {[-0.755, 0.755].map((x) => (
        <RoundedBox key={x} position={[x, 0.735, -2.04]} args={[0.035, 0.50, 1.98]} radius={0.015} smoothness={2}>
          <meshStandardMaterial color={finish.primary} roughness={0.8} />
        </RoundedBox>
      ))}
      <RoundedBox position={[0, 0.665, -1.64]} args={[0.255, 0.39, 0.95]} radius={0.045} smoothness={3}>
        <meshStandardMaterial color={finish.primary} roughness={0.72} />
      </RoundedBox>
      <RoundedBox position={[0, 1.195, -1.13]} args={[1.41, 0.055, 0.22]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color={finish.primary} roughness={0.8} />
      </RoundedBox>
      {[-0.105, 0.105].map((x) => (
        <group key={x} position={[x, 1.052, -1.305]}>
          <mesh>
            <torusGeometry args={[0.036, 0.004, 8, 24]} />
            <meshStandardMaterial color="#9da3a6" metalness={0.85} roughness={0.3} />
          </mesh>
          {[-0.02, -0.01, 0, 0.01, 0.02].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[Math.sqrt(0.033 ** 2 - y ** 2) * 2, 0.003, 0.012]} />
              <meshStandardMaterial color="#27292b" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {SHELL.map(({ position, size }, index) => (
        <mesh key={index} position={position} receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#171719" roughness={0.92} />
        </mesh>
      ))}
      {instruments}
      {[-0.73, 0.73].map((x) => (
        <mesh key={x} position={[x, 1.02, -2.06]}>
          <boxGeometry args={[0.008, 0.006, 1.9]} />
          <meshStandardMaterial color="#bdcfe0" emissive="#94b6d6" emissiveIntensity={night ? 1.1 : 0.3} />
        </mesh>
      ))}
    </group>
  );
}
