import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAD_WHEELS_URL } from "../src/components/configurator/models";

const read = (file: string) => {
  const bytes = readFileSync(file);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
};
assert.equal(CAD_WHEELS_URL, "/models/wheels-finished.glb", "Public original wheels need separate turbine-edge materials");
const source = read("public/models/wheels-original.glb");
const result = read(`public${CAD_WHEELS_URL}`);
assert.equal(result.meshes.length, source.meshes.length);
assert.equal(result.extras.simplified, false);
assert.equal(result.extras.finishRegions.length, 2, "Only the two original turbine pairs are repartitioned");
for (const region of result.extras.finishRegions) {
  assert.ok(region.accentFaces > 1000);
  assert.ok(region.accentArea / region.totalArea > 0.02 && region.accentArea / region.totalArea < 0.3,
    "Accent only the narrow blade edges, not the complete turbine");
  assert.ok(Math.abs(region.leftArea - region.rightArea) / region.accentArea < 0.03,
    "Mirrored faces must receive matching finishes");
}
let triangles = 0;
for (const mesh of result.meshes) {
  for (const p of mesh.primitives) {
    triangles += result.accessors[p.indices].count / 3;
    assert.ok(p.attributes.NORMAL !== undefined);
    assert.ok(["wheel", "wheelBlade", "wheelAccent"].includes(result.materials[p.material].name));
  }
}
assert.ok(triangles >= result.extras.sourceTriangles - result.extras.zeroAreaTriangles);
assert.ok(triangles <= result.extras.sourceTriangles);
for (const node of source.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined)) {
  const target = result.nodes.find((n: { name: string }) => n.name === node.name);
  assert.ok(target);
  assert.deepEqual(target.translation, node.translation);
  const bounds = (doc: typeof source, id: number) => {
    const positions = doc.meshes[id].primitives.map((p: { attributes: { POSITION: number } }) => doc.accessors[p.attributes.POSITION]);
    return [0, 1, 2].flatMap(axis => [Math.min(...positions.map((a: { min: number[] }) => a.min[axis])), Math.max(...positions.map((a: { max: number[] }) => a.max[axis]))]);
  };
  const before = bounds(source, node.mesh), after = bounds(result, target.mesh);
  before.forEach((value, i) => assert.ok(Math.abs(value - after[i]) < 0.0002, `${node.name}: material partition must not change wheel fitment`));
}
console.log("Original wheel finish: matched mirrored edges, black dish, unchanged source fitment.");
