import assert from "node:assert/strict";
import { getHeadlightAppearance } from "../src/components/configurator/headlights";

const off = getHeadlightAppearance(false);
const on = getHeadlightAppearance(true);

assert.equal(off.emissiveIntensity, 0, "switched-off lenses must not emit light");
assert.equal(off.beamIntensity, 0, "switched-off headlights must not illuminate the studio");
assert.ok(on.emissiveIntensity >= 4, "enabled lenses need enough emission to trigger bloom");
assert.ok(on.beamIntensity >= 35, "enabled headlights need visible beams on the studio floor");
assert.notEqual(on.lensColor, off.lensColor, "on and off lens colors must be visibly different");

console.log("Headlight on/off appearance is visibly distinct.");
