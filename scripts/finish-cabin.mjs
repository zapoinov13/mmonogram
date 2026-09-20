import { createRequire } from "node:module";
import { Box3, Matrix4, Vector3 } from "three";

if (process.argv.length !== 3) throw new Error("Usage: node scripts/finish-cabin.mjs /absolute/path/to/tools/package.json");
const r = createRequire(process.argv[2]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const { compactPrimitive, prune, draco } = await import(r.resolve("@gltf-transform/functions"));
const codec = r("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await codec.createDecoderModule(),
  "draco3d.encoder": await codec.createEncoderModule(),
});
const doc = await io.read("public/models/cabin-structure.glb");
const roles = new Map(doc.getRoot().listMaterials().map(m => [m.getName(), m]));
roles.set("cabinSpeaker", doc.createMaterial("cabinSpeaker"));
const buffer = doc.getRoot().listBuffers()[0];
const doorFinishes = [];
const panelFinishes = [];
for (const node of doc.getRoot().listNodes()) {
  const doorMetal = /^tuer_(voli|vore|hili|hire)_cabinMetal$/.test(node.getName());
  const doorLeather = /^tuer_(voli|vore|hili|hire)_cabinLeather$/.test(node.getName());
  const lowerDash = node.getName() === "ita_ob_cabinLeather";
  if (!doorMetal && !doorLeather && !lowerDash) continue;
  const mesh = node.getMesh();
  const matrix = new Matrix4().fromArray(node.getWorldMatrix());
  const counts = { name: node.getName(), trimFaces: 0, speakerFaces: 0, metalFaces: 0 };
  let accentFaces = 0;
  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute("POSITION"), indices = primitive.getIndices().getArray();
    const parent = Array.from({ length: position.getCount() }, (_, i) => i);
    const root = i => parent[i] === i ? i : (parent[i] = root(parent[i]));
    const link = (a, b) => { parent[root(a)] = root(b); };
    const points = [], welded = new Map();
    // Join coincident CAD vertices for connectivity only. Render normals and
    // positions remain untouched, including the original sharp edges.
    for (let i = 0; i < position.getCount(); i++) {
      const point = new Vector3().fromArray(position.getElement(i, [])).applyMatrix4(matrix);
      points.push(point);
      const key = point.toArray().map(v => Math.round(v * 100000)).join(",");
      if (welded.has(key)) link(i, welded.get(key));
      else welded.set(key, i);
    }
    for (let i = 0; i < indices.length; i += 3) { link(indices[i], indices[i + 1]); link(indices[i], indices[i + 2]); }
    const components = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      const key = root(indices[i]);
      if (!components.has(key)) components.set(key, { box: new Box3(), faces: [] });
      const component = components.get(key);
      for (let j = 0; j < 3; j++) { component.box.expandByPoint(points[indices[i + j]]); component.faces.push(indices[i + j]); }
    }
    const groups = { cabinTrim: [], cabinSpeaker: [], cabinMetal: [], cabinAccent: [], cabinLeather: [] };
    for (const { box, faces } of components.values()) {
      const size = box.getSize(new Vector3());
      // This source groups the lacquer inlays, speaker grilles and pull
      // hardware under one metal role. Split complete components, never
      // individual faces along an arbitrary colour boundary.
      const strap = size.z > 0.13 && size.z < 0.16 && size.y > 0.07 && size.y < 0.09;
      let role;
      if (doorMetal) {
        role = faces.length > 7500 && size.x < 0.04 && size.z < 0.3
          ? "cabinSpeaker" : size.z > 0.27 ? "cabinTrim" : strap ? "cabinAccent" : "cabinMetal";
      } else {
        const doorSkin = doorLeather && size.z > 0.32 && box.min.y < 1.02 && box.max.y > 0.8 && box.max.y < 1.15;
        const dashSkin = lowerDash && size.x > 0.35 && box.min.y > 0.7 && box.max.y > 0.95 && box.max.y < 1.105;
        role = doorSkin || dashSkin ? "cabinAccent" : "cabinLeather";
      }
      groups[role].push(...faces);
      if (role === "cabinAccent") accentFaces += faces.length / 3;
      else if (doorMetal) counts[role === "cabinTrim" ? "trimFaces" : role === "cabinSpeaker" ? "speakerFaces" : "metalFaces"] += faces.length / 3;
    }
    mesh.removePrimitive(primitive);
    for (const [role, faces] of Object.entries(groups)) {
      if (!faces.length) continue;
      const part = primitive.clone().setMaterial(roles.get(role));
      part.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(faces)).setBuffer(buffer));
      compactPrimitive(part);
      mesh.addPrimitive(part);
    }
  }
  if (doorMetal) doorFinishes.push(counts);
  else panelFinishes.push({ name: node.getName(), accentFaces });
}
if (doorFinishes.length !== 4) throw new Error("Expected four original door assemblies");
doc.getRoot().setExtras({ ...doc.getRoot().getExtras(), finishSource: "cabin-structure.glb", doorFinishes, panelFinishes });
await doc.transform(prune(), draco({ quantizePosition: 15, quantizeNormal: 10 }));
await io.write("public/models/cabin-tailored.glb", doc);
console.log({ doorFinishes, panelFinishes });
