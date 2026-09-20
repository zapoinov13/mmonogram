import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, SIGNATURE_BUILDS, applySignatureBuild, matchSignatureBuild } from "../src/components/configurator/config";

const scene = readFileSync("src/components/configurator/Scene.tsx", "utf8");
assert.ok(!scene.includes('get("cad") === "1"'), "identical public/CAD assemblies must use identical cabin lighting");
assert.equal(matchSignatureBuild(DEFAULT_CONFIG)?.id, "gold", "default grille and wheels must form a complete Gold Package");
const page = readFileSync("src/pages/ConfiguratorPage.tsx", "utf8");
assert.ok(!page.includes("apply({ ...build.config, saved: config.saved }"), "changing metal package must preserve paint, cabin and lighting");
const custom = { ...DEFAULT_CONFIG, paint: 4, interior: 3, rim: 4, night: true, lights: false, saved: true };
for (const build of SIGNATURE_BUILDS) {
  const result = applySignatureBuild(custom, build);
  assert.deepEqual(result, { ...custom, grille: build.config.grille, rimFinish: build.config.rimFinish, saved: false });
  assert.equal(matchSignatureBuild(result)?.id, build.id);
}
assert.ok(scene.includes("!introDone.current && preset.eye"), "deep cabin links must not fly from outside through body panels");
assert.ok(page.includes('section !== "overview"'), "sharing and screenshots must retain the inspected view");
const boundary = readFileSync("src/components/configurator/SceneErrorBoundary.tsx", "utf8");
assert.ok(boundary.includes("this.props.onError?.()"), "scene failures must dismiss the loading cover");
assert.ok(page.includes("<SceneErrorBoundary onError={handleSceneReady}>"), "the retry screen must not remain behind StudioIntro");
const model = readFileSync("src/components/configurator/CarModel.tsx", "utf8");
assert.ok(model.includes("this.props.onError?.(error)"), "model failures must escape the projected 3D fallback");
assert.ok(scene.includes("onError={setModelError}") && scene.includes("if (modelError) throw modelError"), "network/decode failures must use the DOM error boundary, independent of camera position");
console.log("Studio lighting and package defaults are consistent.");
