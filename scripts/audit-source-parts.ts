import { createRequire } from "node:module";
import { Box3, Matrix4, Vector3 } from "three";
import { goldCustomRole } from "../src/components/configurator/goldInterior";

// Run with an isolated glTF conversion toolchain, not production dependencies.
const r = createRequire(process.argv[2]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await r("draco3dgltf").createDecoderModule(),
});
for (const file of ["parts/custom-interior.glb", "interior-refined.glb"]) {
  const doc = await io.read(`public/models/${file}`);
  let mapped = 0;
  const unmapped = [];
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    if (goldCustomRole(node.getName())) { mapped++; continue; }
    const box = new Box3();
    for (const p of node.getMesh().listPrimitives()) {
      const a = p.getAttribute("POSITION");
      box.union(new Box3(new Vector3(...a.getMin([])), new Vector3(...a.getMax([])))
        .applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix())));
    }
    unmapped.push({ name: node.getName(), center: box.getCenter(new Vector3()).toArray().map(v => +v.toFixed(3)), size: box.getSize(new Vector3()).toArray().map(v => +v.toFixed(3)) });
  }
  console.log(JSON.stringify({ file, mapped, unmapped }, null, 2));
}
