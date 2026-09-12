import assert from "node:assert/strict";
import { getForgedWheelSpec } from "../src/components/configurator/ForgedWheelSet";

const designs = Array.from({ length: 5 }, (_, index) => getForgedWheelSpec(index));

assert.equal(new Set(designs.map((design) => `${design.spokes}-${design.paired}-${design.aero}`)).size, 5);
assert.ok(designs.every((design) => design.spokes >= 6), "every wheel needs a complete radial structure");
assert.equal(designs[1].paired, true, "MG.7 must use paired multi-spokes");
assert.equal(designs[4].aero, true, "MG.12 must include an aero face");

console.log("All five forged-wheel designs have distinct geometry specs.");
