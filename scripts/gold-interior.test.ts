import assert from "node:assert/strict";
import { PropertyBinding } from "three";
import { goldCustomRole } from "../src/components/configurator/goldInterior.ts";

const plane = "\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c";
for (const id of ["012", "015", "032", "040", "044", "049", "050", "052", "108", "112"]) {
  for (const name of [`${plane}.${id}`, PropertyBinding.sanitizeNodeName(`${plane}.${id}`)]) {
    assert.equal(goldCustomRole(name), "cabinLeather", `${name}: black insert`);
  }
}
for (const id of ["016", "033", "043", "053", "072", "111"]) {
  assert.equal(goldCustomRole(`${plane}${id}`), "cabinAccent", "cognac shell");
}
assert.equal(goldCustomRole("unknown"), undefined, "unknown geometry retains existing classification");
for (const [name, role] of [["чсы", "cabinMetal"], ["чсы.001", "cabinClockGlass"], ["чсы.002", "cabinMetal"], ["чсы.003", "cabinClock"]]) {
  assert.equal(goldCustomRole(name), role, `${name}: original clock component`);
  assert.equal(goldCustomRole(PropertyBinding.sanitizeNodeName(name)), role, `${name}: normalized clock component`);
}
console.log("Gold Package: black inserts, cognac shells and GLTF-normalized names passed.");
