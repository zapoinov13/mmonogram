import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bytes = readFileSync(new URL("../public/models/instruments-original.glb", import.meta.url));
const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(8), bytes.length);
assert.ok(bytes.length < 250 * 1024, "Instrument assembly stays below 250 KiB");
assert.equal(model.meshes.length, 11, "Preserve original screen housing and both displays");
const screens = [];
for (const mesh of model.meshes) {
  for (const primitive of mesh.primitives) {
    const material = model.materials[primitive.material];
    if (!["cabinInstruments", "cabinInfotainment"].includes(material.name)) continue;
    screens.push(material.name);
    assert.notEqual(primitive.attributes.TEXCOORD_0, undefined, "Runtime display textures require UVs even without embedded images");
    const position = model.accessors[primitive.attributes.POSITION];
    const uv = model.accessors[primitive.attributes.TEXCOORD_0];
    assert.equal(uv.type, "VEC2");
    assert.equal(uv.count, position.count);
    assert.equal(position.count, 24, "Use original screen surfaces, not a new overlay");
  }
}
assert.deepEqual(screens.sort(), ["cabinInfotainment", "cabinInstruments"]);
const glass = model.materials.find((material: { name: string }) => material.name === "cabinScreenGlass");
assert.equal(glass.alphaMode, "BLEND", "Opaque cover would hide both screens");
assert.ok(glass.pbrMetallicRoughness.baseColorFactor[3] < 0.1);
console.log("Original instruments: both UV-mapped screens, transparent cover and size budget passed.");
