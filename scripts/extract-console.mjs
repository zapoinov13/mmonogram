import { createRequire } from "node:module";
import { createHash } from "node:crypto";

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
const metal = doc.createMaterial("cabinMetal").setBaseColorFactor([0.65, 0.5, 0.28, 1]).setMetallicFactor(0.82).setRoughnessFactor(0.48);
const groups = new Set();
const geometrySignatures = new Set();
const duplicates = [];
let triangles = 0;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const group = node.getName().match(/^_463_B_(ita_mi|miko_ob|miko_mi)_/)?.[1];
  if (!group) { node.setMesh(null); continue; }
  groups.add(group);
  // Only visually identified vent rings, turbine faces and panel edging are metal.
  const ventMetal = node.getName().startsWith("_463_B_ita_mi_blende_")
    && /__(?:13_mesh|7_mesh|3_mesh_2|5_mesh|9_mesh|19_mesh|_L_104(?:\.001)?)$/.test(node.getName());
  const material = node.getName().includes("_aaufl_") ? leather : ventMetal ? metal : trim;
  // The two front-panel parts have coincident CAD copies with reordered
  // vertices. Compare triangle content, normals and placement before removal.
  if (/_L_(104|125)(?:\.001)?$/.test(node.getName())) {
    const hash = createHash("sha256").update(JSON.stringify(node.getWorldMatrix())).update(material.getName());
    for (const primitive of mesh.listPrimitives()) {
      const semantics = primitive.listSemantics().sort();
      const count = primitive.getAttribute("POSITION").getCount();
      const vertices = Array.from({ length: count }, (_, index) => JSON.stringify(semantics.map((semantic) => primitive.getAttribute(semantic).getElement(index, []))));
      const indices = primitive.getIndices()?.getArray() ?? Array.from({ length: count }, (_, index) => index);
      const faces = [];
      for (let i = 0; i < indices.length; i += 3) {
        faces.push([vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]]].sort().join("|"));
      }
      hash.update(JSON.stringify(semantics)).update(faces.sort().join("\n"));
    }
    const signature = hash.digest("hex");
    if (geometrySignatures.has(signature)) {
      duplicates.push(node.getName());
      node.setMesh(null);
      continue;
    }
    geometrySignatures.add(signature);
  }
  for (const primitive of mesh.listPrimitives()) {
    triangles += (primitive.getIndices() ?? primitive.getAttribute("POSITION")).getCount() / 3;
    primitive.setMaterial(material);
  }
}
if (groups.size !== 3) throw new Error("Missing source console assembly");
doc.getRoot().setExtras({ sourceGroups: [...groups], removedDuplicateParts: duplicates, trianglesBeforeCompression: triangles });
await doc.transform(prune(), flatten(), join(), prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
console.log({ groups: [...groups], duplicates, triangles, meshes: doc.getRoot().listMeshes().length });
