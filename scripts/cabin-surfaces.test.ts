import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";
import { CAD_INTERIOR_URL } from "../src/components/configurator/models";

const read = (path: string) => {
  const bytes = readFileSync(path);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
};
const source = read("public/models/cabin-structure.glb");
const finished = read(`public${CAD_INTERIOR_URL}`);
assert.equal(finished.extras.finishSource, "cabin-structure.glb");
assert.equal(finished.extras.doorFinishes.length, 4, "Finish all four doors, not only the driver's door");
assert.equal(finished.extras.panelFinishes.length, 5);
for (const panel of finished.extras.panelFinishes) assert.ok(panel.accentFaces > 100, `${panel.name}: lower leather follows the selected cabin colour`);
for (const door of finished.extras.doorFinishes) {
  assert.ok(door.trimFaces > 100, `${door.name}: broad door inlays must be piano black`);
  assert.ok(door.speakerFaces > 100, `${door.name}: speaker mesh has its own dark finish`);
  assert.ok(door.metalFaces > 20, `${door.name}: retain the original metal hardware`);
}
const faces = (doc: typeof source) => doc.meshes.reduce((sum: number, mesh: { primitives: { indices: number }[] }) =>
  sum + mesh.primitives.reduce((n, p) => n + doc.accessors[p.indices].count / 3, 0), 0);
assert.equal(faces(finished), faces(source), "Material refinement must not remove or add cabin faces");
assert.deepEqual(finished.nodes.map((n: { name: string }) => n.name), source.nodes.map((n: { name: string }) => n.name));
function worldBounds(doc: typeof source, index: number) {
  const world = (id: number): Matrix4 => {
    const node = doc.nodes[id];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]),
    );
    const parent = doc.nodes.findIndex((n: { children?: number[] }) => n.children?.includes(id));
    return parent < 0 ? local : world(parent).multiply(local);
  };
  const box = new Box3(), matrix = world(index);
  for (const primitive of doc.meshes[doc.nodes[index].mesh].primitives) {
    const positions = doc.accessors[primitive.attributes.POSITION];
    box.union(new Box3(new Vector3(...positions.min), new Vector3(...positions.max)).applyMatrix4(matrix));
  }
  return box;
}
for (let i = 0; i < source.nodes.length; i++) {
  if (source.nodes[i].mesh === undefined) continue;
  const before = worldBounds(source, i), after = worldBounds(finished, i);
  assert.ok(before.min.distanceTo(after.min) < 0.0015 && before.max.distanceTo(after.max) < 0.0015,
    `${source.nodes[i].name}: keep source scale, placement and shape within compression tolerance`);
}
console.log("Four original door assemblies retain all geometry with separate lacquer, speaker and metal finishes.");
