import { createRequire } from "node:module";
import * as THREE from "three";

if (process.argv.length !== 5) throw new Error("Usage: node scripts/extract-steering-details.mjs source.glb output.glb /absolute/path/to/tools/package.json");
const r = createRequire(process.argv[4]);
const { NodeIO } = await import(r.resolve("@gltf-transform/core"));
const { ALL_EXTENSIONS } = await import(r.resolve("@gltf-transform/extensions"));
const { prune, draco } = await import(r.resolve("@gltf-transform/functions"));
const d = r("draco3dgltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await d.createDecoderModule(), "draco3d.encoder": await d.createEncoderModule() });
const doc = await io.read(process.argv[2]);
const roles = Object.fromEntries(["steeringBlack", "steeringMetal", "steeringMarking"].map(role => [role, doc.createMaterial(role)]));
const trim = ["3_mesh", "5_mesh", "__L_21_4_", "polyS_3bc2e34", "polyS_56ce40e", "___L_1_1_"];
const pad = ["polyS_9a095ca", "polySurface45"];
const sourceParts = [];
let triangles = 0;
for (const node of doc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  const name = node.getName();
  let role;
  if (name.includes("_lenkr_voli_amgnap")) {
    if (trim.some(suffix => name.endsWith(suffix))) role = "steeringMetal";
    if (pad.some(suffix => name.endsWith(suffix))) role = "steeringBlack";
  }
  if (name.includes("_lenkr_voli_bdf_amg_dtr") && !name.endsWith("1904b6c")) {
    role = /(?:744dc59|7e05a66)$/.test(name) ? "steeringMetal" : name.endsWith("9199d43") ? "steeringMarking" : "steeringBlack";
  }
  if (!role) { node.setMesh(null); continue; }
  sourceParts.push(name);
  for (const primitive of node.getMesh().listPrimitives()) {
    primitive.setMaterial(roles[role]);
    triangles += primitive.getIndices().getCount() / 3;
  }
}
if (sourceParts.length !== 25) throw new Error(`Expected 25 original steering details, got ${sourceParts.length}`);

// The thin D-shaped trim ring is visible in the Gold Package photo but absent
// from the CAD export. Its plane follows the source wheel, not the camera.
const path = new THREE.CurvePath();
const v = (x, y) => new THREE.Vector3(x, y, 0);
path.add(new THREE.CubicBezierCurve3(v(0, 0.122), v(0.068, 0.122), v(0.122, 0.069), v(0.122, 0)));
path.add(new THREE.CubicBezierCurve3(v(0.122, 0), v(0.122, -0.051), v(0.091, -0.105), v(0.053, -0.105)));
path.add(new THREE.LineCurve3(v(0.053, -0.105), v(-0.053, -0.105)));
path.add(new THREE.CubicBezierCurve3(v(-0.053, -0.105), v(-0.091, -0.105), v(-0.122, -0.051), v(-0.122, 0)));
path.add(new THREE.CubicBezierCurve3(v(-0.122, 0), v(-0.122, 0.069), v(-0.068, 0.122), v(0, 0.122)));
const geometry = new THREE.TubeGeometry(path, 192, 0.0011, 12, true);
const sourceFrame = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.8987903, 0.4383788), new THREE.Vector3(0, -0.4383788, 0.8987903));
sourceFrame.setPosition(0.394707, 1.10816 + 0.4383788 * 0.108, -1.286769 - 0.8987903 * 0.108);
geometry.applyMatrix4(sourceFrame);
const buffer = doc.getRoot().listBuffers()[0];
const primitive = doc.createPrimitive().setMaterial(roles.steeringMetal);
for (const [name, semantic] of [["position", "POSITION"], ["normal", "NORMAL"]]) {
  primitive.setAttribute(semantic, doc.createAccessor().setType("VEC3").setArray(geometry.getAttribute(name).array).setBuffer(buffer));
}
primitive.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer));
doc.getRoot().listScenes()[0].addChild(doc.createNode("GoldPhoto_InnerTrimRing").setMesh(doc.createMesh("GoldPhoto_InnerTrimRing").addPrimitive(primitive)));
doc.getRoot().setExtras({ sourceParts, sourceTriangles: triangles, photoReconstructedParts: ["GoldPhoto_InnerTrimRing"], ringTubeRadius: 0.0011 });
geometry.dispose();
await doc.transform(prune(), draco({ quantizePosition: 16, quantizeNormal: 12 }));
await io.write(process.argv[3], doc);
console.log({ sourceParts: sourceParts.length, sourceTriangles: triangles, output: process.argv[3] });
