import { createRequire } from "node:module";

if (process.argv.length !== 5) {
  throw new Error("Usage: node scripts/extract-console.mjs source.glb output.glb /absolute/path/to/tools/package.json");
}
const resolve = createRequire(process.argv[4]);
const { NodeIO } = await import(resolve.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(resolve.resolve("@gltf-transform/extensions"));
const { flatten, join, prune, draco } = await import(resolve.resolve("@gltf-transform/functions"));
const { default: draco3d } = await import(resolve.resolve("draco3dgltf"));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read(process.argv[2]);
const trim = doc.createMaterial("cabinTrim").setBaseColorFactor([0.02, 0.02, 0.02, 1]).setRoughnessFactor(0.28);
const leather = doc.createMaterial("cabinLeather").setBaseColorFactor([0.08, 0.06, 0.05, 1]).setRoughnessFactor(0.78);
const groups = new Set();
let triangles = 0;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const group = node.getName().match(/^_463_B_(ita_mi|miko_ob|miko_mi)_/)?.[1];
  if (!group) { node.setMesh(null); continue; }
  groups.add(group);
  for (const primitive of mesh.listPrimitives()) {
    triangles += (primitive.getIndices() ?? primitive.getAttribute("POSITION")).getCount() / 3;
    primitive.setMaterial(node.getName().includes("_aaufl_") ? leather : trim);
  }
}
if (groups.size !== 3) throw new Error("Missing source console assembly");
await doc.transform(prune(), flatten(), join(), prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
console.log({ groups: [...groups], triangles, meshes: doc.getRoot().listMeshes().length });
