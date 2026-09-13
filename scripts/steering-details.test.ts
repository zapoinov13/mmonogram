import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { goldSteeringRole } from "../src/components/configurator/goldInterior";

assert.equal(goldSteeringRole("Плоскость031"), "steeringAccent", "wheel grips need their own leather response, not pale seat shading");
const buffer = readFileSync("public/models/steering-details.glb");
const gltf = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
assert.equal(gltf.extras.sourceParts.length, 25);
assert.equal(gltf.nodes.filter((node: {mesh?: number}) => node.mesh !== undefined).length, 26);
assert.deepEqual(gltf.extras.photoReconstructedParts, ["GoldPhoto_InnerTrimRing"]);
assert.ok(gltf.extras.ringTubeRadius < 0.0015, "ring must be a fine trim, not another wheel rim");
assert.ok(gltf.extras.sourceParts.some((name: string) => name.endsWith("3_mesh")), "original button and airbag surround required");
assert.ok(gltf.extras.sourceParts.some((name: string) => name.endsWith("3bc2e34")), "left paddle required");
assert.ok(gltf.extras.sourceParts.some((name: string) => name.endsWith("56ce40e")), "right paddle required");
assert.ok(!gltf.extras.sourceParts.some((name: string) => name.endsWith("__L_0")), "do not duplicate the custom wheel body");
assert.ok(buffer.length < 2 * 1024 * 1024, "steering details must stay below 2 MiB");
for (const node of gltf.nodes.filter((node: {mesh?: number}) => node.mesh !== undefined)) {
  for (const primitive of gltf.meshes[node.mesh].primitives) {
    const role = gltf.materials[primitive.material].name;
    assert.ok(["steeringBlack", "steeringMetal", "steeringMarking"].includes(role), "steering metals must not inherit the exterior grille finish");
    assert.ok(gltf.accessors[primitive.attributes.NORMAL].count > 0, "preserve original surface normals");
  }
}
console.log("Original steering surround, controls, paddles, independent materials and fine photo ring verified.");
