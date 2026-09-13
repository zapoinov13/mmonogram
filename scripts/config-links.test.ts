import assert from "node:assert/strict";
import { CALIPER_FINISHES, DEFAULT_CONFIG, GRILLE_FINISHES, INTERIOR_FINISHES, PAINTS, RIM_DESIGNS, RIM_FINISHES, decodeConfig, encodeConfig } from "../src/components/configurator/config";

const choices = { paint: PAINTS, rim: RIM_DESIGNS, rimFinish: RIM_FINISHES, caliper: CALIPER_FINISHES, grille: GRILLE_FINISHES, interior: INTERIOR_FINISHES };
for (const [field, values] of Object.entries(choices)) {
  for (let index = 0; index < values.length; index++) {
    const config = { ...DEFAULT_CONFIG, [field]: index };
    assert.deepEqual(decodeConfig(encodeConfig(config)), config, `${field} ${index} survives sharing/reload`);
  }
}
for (const lights of [false, true]) {
  for (const night of [false, true]) {
    const config = { ...DEFAULT_CONFIG, lights, night };
    assert.deepEqual(decodeConfig(encodeConfig(config)), config);
  }
}
for (const input of [null, "", "invalid", "4-0-NaN", "4-0-1"]) assert.deepEqual(decodeConfig(input), DEFAULT_CONFIG);
console.log("Shared builds preserve every supported finish, wheel, interior and light/environment setting.");
