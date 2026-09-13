import { createRequire } from "node:module";
if (process.argv.length !== 5) throw new Error("Usage: node scripts/extract-instruments.mjs source.glb output.glb /absolute/path/to/tools/package.json");
const r = createRequire(process.argv[4]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const { prune, draco } = await import(r.resolve("@gltf-transform/functions"));
const d = r("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await d.createDecoderModule(), "draco3d.encoder": await d.createEncoderModule() });
const doc = await io.read(process.argv[2]);
const trim = doc.createMaterial("cabinDisplay");
const glass = doc.createMaterial("cabinScreenGlass").setAlphaMode("BLEND").setBaseColorFactor([1, 1, 1, 0.06]);
const instruments = doc.createMaterial("cabinInstruments");
const infotainment = doc.createMaterial("cabinInfotainment");
let count = 0;
for (const node of doc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  if (!node.getName().startsWith("_463_B_ita_ob_display_")) node.setMesh(null);
  else {
    count++;
    const id = node.getName().split("dis_").pop();
    const screen = id === "3b50181" || id === "5fcd8ec";
    const material = id === "45c4a46" ? glass : id === "3b50181" ? instruments : id === "5fcd8ec" ? infotainment : trim;
    for (const primitive of node.getMesh().listPrimitives()) {
      primitive.setMaterial(material);
      if (!screen) continue;
      const positions = primitive.getAttribute("POSITION");
      const matrix = node.getWorldMatrix();
      const points = Array.from({ length: positions.getCount() }, (_, i) => {
        const [x, y, z] = positions.getElement(i, []);
        return [matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12], matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]];
      });
      const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
      const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
      if (maxX <= minX || maxY <= minY) throw new Error(`Invalid screen bounds: ${id}`);
      const uv = new Float32Array(points.flatMap(([x, y]) => [1 - (x - minX) / (maxX - minX), (y - minY) / (maxY - minY)]));
      primitive.setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(uv).setBuffer(doc.getRoot().listBuffers()[0]));
    }
  }
}
if (count !== 11) throw new Error(`Expected 11 original instrument parts, got ${count}`);
await doc.transform(prune({ keepAttributes: true }), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
