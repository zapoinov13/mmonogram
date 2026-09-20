import assert from "node:assert/strict";
import { RIM_FINISHES } from "../src/components/configurator/config";
import { createCabinMetalMaterials, createOriginalWheelMaterials } from "../src/components/configurator/finishMaterials";

const cabin = createCabinMetalMaterials();
assert.equal(cabin.cabinMetal.color.getHexString(), "cfb77e");
assert.equal(cabin.steeringMetal.color.getHexString(), cabin.cabinMetal.color.getHexString());
assert.ok(cabin.cabinMetal.roughness > cabin.steeringMetal.roughness, "Broad cabin trim is satin; thin steering rings stay polished");
for (const finish of RIM_FINISHES) {
  const { wheel, wheelAccent, wheelBlade } = createOriginalWheelMaterials(finish);
  assert.equal(wheel.color.getHexString(), "0a0a0b", "Source dish and blade flanks must remain black");
  assert.equal(wheelAccent.color.getHexString(), finish.color.slice(1));
  assert.ok(wheel.metalness <= 0.25, "Black lacquer must not reflect like bare machined metal");
  assert.ok(wheelAccent.roughness >= 0.28, "Fine turbine edges need stable highlights");
  assert.ok(wheelBlade.specularIntensity < wheel.specularIntensity, "Black blade flanks must not wash out the fine metal edges");
  wheel.dispose();
  wheelAccent.dispose();
  wheelBlade.dispose();
}
Object.values(cabin).forEach(material => material.dispose());
console.log("Original wheel and independent Gold cabin material responses verified.");
