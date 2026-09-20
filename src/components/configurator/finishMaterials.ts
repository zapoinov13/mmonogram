import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { RimFinish } from "./config";

/** Shared by the live assembly and its rendered option thumbnails. */
export function createOriginalWheelMaterials(finish: RimFinish) {
  return {
    wheel: new MeshPhysicalMaterial({
      color: "#0a0a0b",
      metalness: 0.18,
      roughness: 0.36,
      envMapIntensity: 0.25,
      clearcoat: 0.3,
      clearcoatRoughness: 0.24,
    }),
    wheelAccent: new MeshStandardMaterial({
      color: finish.color,
      metalness: finish.metalness,
      roughness: Math.max(finish.roughness, 0.28),
    }),
    wheelBlade: new MeshPhysicalMaterial({
      color: "#080809", metalness: 0.1, roughness: 0.42,
      envMapIntensity: 0.15, specularIntensity: 0.3,
      clearcoat: 0.1, clearcoatRoughness: 0.3,
    }),
  };
}

/** The reference cabin's champagne metal does not follow exterior packages. */
export function createCabinMetalMaterials() {
  return {
    steeringMetal: new MeshStandardMaterial({
      color: "#cfb77e", metalness: 0.85, roughness: 0.28, envMapIntensity: 0.5,
    }),
    cabinMetal: new MeshStandardMaterial({
      side: DoubleSide,
      color: "#cfb77e", metalness: 0.82, roughness: 0.48, envMapIntensity: 0.3,
    }),
  };
}
