import { createRequire } from "node:module";

const resolve = createRequire(process.argv[4]);
const { NodeIO } = await import(resolve.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(resolve.resolve("@gltf-transform/extensions"));
const { prune, draco } = await import(resolve.resolve("@gltf-transform/functions"));
const { default: draco3d } = await import(resolve.resolve("draco3dgltf"));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read(process.argv[2]);
const keep = new Set(["Плоскость.021", "Плоскость.078", "Куб.032", "Куб.034", "Плоскость.046", "Плоскость.047", "Плоскость.073", "чсы", "чсы.001", "чсы.002", "чсы.003"]);
let count = 0;
for (const node of doc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  if (!keep.has(node.getName())) node.setMesh(null);
  else count++;
}
if (count !== keep.size) throw new Error(`Expected ${keep.size} dashboard parts, got ${count}`);
await doc.transform(prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
console.log(`Exported ${count} original dashboard parts without decimation.`);
