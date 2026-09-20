import { createRequire } from "node:module";
import { statSync } from "node:fs";
import { Box3, BufferAttribute, BufferGeometry, Matrix4, Mesh, PropertyBinding, Vector3 } from "three";
import { computeFit, isDebris } from "../src/components/configurator/fitModel";
import { goldUpholsteryRole, isReplacedCadInteriorPart } from "../src/components/configurator/goldInterior";

const r = createRequire(process.argv[2]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const { copyToDocument, transformMesh, getBounds, prune, unpartition, weld, draco } = await import(r.resolve("@gltf-transform/functions"));
const codec = r("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await codec.createDecoderModule(),
  "draco3d.encoder": await codec.createEncoderModule(),
});
const body = await io.read("public/models/body-clean.glb");
const source = await io.read("public/models/parts/stock-body.glb");
const restored: string[] = [];
for (const node of body.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh?.listPrimitives().some(p => /maybach/i.test(p.getMaterial()?.getName() ?? ""))) continue;
  const original = source.getRoot().listNodes().find(n => n.getName() === node.getName());
  if (!original?.getMesh()) throw new Error(`Missing original body part ${node.getName()}`);
  const from = original.getMesh();
  const map = copyToDocument(body, source, [from]);
  const copy = map.get(from);
  // The FBX conversions use different local axes/units but the same assembly space.
  const relative = new Matrix4().fromArray(node.getWorldMatrix()).invert()
    .multiply(new Matrix4().fromArray(original.getWorldMatrix()));
  transformMesh(copy, relative.toArray());
  for (const p of copy.listPrimitives()) {
    for (const semantic of p.listSemantics()) {
      if (!["POSITION", "NORMAL"].includes(semantic)) p.setAttribute(semantic, null);
    }
  }
  node.setMesh(copy);
  restored.push(node.getName());
}
body.getRoot().setExtras({ restoredOriginalBodyParts: restored });
await body.transform(weld(), prune(), unpartition(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write("public/models/body-studio.glb", body);

const raw = getBounds(body.getRoot().listScenes()[0]);
const proxy = new Mesh(new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array([...raw.min, ...raw.max]), 3)));
const fit = computeFit(proxy);
const transform = new Matrix4().compose(fit.position, fit.quaternion, new Vector3().setScalar(fit.scale));
proxy.geometry.dispose();

for (const [input, output] of [["cad-interior-web.glb", "cabin-structure.glb"], ["interior-refined.glb", "cabin-upholstery.glb"]]) {
  const doc = await io.read(`public/models/${input}`);
  const roles = new Map();
  const kept: string[] = [];
  const removed: string[] = [];
  let triangles = 0;
  let zeroAreaTriangles = 0;
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const name = PropertyBinding.sanitizeNodeName(node.getName());
    let keep = !isReplacedCadInteriorPart(name);
    if (input === "interior-refined.glb") {
      const role = goldUpholsteryRole(name);
      const bounds = getBounds(node);
      const box = new Box3(new Vector3(...bounds.min), new Vector3(...bounds.max)).applyMatrix4(transform);
      const count = mesh.listPrimitives().reduce((sum, p) => sum + p.getIndices().getCount(), 0);
      const proxy = new Mesh(new BufferGeometry().setIndex(new BufferAttribute(new Uint32Array(count), 1)));
      keep = !!role && !isDebris(proxy, box);
      proxy.geometry.dispose();
      if (keep) {
        if (!roles.has(role)) roles.set(role, doc.createMaterial(role));
        for (const p of mesh.listPrimitives()) p.setMaterial(roles.get(role));
      }
    }
    if (!keep) { removed.push(node.getName()); node.setMesh(null); continue; }
    kept.push(node.getName());
    for (const p of mesh.listPrimitives()) {
      const indices = p.getIndices().getArray();
      const positions = p.getAttribute("POSITION").getArray();
      triangles += indices.length / 3;
      for (let i = 0; i < indices.length; i += 3) {
        a.fromArray(positions, indices[i] * 3);
        b.fromArray(positions, indices[i + 1] * 3).sub(a);
        c.fromArray(positions, indices[i + 2] * 3).sub(a);
        if (b.cross(c).lengthSq() <= 1e-20) zeroAreaTriangles++;
      }
    }
  }
  doc.getRoot().setExtras({ source: input, kept, removed, sourceTriangles: triangles, zeroAreaTriangles, simplified: false });
  await doc.transform(weld(), prune(), draco({ quantizePosition: 15, quantizeNormal: 10 }));
  await io.write(`public/models/${output}`, doc);
  console.log({ input, output, kept: kept.length, removed: removed.length, triangles,
    beforeMiB: statSync(`public/models/${input}`).size / 1048576,
    afterMiB: statSync(`public/models/${output}`).size / 1048576 });
}
console.log({ restoredBodyParts: restored, bodyMiB: statSync("public/models/body-studio.glb").size / 1048576 });

for (const [input, output] of [["dashboard-original.glb", "dashboard-studio.glb"]]) {
  const doc = await io.read(`public/models/${input}`);
  let beforeVertices = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    beforeVertices += p.getAttribute("POSITION").getCount();
    // These assemblies use solid role materials, not UV-mapped textures.
    for (const semantic of p.listSemantics()) if (!["POSITION", "NORMAL"].includes(semantic)) p.setAttribute(semantic, null);
  }
  await doc.transform(weld(), prune());
  let afterVertices = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) afterVertices += p.getAttribute("POSITION").getCount();
  doc.getRoot().setExtras({ ...doc.getRoot().getExtras(), source: input, beforeVertices, afterVertices, simplified: false });
  await doc.transform(draco({ quantizePosition: 16, quantizeNormal: 12 }));
  await io.write(`public/models/${output}`, doc);
  console.log({ input, output, beforeVertices, afterVertices, beforeMiB: statSync(`public/models/${input}`).size / 1048576, afterMiB: statSync(`public/models/${output}`).size / 1048576 });
}
