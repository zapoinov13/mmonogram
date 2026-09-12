import { useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { CALIPER_FINISHES, RIM_FINISHES } from "./config";

export interface ForgedWheelSpec {
  spokes: number;
  paired: boolean;
  aero: boolean;
  twist: number;
  spokeWidth: number;
}

export function getForgedWheelSpec(design: number): ForgedWheelSpec {
  return [
    { spokes: 8, paired: false, aero: false, twist: 0, spokeWidth: 0.072 },
    { spokes: 10, paired: true, aero: false, twist: 0, spokeWidth: 0.012 },
    { spokes: 10, paired: false, aero: false, twist: 0.18, spokeWidth: 0.052 },
    { spokes: 18, paired: false, aero: false, twist: 0.32, spokeWidth: 0.032 },
    { spokes: 12, paired: false, aero: true, twist: -0.12, spokeWidth: 0.028 },
  ][design] ?? { spokes: 12, paired: true, aero: false, twist: 0, spokeWidth: 0.026 };
}

const FRONT_WHEEL_X = 1.5;
const REAR_WHEEL_X = -1.34;
const WHEEL_Y = 0.23;
const WHEEL_Z = 0.88;

function createSpokeGeometry(width: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0.06, -width * 0.55);
  shape.lineTo(0.255, -width);
  shape.quadraticCurveTo(0.305, -width * 0.7, 0.315, -width * 0.18);
  shape.lineTo(0.315, width * 0.18);
  shape.quadraticCurveTo(0.305, width * 0.7, 0.255, width);
  shape.lineTo(0.06, width * 0.55);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.006,
    curveSegments: 4,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function ForgedWheel({
  position,
  design,
  finishIndex,
  caliperIndex,
}: {
  position: [number, number, number];
  design: number;
  finishIndex: number;
  caliperIndex: number;
}) {
  const spec = getForgedWheelSpec(design);
  const finish = RIM_FINISHES[finishIndex] ?? RIM_FINISHES[0];
  const caliper = CALIPER_FINISHES[caliperIndex] ?? CALIPER_FINISHES[0];
  const spokeGeometry = useMemo(() => createSpokeGeometry(spec.spokeWidth), [spec.spokeWidth]);
  const materials = useMemo(() => ({
    rim: new THREE.MeshPhysicalMaterial({
      color: finish.color,
      metalness: finish.metalness,
      roughness: Math.max(finish.roughness, 0.2),
      clearcoat: finish.id === "black" ? 0.85 : 0.28,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.72,
    }),
    barrel: new THREE.MeshStandardMaterial({ color: "#111316", metalness: 0.7, roughness: 0.34 }),
    brake: new THREE.MeshStandardMaterial({ color: "#9da2a6", metalness: 0.88, roughness: 0.4 }),
    brakeDark: new THREE.MeshStandardMaterial({ color: "#17191b", metalness: 0.45, roughness: 0.52 }),
    caliper: new THREE.MeshPhysicalMaterial({ color: caliper.color, metalness: 0.34, roughness: 0.3, clearcoat: 0.7 }),
  }), [caliper.color, finish]);

  useEffect(() => () => {
    spokeGeometry.dispose();
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials, spokeGeometry]);

  const spokeAngles = useMemo(() => {
    const angles: number[] = [];
    for (let index = 0; index < spec.spokes; index++) {
      const base = (index / spec.spokes) * Math.PI * 2;
      if (spec.paired) angles.push(base - 0.052, base + 0.052);
      else angles.push(base);
    }
    return angles;
  }, [spec.paired, spec.spokes]);

  return (
    <group position={position} rotation={[position[2] > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}>
      <mesh material={materials.barrel} position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[0.345, 0.345, 0.25, 64, 1, true]} />
      </mesh>
      <mesh material={materials.brakeDark} position={[0, 0.095, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.024, 48]} />
      </mesh>
      <mesh material={materials.brake} position={[0, 0.112, 0]}>
        <cylinderGeometry args={[0.245, 0.245, 0.018, 64]} />
      </mesh>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return (
          <mesh
            key={`vent-${index}`}
            material={materials.brakeDark}
            position={[Math.cos(angle) * 0.19, 0.126, Math.sin(angle) * 0.19]}
          >
            <cylinderGeometry args={[0.009, 0.009, 0.006, 8]} />
          </mesh>
        );
      })}
      <RoundedBox args={[0.09, 0.058, 0.16]} radius={0.022} smoothness={3} position={[0.2, 0.145, 0.065]} material={materials.caliper} />

      {spec.aero && (
        <mesh material={materials.rim} position={[0, 0.145, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.024, 64]} />
        </mesh>
      )}
      <mesh material={materials.rim} position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.325, 0.014, 16, 64]} />
      </mesh>
      <mesh material={materials.rim} position={[0, 0.178, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.102, 0.009, 12, 48]} />
      </mesh>
      {spokeAngles.map((angle, index) => (
        <mesh
          key={`spoke-${index}`}
          geometry={spokeGeometry}
          material={materials.rim}
          position={[0, 0.16, 0]}
          rotation={[0, angle + spec.twist, 0]}
        />
      ))}

      <mesh material={materials.rim} position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.092, 0.104, 0.05, 40]} />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh
            key={`lug-${index}`}
            material={materials.rim}
            position={[Math.cos(angle) * 0.06, 0.222, Math.sin(angle) * 0.06]}
          >
            <cylinderGeometry args={[0.012, 0.012, 0.018, 12]} />
          </mesh>
        );
      })}
      <mesh material={materials.brakeDark} position={[0, 0.226, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.018, 32]} />
      </mesh>
      <mesh material={materials.rim} position={[0, 0.239, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.039, 0.004, 10, 32]} />
      </mesh>
    </group>
  );
}

export default function ForgedWheelSet({
  design,
  finish,
  caliper,
}: {
  design: number;
  finish: number;
  caliper: number;
}) {
  return (
    <group>
      {[FRONT_WHEEL_X, REAR_WHEEL_X].flatMap((x) => [WHEEL_Z, -WHEEL_Z].map((z) => (
        <ForgedWheel
          key={`${x}-${z}`}
          position={[x, WHEEL_Y, z]}
          design={design}
          finishIndex={finish}
          caliperIndex={caliper}
        />
      )))}
    </group>
  );
}
