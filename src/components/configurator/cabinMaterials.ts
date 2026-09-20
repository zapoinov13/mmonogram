import { DoubleSide, MeshPhysicalMaterial } from "three";
import type { InteriorFinish } from "./config";

function leather(color: string) {
  const material = new MeshPhysicalMaterial({
    side: DoubleSide, color, metalness: 0, roughness: 0.64,
    envMapIntensity: 0.16, specularIntensity: 0.28,
  });
  // CAD surfaces have no UVs. Metric, continuous grain avoids stretched
  // patches and new texture downloads; subpixel detail fades with distance.
  material.customProgramCacheKey = () => "monogram-leather-grain-v1";
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 vLeatherPosition;\n${shader.vertexShader}`.replace(
      "#include <worldpos_vertex>",
      "#include <worldpos_vertex>\nvLeatherPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
    );
    shader.fragmentShader = `
      varying vec3 vLeatherPosition;
      float leatherHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float leatherNoise(vec3 p) {
        vec3 cell = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(leatherHash(cell), leatherHash(cell + vec3(1,0,0)), f.x),
              mix(leatherHash(cell + vec3(0,1,0)), leatherHash(cell + vec3(1,1,0)), f.x), f.y),
          mix(mix(leatherHash(cell + vec3(0,0,1)), leatherHash(cell + vec3(1,0,1)), f.x),
              mix(leatherHash(cell + vec3(0,1,1)), leatherHash(cell + vec3(1,1,1)), f.x), f.y), f.z);
      }
      ${shader.fragmentShader}`.replace("#include <normal_fragment_maps>", `
        #include <normal_fragment_maps>
        float grainVisibility = 1.0 - smoothstep(0.0007, 0.0025, length(fwidth(vLeatherPosition)));
        float grain = leatherNoise(vLeatherPosition * 850.0);
        float height = grain * 0.000045;
        vec3 dx = dFdx(-vViewPosition), dy = dFdy(-vViewPosition);
        vec3 rx = cross(dy, normal), ry = cross(normal, dx);
        float determinant = dot(dx, rx) * faceDirection;
        vec3 gradient = sign(determinant) * (dFdx(height) * rx + dFdy(height) * ry);
        normal = normalize(max(abs(determinant), 1e-12) * normal - gradient * grainVisibility);
        roughnessFactor = clamp(roughnessFactor + (grain - 0.5) * 0.08 * grainVisibility, 0.5, 0.85);
      `);
  };
  return material;
}

export function createCabinSurfaceMaterials(finish: InteriorFinish) {
  return {
    cabinLeather: leather(finish.primary),
    cabinAccent: leather(finish.accent),
    cabinTrim: new MeshPhysicalMaterial({
      side: DoubleSide, color: "#080809", metalness: 0.05, roughness: 0.2,
      clearcoat: 0.5, clearcoatRoughness: 0.16, specularIntensity: 0.5, envMapIntensity: 0.3,
    }),
  };
}
