import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const model = readFileSync("src/components/configurator/CarModel.tsx", "utf8");
const parts = readFileSync("src/components/configurator/GClassGLTF.tsx", "utf8");
assert.ok(!model.includes("<GClassModel"), "A failed request must never substitute a different car");
assert.ok(model.includes('role="alert"') && model.includes("Reload model"), "Failed loading must offer an accessible retry");
assert.ok(!parts.includes("OptionalBoundary"), "Required cabin parts must not silently disappear on error");
assert.ok(model.includes("<SceneLoader"), "Loading must not reveal a partially assembled car");
console.log("Model loading: complete assembly or explicit retry, never a substitute car.");
