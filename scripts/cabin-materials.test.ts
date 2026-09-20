import assert from "node:assert/strict";
import { ShaderLib, type WebGLRenderer } from "three";
import { INTERIOR_FINISHES } from "../src/components/configurator/config";
import { createCabinSurfaceMaterials } from "../src/components/configurator/cabinMaterials";

for (const finish of INTERIOR_FINISHES) {
  const materials = createCabinSurfaceMaterials(finish);
  assert.equal(materials.cabinLeather.color.getHexString(), finish.primary.slice(1));
  assert.equal(materials.cabinAccent.color.getHexString(), finish.accent.slice(1));
  assert.equal(materials.cabinLeather.clearcoat, 0, "Leather is not lacquer");
  assert.ok(materials.cabinTrim.clearcoat > 0.3);
  assert.ok(materials.cabinLeather.specularIntensity < 0.4, "Leather must not wash out to grey");
  assert.ok(materials.cabinTrim.roughness < materials.cabinLeather.roughness);
  for (const material of [materials.cabinLeather, materials.cabinAccent]) {
    const shader = { ...ShaderLib.physical, uniforms: {} };
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    assert.ok(shader.vertexShader.includes("vLeatherPosition = (modelMatrix"));
    assert.ok(shader.fragmentShader.includes("fwidth(vLeatherPosition)"), "Subpixel grain must fade to prevent shimmer");
    assert.ok(shader.fragmentShader.includes("#include <normal_fragment_maps>"), "Keep Three's normal path");
  }
  Object.values(materials).forEach(material => material.dispose());
}
console.log("Leather grain, selected upholstery colours and piano lacquer are distinct and stable.");
