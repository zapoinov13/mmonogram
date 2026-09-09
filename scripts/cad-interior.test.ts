import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAD_INTERIOR_URL, CAD_STEERING_CENTER_URL, CARS, DEFAULT_CAR, carFiles } from "../src/components/configurator/models.ts";

const car = CARS[DEFAULT_CAR];
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
try {
  for (const search of ["", "?cad=0", "?cad=false"]) {
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { search } } });
    assert.equal(carFiles(car), car.files, "existing cabin must remain the default");
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { search: "?cad=1&hq=1" } } });
  const preview = carFiles(car);
  assert.equal(preview.interior, CAD_INTERIOR_URL);
  assert.equal(preview.body, car.files.body, "CAD comparison must not load the heavy body");
  assert.equal(preview.steering, car.files.steering);
} finally {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
}

const bytes = readFileSync(new URL("../public" + CAD_INTERIOR_URL, import.meta.url));
const centerBytes = readFileSync(new URL("../public" + CAD_STEERING_CENTER_URL, import.meta.url));
assert.ok(centerBytes.length < 250_000, "steering pad must remain a small detail asset");
const center = JSON.parse(centerBytes.subarray(20, 20 + centerBytes.readUInt32LE(12)).toString());
assert.equal(center.meshes.length, 3, "original pad, center and emblem must be present");
assert.deepEqual(new Set(center.materials.map((m: { name: string }) => m.name)), new Set(["cabinLeather", "cabinMetal"]));
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
assert.ok(bytes.length < 8 * 1024 * 1024, "CAD cabin must fit its 8 MiB transfer budget");
const totalBytes = Object.values(car.files).reduce((sum, path) => (
  sum + readFileSync(new URL("../public" + path, import.meta.url)).length
), bytes.length + centerBytes.length);
assert.ok(totalBytes < 20 * 1024 * 1024, "complete CAD + custom trim assembly must stay below 20 MiB");
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const roles = new Set(["cabinFloor", "cabinRoof", "cabinLeather", "cabinAccent", "cabinTrim", "cabinMetal"]);
assert.deepEqual(new Set(gltf.materials.map((m: { name: string }) => m.name)), roles);
assert.ok(gltf.meshes.length <= 160, "merged CAD must stay within the draw-call budget");
let triangles = 0;
for (const mesh of gltf.meshes) {
  for (const primitive of mesh.primitives) {
    assert.ok(roles.has(gltf.materials[primitive.material].name));
    assert.ok(primitive.attributes.NORMAL !== undefined);
    assert.ok(primitive.extensions?.KHR_draco_mesh_compression);
    triangles += gltf.accessors[primitive.indices].count / 3;
  }
}
assert.ok(triangles > 100_000 && triangles < 1_500_000, "geometry budget");
console.log(`CAD comparison passed: ${gltf.meshes.length} meshes, ${triangles} triangles, ${(bytes.length / 1024 / 1024).toFixed(2)} MiB.`);
