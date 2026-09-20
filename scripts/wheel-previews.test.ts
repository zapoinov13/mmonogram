import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { RIM_DESIGNS, RIM_FINISHES } from "../src/components/configurator/config";

const images = new Set<string>();
let bytes = 0;
for (const design of RIM_DESIGNS) {
  for (const finish of RIM_FINISHES) {
    const file = readFileSync(`public/images/wheels/${design.id}-${finish.id}.webp`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 384);
    assert.equal(metadata.height, 384);
    assert.equal(metadata.format, "webp");
    const pixels = await sharp(file).stats();
    assert.ok(pixels.channels.slice(0, 3).every(channel => channel.stdev > 15), "Wheel render must contain visible geometry, not a blank canvas");
    images.add(file.toString("base64"));
    bytes += file.length;
  }
}
assert.equal(images.size, 25, "every wheel and finish must have its own actual render");
assert.ok(bytes < 1024 * 1024, "the complete preview catalogue must stay under 1 MiB");
const page = readFileSync("src/pages/ConfiguratorPage.tsx", "utf8");
assert.ok(!page.includes("function WheelDesignChip"), "do not restore schematic wheel icons");
assert.ok(page.includes(".webp?v=20260920-finish"), "Updated material previews must not reuse cached old thumbnails");
console.log(`25 distinct wheel previews verified (${Math.round(bytes / 1024)} KiB total).`);
