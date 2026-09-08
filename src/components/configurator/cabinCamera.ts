import type { Vector3 } from "three";

/** Preserve the orbit's look direction without moving the viewer out of their seat. */
export function anchorCabinCamera(position: Vector3, target: Vector3, seat: Vector3) {
  target.sub(position).add(seat);
  position.copy(seat);
}
