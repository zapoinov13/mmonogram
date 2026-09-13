import assert from "node:assert/strict";
import { createSpokeGeometry, getForgedWheelSpec } from "../src/components/configurator/ForgedWheelSet";
import { WHEEL_LIP } from "../src/components/configurator/wheelFitment";

const designs = Array.from({ length: 5 }, (_, index) => getForgedWheelSpec(index));

assert.equal(new Set(designs.map((design) => `${design.spokes}-${design.paired}-${design.aero}-${design.twist}`)).size, 5);
assert.ok(designs.every((design) => design.spokes >= 6), "every wheel needs a complete radial structure");
assert.equal(designs[1].paired, true, "MG.7 must use paired multi-spokes");
assert.equal(designs[4].aero, true, "MG.12 must include an aero face");
assert.ok(designs[0].spokeWidth <= 0.035, "monoblock spokes must leave visible openings, not form a flower-shaped plate");
const straight = createSpokeGeometry(0.02, 0).attributes.position;
const swept = createSpokeGeometry(0.02, 0.32).attributes.position;
assert.notDeepEqual(Array.from(straight.array), Array.from(swept.array), "turbine sweep must change the spoke geometry, not only rotate it");
const geometry = createSpokeGeometry(0.02, 0.32);
geometry.computeBoundingBox();
assert.ok(geometry.boundingBox!.max.y - geometry.boundingBox!.min.y > 0.04, "spokes need a dished 3D profile");
assert.ok(Array.from(geometry.attributes.position.array).every(Number.isFinite));
geometry.dispose();
for (const design of designs) {
  const spoke = createSpokeGeometry(design.spokeWidth, design.twist);
  const positions = spoke.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    assert.ok(Math.hypot(positions.getX(i), positions.getZ(i)) <= WHEEL_LIP.radius + WHEEL_LIP.tube, "spokes must not pass through the rim lip into the tire");
    assert.ok(positions.getY(i) + 0.137 <= WHEEL_LIP.depth + WHEEL_LIP.tube + 0.002, "spoke bevel must remain within the seated wheel face");
  }
  spoke.dispose();
}

console.log("All five forged-wheel designs have distinct geometry specs.");
