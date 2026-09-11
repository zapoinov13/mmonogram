import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAD_BODY_URL, CAD_GRILLE_KIT_URL, hideReplacedGrilleFrame } from "../src/components/configurator/models.ts";

const frame = "решетка рама малая.002";
assert.equal(hideReplacedGrilleFrame(CAD_BODY_URL, frame, true), true);
assert.equal(hideReplacedGrilleFrame(CAD_BODY_URL, "решетка_рама_малая002", true), true);
assert.equal(hideReplacedGrilleFrame(CAD_BODY_URL, frame, false), false, "keep frame in stock/loading/error states");
assert.equal(hideReplacedGrilleFrame("/models/kit-refined.glb", frame, true), false);
assert.equal(hideReplacedGrilleFrame(CAD_BODY_URL, "решетка рама малая.001", true), false);
assert.equal(hideReplacedGrilleFrame(CAD_BODY_URL, "Group_10", true), false, "keep headlights");

function glb(path: string) {
  const bytes = readFileSync(new URL("../public" + path, import.meta.url));
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
const body = glb(CAD_BODY_URL);
const kit = glb("/models/kit-refined.glb");
const repaired = glb(CAD_GRILLE_KIT_URL);
assert.ok(readFileSync(new URL("../public" + CAD_GRILLE_KIT_URL, import.meta.url)).length < 5 * 1024 * 1024);
assert.deepEqual(repaired.nodes.map((n: { name: string }) => n.name), kit.nodes.map((n: { name: string }) => n.name));
for (let i = 0; i < kit.nodes.length; i++) {
  for (const key of ["translation", "rotation", "scale", "matrix"]) {
    assert.deepEqual(repaired.nodes[i][key], kit.nodes[i][key], "assembly transforms must remain unchanged");
  }
}
const source = glb("/models/parts/body-kit-wheels.glb");
for (const name of ["chrome_V3.001", "grill__V3.2.4", "решетка рама малая.001", "решетка рама.001", "корпус диодов решетки"]) {
  const restoredNode = repaired.nodes.find((n: { name: string }) => n.name === name);
  const originalNode = source.nodes.find((n: { name: string }) => n.name === name);
  const primitives = repaired.meshes[restoredNode.mesh].primitives;
  const originals = source.meshes[originalNode.mesh].primitives;
  assert.equal(primitives.length, originals.length);
  for (let i = 0; i < primitives.length; i++) {
    assert.ok(primitives[i].attributes.NORMAL !== undefined, "preserve source normals");
    assert.ok(primitives[i].extensions.KHR_draco_mesh_compression, "preserve web compression");
    // Draco may discard degenerate triangles, but the dense source must not be simplified.
    assert.ok(repaired.accessors[primitives[i].indices].count > source.accessors[originals[i].indices].count * 0.9);
  }
}
const duplicate = body.nodes.find((n: { name: string }) => n.name === frame);
const replacement = kit.nodes.find((n: { name: string }) => n.name === "решетка рама малая.001");
assert.ok(duplicate && replacement, "both source assemblies contain the grille frame");
const a = body.accessors[body.meshes[duplicate.mesh].primitives[0].attributes.POSITION];
const b = kit.accessors[kit.meshes[replacement.mesh].primitives[0].attributes.POSITION];
for (const key of ["min", "max"]) {
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[key][i] - b[key][i]) < 0.001, "frames overlap within 1 mm");
}
console.log("Grille overlap: exact duplicate masked; stock, loading and other parts preserved.");
