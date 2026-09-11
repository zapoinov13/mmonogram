import { createRequire } from "node:module";

// Pass the isolated geometry toolchain's package.json; no runtime dependencies.
const require = createRequire(process.argv[2]);
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS } = require("@gltf-transform/extensions");
const { copyToDocument, prune, unpartition, draco } = require("@gltf-transform/functions");
const codec = require("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await codec.createDecoderModule(),
  "draco3d.encoder": await codec.createEncoderModule(),
});
const target = await io.read("public/models/kit-refined.glb");
const source = await io.read("public/models/parts/body-kit-wheels.glb");
const names = ["chrome_V3.001", "grill__V3.2.4", "решетка рама малая.001", "решетка рама.001", "корпус диодов решетки"];
for (const name of names) {
  const from = source.getRoot().listNodes().find(n => n.getName() === name);
  const to = target.getRoot().listNodes().find(n => n.getName() === name);
  if (!from?.getMesh() || !to?.getMesh()) throw new Error(`Missing grille component: ${name}`);
  const mesh = from.getMesh();
  for (const primitive of mesh.listPrimitives()) {
    if (!primitive.getAttribute("NORMAL")) throw new Error(`Missing source normals: ${name}`);
    for (const semantic of primitive.listSemantics()) {
      if (semantic !== "POSITION" && semantic !== "NORMAL") primitive.setAttribute(semantic, null);
    }
  }
  const copied = copyToDocument(target, source, [mesh]);
  to.setMesh(copied.get(mesh));
}
await target.transform(prune(), unpartition(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write("public/models/kit-grille-refined.glb", target);
console.log("Restored five grille meshes and original normals without simplification.");
