import * as THREE from "three";
import type { Fit } from "./fitModel";

export const WHEEL_LIP = { radius: 0.325, tube: 0.014, depth: 0.175 } as const;

export interface WheelFitment {
  position: [number, number, number];
  radialScale: number;
  barrelDepth: number;
}

/** Fit the replacement to the original rim seat, not to the tire's widest bulge. */
export function fitWheelToTire(tire: THREE.Box3, rim: THREE.Box3, side: 1 | -1): WheelFitment {
  if (tire.isEmpty() || rim.isEmpty()) throw new Error("Missing source wheel geometry");
  const center = tire.getCenter(new THREE.Vector3());
  const tireSize = tire.getSize(new THREE.Vector3());
  const rimSize = rim.getSize(new THREE.Vector3());
  const radius = Math.max(rimSize.x, rimSize.y) / 2;
  const outerSidewall = side > 0 ? tire.max.z : -tire.min.z;
  const originalLip = side > 0 ? rim.max.z : -rim.min.z;
  const lipSurface = Math.min(originalLip, outerSidewall - 0.003);
  const origin = lipSurface - WHEEL_LIP.depth - WHEEL_LIP.tube;
  const innerSidewall = side > 0 ? tire.min.z : -tire.max.z;
  return {
    position: [center.x, center.y, side * origin],
    radialScale: radius / (WHEEL_LIP.radius + WHEEL_LIP.tube),
    barrelDepth: Math.min(tireSize.z - 0.024, origin + WHEEL_LIP.depth - innerSidewall - 0.008),
  };
}

/** Source exports contain a pair of tires / rim faces per axle in each mesh. */
export function measureWheelFitments(scene: THREE.Object3D, fit: Fit): WheelFitment[] {
  const bounds = Array.from({ length: 4 }, () => ({ tire: new THREE.Box3(), rim: new THREE.Box3() }));
  const transform = new THREE.Matrix4().compose(fit.position, fit.quaternion, new THREE.Vector3().setScalar(fit.scale));
  const point = new THREE.Vector3();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const name = object.name.replace(/[._\s]/g, "");
    const tire = /^wheelFR00[34]$/.test(name);
    const rim = /^(?:3F.*w4005|2F.*w003)$/.test(name);
    if (!tire && !rim) return;
    const matrix = new THREE.Matrix4().multiplyMatrices(transform, object.matrixWorld);
    const positions = object.geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
      const index = (point.x > 0 ? 0 : 2) + (point.z > 0 ? 0 : 1);
      bounds[index][tire ? "tire" : "rim"].expandByPoint(point);
    }
  });
  return bounds.map(({ tire, rim }, index) => fitWheelToTire(tire, rim, index % 2 === 0 ? 1 : -1));
}
