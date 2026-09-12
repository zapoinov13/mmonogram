export interface HeadlightAppearance {
  lensColor: string;
  emissive: string;
  emissiveIntensity: number;
  beamIntensity: number;
  bloomIntensity: number;
}

/** Shared visual contract for the lenses, light rig and post-processing. */
export function getHeadlightAppearance(enabled: boolean): HeadlightAppearance {
  return enabled
    ? {
        lensColor: "#f7fbff",
        emissive: "#d9ecff",
        emissiveIntensity: 4.4,
        beamIntensity: 38,
        bloomIntensity: 0.26,
      }
    : {
        lensColor: "#121a20",
        emissive: "#000000",
        emissiveIntensity: 0,
        beamIntensity: 0,
        bloomIntensity: 0.11,
      };
}
