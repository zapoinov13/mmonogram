import { createRequire } from "node:module";

if (process.argv.length !== 3) throw new Error("Usage: node scripts/finish-original-wheels.mjs /absolute/path/to/tools/package.json");
const require = createRequire(process.argv[2]);
const { NodeIO } = await import(require.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(require.resolve("@gltf-transform/extensions"));
const { compactPrimitive, prune, draco } = await import(require.resolve("@gltf-transform/functions"));
const codec = require("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await codec.createDecoderModule(),
  "draco3d.encoder": await codec.createEncoderModule(),
});
const doc = await io.read("public/models/wheels-original.glb");
const accent = doc.getRoot().listMaterials().find(material => material.getName() === "wheelAccent");
const blade = doc.createMaterial("wheelBlade").setBaseColorFactor([0.003, 0.003, 0.003, 1]);
const buffer = doc.getRoot().listBuffers()[0];
const turbineNames = new Set([
  "2F_4056_12x24_5x130_ET16_D84_1_Mersedes_Benz_G_Klasse_G63_w465_",
  "3F_4056_10x24_5x130_ET0_D84_1_Mersedes_Benz_G_Klasse_G63_w4.001",
]);
const finishRegions = [];
let sourceTriangles = 0;
let zeroAreaTriangles = 0;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute("POSITION");
    const normal = primitive.getAttribute("NORMAL");
    const indices = primitive.getIndices().getArray();
    const min = position.getMin([]), max = position.getMax([]);
    const centerY = (min[1] + max[1]) / 2, centerZ = (min[2] + max[2]) / 2;
    const turbine = turbineNames.has(node.getName());
    const darkIndices = [], accentIndices = [];
    let totalArea = 0, accentArea = 0, leftArea = 0, rightArea = 0;
    const points = [[], [], []], normals = [[], [], []];
    for (let i = 0; i < indices.length; i += 3) {
      for (let v = 0; v < 3; v++) {
        position.getElement(indices[i + v], points[v]);
        normal.getElement(indices[i + v], normals[v]);
      }
      const [a, b, c] = points;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const area = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
      sourceTriangles++;
      if (area < 1e-12) zeroAreaTriangles++;
      if (!turbine) continue;
      totalArea += area;
      const x = (a[0] + b[0] + c[0]) / 3;
      const radius = Math.hypot((a[1] + b[1] + c[1]) / 3 - centerY, (a[2] + b[2] + c[2]) / 3 - centerZ);
      const outward = Math.sign(x) * (normals[0][0] + normals[1][0] + normals[2][0]) / 3;
      // Only the existing forward-facing blade bevels, outside the black hub.
      // Axle coordinates and the two turbine meshes are fixed by this CAD export.
      const metal = radius > 0.057 && outward > 0.8;
      (metal ? accentIndices : darkIndices).push(indices[i], indices[i + 1], indices[i + 2]);
      if (metal) {
        accentArea += area;
        if (x < 0) leftArea += area;
        else rightArea += area;
      }
    }
    if (!turbine) continue;
    const metal = primitive.clone().setMaterial(accent);
    metal.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(accentIndices)).setBuffer(buffer));
    primitive.setMaterial(blade).setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(darkIndices)).setBuffer(buffer));
    mesh.addPrimitive(metal);
    compactPrimitive(primitive);
    compactPrimitive(metal);
    finishRegions.push({ name: node.getName(), accentFaces: accentIndices.length / 3, totalArea, accentArea, leftArea, rightArea });
  }
}
if (finishRegions.length !== 2) throw new Error("Source turbine meshes changed; inspect before exporting");
doc.getRoot().setExtras({ source: "wheels-original.glb", sourceTriangles, zeroAreaTriangles, simplified: false, finishRegions });
await doc.transform(prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write("public/models/wheels-finished.glb", doc);
console.log({ sourceTriangles, zeroAreaTriangles, finishRegions });
