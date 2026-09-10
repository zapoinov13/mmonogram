import assert from "node:assert/strict";
import { goldSteeringRole } from "../src/components/configurator/goldInterior.ts";

for (const separator of ["", "."]) {
  assert.equal(goldSteeringRole(`\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c${separator}029`), "steeringBlack");
  assert.equal(goldSteeringRole(`\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c${separator}031`), "cabinAccent");
}
assert.equal(goldSteeringRole("_463_B_lenkr_voli_amgnap__L_0"), "cabinTrim");
assert.equal(goldSteeringRole("unrelated"), undefined);
console.log("Gold steering material mapping passed.");
