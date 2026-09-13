import { createRequire } from "node:module";
if (process.argv.length !== 5) throw new Error("Usage: node scripts/extract-original-wheels.mjs source.glb output.glb /absolute/path/to/tools/package.json");
const r = createRequire(process.argv[4]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const { prune, draco } = await import(r.resolve("@gltf-transform/functions"));
const d = r("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await d.createDecoderModule(), "draco3d.encoder": await d.createEncoderModule() });
const doc = await io.read(process.argv[2]);
const dark = doc.createMaterial("wheel").setBaseColorFactor([0.015, 0.015, 0.015, 1]);
const accent = doc.createMaterial("wheelAccent");
const names = [];
let triangles = 0;
let degenerateTriangles = 0;
for (const node of doc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  if (!node.getName().includes("_5x130_")) { node.setMesh(null); continue; }
  names.push(node.getName());
  for (const p of node.getMesh().listPrimitives()) {
    triangles += p.getIndices().getCount() / 3;
    const positions = p.getAttribute("POSITION").getArray();
    const indices = p.getIndices().getArray();
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
      const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
      const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
      if (uy * vz - uz * vy === 0 && uz * vx - ux * vz === 0 && ux * vy - uy * vx === 0) degenerateTriangles++;
    }
    p.setMaterial(p.getMaterial()?.getName() === "Material.015" ? accent : dark);
  }
}
if (names.length !== 6 || triangles !== 958176) throw new Error(`Original wheel source changed: ${names.length} parts, ${triangles} triangles`);
doc.getRoot().setExtras({ sourceParts: names, trianglesBeforeCompression: triangles, sourceDegenerateTriangles: degenerateTriangles });
console.log({ triangles, degenerateTriangles });
await doc.transform(prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
