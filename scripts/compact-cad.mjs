import { createRequire } from "node:module";

// Optional package.json path allows using an isolated conversion toolchain.
const resolve = createRequire(process.argv[4] || import.meta.url);
const { NodeIO } = await import(resolve.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(resolve.resolve("@gltf-transform/extensions"));
const { weld, simplify, prune, draco } = await import(resolve.resolve("@gltf-transform/functions"));
const { default: draco3d } = await import(resolve.resolve("draco3dgltf"));
const { MeshoptSimplifier } = await import(resolve.resolve("meshoptimizer"));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
await MeshoptSimplifier.ready;
const doc = await io.read(process.argv[2]);
for (const mesh of doc.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    for (const semantic of primitive.listSemantics()) {
      if (!["POSITION", "NORMAL"].includes(semantic)) primitive.setAttribute(semantic, null);
    }
  }
}
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.6, error: 0.001 }),
  prune(),
  draco({ quantizePosition: 15, quantizeNormal: 10 }),
);
await io.write(process.argv[3], doc);
