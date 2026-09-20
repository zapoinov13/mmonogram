import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";
import { CAD_BODY_URL, CAD_INTERIOR_URL, CAD_UPHOLSTERY_URL, CAD_WHEELS_URL, CARS, DEFAULT_CAR, assemblyAssets, carFiles, modelAssetUrl } from "../src/components/configurator/models";
import { goldUpholsteryRole, isReplacedCadInteriorPart } from "../src/components/configurator/goldInterior";

const read = (url: string) => {
  const bytes = readFileSync(`public${url}`);
  return { bytes, gltf: JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) };
};
const files = carFiles(CARS[DEFAULT_CAR], "");
assert.deepEqual(files, carFiles(CARS[DEFAULT_CAR], "?cad=1"));
const assets = assemblyAssets(files, true);
assert.equal(assets.length, 10);
assert.equal(assets.length, new Set(assets).size);
assert.ok(assets.includes(CAD_UPHOLSTERY_URL));
assert.ok(!assemblyAssets(files, false).includes(CAD_WHEELS_URL), "alternative wheels must not preload hidden originals");
const total = assets.reduce((sum, url) => sum + read(url).bytes.length, 0);
assert.ok(total < 23 * 1048576, "actual public assembly, including every interior add-on, must fit 23 MiB");
for (const url of assets) assert.ok(modelAssetUrl(url).startsWith(`${url}?v=`));

for (const url of [CAD_INTERIOR_URL, CAD_UPHOLSTERY_URL]) {
  const { gltf } = read(url);
  assert.equal(gltf.extras.simplified, false);
  assert.equal(gltf.extras.kept.length + gltf.extras.removed.length, url === CAD_INTERIOR_URL ? 64 : 132);
  assert.equal(gltf.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined).length, gltf.extras.kept.length);
  for (const node of gltf.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined)) {
    assert.ok(!isReplacedCadInteriorPart(node.name));
    if (url === CAD_UPHOLSTERY_URL) assert.ok(goldUpholsteryRole(node.name));
  }
  let triangles = 0;
  for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
    triangles += gltf.accessors[p.indices].count / 3;
    assert.ok(p.attributes.NORMAL !== undefined);
  }
  assert.ok(triangles >= gltf.extras.sourceTriangles - gltf.extras.zeroAreaTriangles, "preserve every non-degenerate source face");
}
const { gltf: body } = read(CAD_BODY_URL);
assert.equal(body.extras.restoredOriginalBodyParts.length, 14);
assert.ok(body.extras.restoredOriginalBodyParts.includes("Group_26.002"));
type BoundsDocument = {
  nodes: Array<{ name?: string; mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }>;
  meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>;
  accessors: Array<{ min: number[]; max: number[] }>;
};
function partBounds(doc: BoundsDocument, name: string) {
  const index = doc.nodes.findIndex(node => node.name === name);
  assert.ok(index >= 0, `missing body node ${name}`);
  const world = (id: number): Matrix4 => {
    const node = doc.nodes[id];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]),
    );
    const parent = doc.nodes.findIndex(node => node.children?.includes(id));
    return parent < 0 ? local : world(parent).multiply(local);
  };
  const mesh = doc.nodes[index].mesh;
  assert.notEqual(mesh, undefined);
  const box = new Box3();
  for (const p of doc.meshes[mesh!].primitives) {
    const accessor = doc.accessors[p.attributes.POSITION];
    box.union(new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)).applyMatrix4(world(index)));
  }
  return box;
}
const { gltf: sourceBody } = read("/models/parts/stock-body.glb");
for (const name of body.extras.restoredOriginalBodyParts) {
  const before = partBounds(sourceBody, name);
  const after = partBounds(body, name);
  assert.ok(before.min.distanceTo(after.min) < 0.002 && before.max.distanceTo(after.max) < 0.002,
    `${name}: original shape must retain its assembled position and scale`);
}
console.log(`Actual complete public model payload: ${(total / 1048576).toFixed(2)} MiB; no omitted cabin add-ons.`);
