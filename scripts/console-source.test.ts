import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";

type Primitive = { attributes: { POSITION: number }; indices: number };
type Model = {
  nodes: { name: string; mesh?: number; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[]; children?: number[] }[];
  meshes: { primitives: Primitive[] }[];
  materials: { name: string }[];
  accessors: { min: [number, number, number]; max: [number, number, number]; count: number }[];
  scene?: number;
  scenes: { nodes: number[] }[];
  extras: { removedDuplicateParts: string[]; trianglesBeforeCompression: number };
};

function readModel(name: string) {
  const bytes = readFileSync(new URL(`../public/models/${name}`, import.meta.url));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  return { bytes, model: JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) as Model };
}

const { model: old } = readModel("cad-interior-web.glb");
const { bytes, model: replacement } = readModel("console-original.glb");
const replaced = old.nodes.filter((node: { name: string }) => /^(ita_mi|miko_ob|miko_mi)_/.test(node.name));
assert.equal(replaced.length, 5, "Recheck replacement filtering when CAD assemblies change");
assert.ok(bytes.length < 3 * 1024 * 1024, "Console download must stay below 3 MiB");
assert.equal(replacement.meshes.length, 3, "Batch source details by leather, lacquer and metal");
assert.deepEqual(replacement.materials.map((material: { name: string }) => material.name).sort(), ["cabinLeather", "cabinMetal", "cabinTrim"]);
assert.deepEqual(replacement.extras.removedDuplicateParts.map((name) => name.split("blende__").pop()), ["_L_104.001", "_L_125.001"], "Only verified coincident front-panel copies are removed");
assert.equal(replacement.extras.trianglesBeforeCompression, 659398 - 2751 - 19407, "Only duplicate geometry is removed from the CAD source");

function bounds(model: Model, filter: (name: string) => boolean) {
  const result = new Box3();
  function visit(index: number, parent: Matrix4) {
    const node = model.nodes[index];
    const local = new Matrix4();
    if (node.matrix) local.fromArray(node.matrix);
    else {
      local.compose(
        new Vector3().fromArray(node.translation ?? [0, 0, 0]),
        new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
        new Vector3().fromArray(node.scale ?? [1, 1, 1]),
      );
    }
    const world = parent.clone().multiply(local);
    if (node.mesh !== undefined && filter(node.name)) {
      for (const primitive of model.meshes[node.mesh].primitives) {
        const position = model.accessors[primitive.attributes.POSITION];
        result.union(new Box3(new Vector3(...position.min), new Vector3(...position.max)).applyMatrix4(world));
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  }
  for (const index of model.scenes[model.scene ?? 0].nodes) visit(index, new Matrix4());
  assert.ok(!result.isEmpty());
  return result;
}
const before = bounds(old, (name) => /^(ita_mi|miko_ob|miko_mi)_/.test(name));
const after = bounds(replacement, () => true);
assert.ok(before.min.distanceTo(after.min) < 0.005, "Console minimum must match source placement within 5 mm");
assert.ok(before.max.distanceTo(after.max) < 0.005, "Console maximum must match source placement within 5 mm");
const triangles = replacement.meshes.reduce((total, mesh) => total + mesh.primitives.reduce((sum, primitive) => sum + replacement.accessors[primitive.indices].count / 3, 0), 0);
// Draco drops 93 degenerate triangles after the duplicate panels are removed.
assert.equal(triangles, 637147, "Do not silently decimate original console detail");
console.log(`Console source verified: ${triangles} triangles, ${(bytes.length / 1024 / 1024).toFixed(2)} MiB, aligned bounds`);
