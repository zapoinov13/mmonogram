import assert from "node:assert/strict";
import { Vector3 } from "three";
import { anchorCabinCamera } from "../src/components/configurator/cabinCamera.ts";

const seat = new Vector3(-0.14, 1.4, -0.42);
for (const position of [new Vector3(3, 2, 0), new Vector3(-2, 0, 1), seat.clone()]) {
  const target = new Vector3(0.7, 1.2, -0.38);
  const direction = target.clone().sub(position);
  anchorCabinCamera(position, target, seat);
  assert.ok(position.distanceTo(seat) < 1e-10, "camera must stay at the seat");
  assert.ok(target.clone().sub(position).distanceTo(direction) < 1e-10, "look direction must be preserved");
  const previousTarget = target.clone();
  anchorCabinCamera(position, target, seat);
  assert.ok(target.equals(previousTarget), "idle frames must not drift");
}
console.log("Cabin camera: anchor, look direction and idle stability passed.");
