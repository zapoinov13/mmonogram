import assert from "node:assert/strict";
import * as THREE from "three";
import { fitWheelToTire, measureWheelFitments, WHEEL_LIP } from "../src/components/configurator/wheelFitment";

// Measured fitted bounds of the front/rear source tires and original rim faces.
const axles = [
  { x: 1.501018, y: 0.232233, inner: 0.724407, outer: 1.003615, rimOuter: 1.000628, rimRadius: 0.320656 },
  { x: -1.338691, y: 0.232155, inner: 0.671155, outer: 1.00185, rimOuter: 0.998901, rimRadius: 0.320713 },
];
const scene = new THREE.Group();
const expected: ReturnType<typeof fitWheelToTire>[] = [];
axles.forEach((axle, index) => {
  const pairs: Record<string, number[]> = { tire: [], rim: [] };
  for (const side of [1, -1] as const) {
    const tire = new THREE.Box3(
      new THREE.Vector3(axle.x - 0.4063, axle.y - 0.4063, side > 0 ? axle.inner : -axle.outer),
      new THREE.Vector3(axle.x + 0.4063, axle.y + 0.4063, side > 0 ? axle.outer : -axle.inner),
    );
    const rim = new THREE.Box3(
      new THREE.Vector3(axle.x - axle.rimRadius, axle.y - axle.rimRadius, side > 0 ? axle.rimOuter - 0.02 : -axle.rimOuter),
      new THREE.Vector3(axle.x + axle.rimRadius, axle.y + axle.rimRadius, side > 0 ? axle.rimOuter : -axle.rimOuter + 0.02),
    );
    const fitted = fitWheelToTire(tire, rim, side);
    expected.push(fitted);
    const lip = Math.abs(fitted.position[2]) + WHEEL_LIP.depth + WHEEL_LIP.tube;
    assert.ok(lip <= axle.outer - 0.0029, "rim lip must stay behind the tire sidewall on either side");
    assert.ok(Math.abs(lip - axle.rimOuter) < 0.0001, "rim must meet the original bead seat, not float inside/outside it");
    assert.ok(Math.abs(fitted.radialScale * (WHEEL_LIP.radius + WHEEL_LIP.tube) - axle.rimRadius) < 1e-6);
    const barrelBack = Math.abs(fitted.position[2]) + WHEEL_LIP.depth - fitted.barrelDepth;
    assert.ok(barrelBack >= axle.inner + 0.0079, "barrel must not protrude through the inner sidewall");
    assert.ok(fitted.barrelDepth > 0.24 && fitted.barrelDepth < 0.32);
    for (const [kind, box] of Object.entries({ tire, rim })) {
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pairs[kind].push(x, y, z);
    }
  }
  for (const kind of ["tire", "rim"] as const) {
    const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pairs[kind], 3));
    const mesh = new THREE.Mesh(geometry);
    mesh.name = kind === "tire" ? `wheel.FR.00${index + 3}` : index === 0 ? "3F_4056_w4.005" : "2F_4056_w.003";
    scene.add(mesh);
  }
});
const identity = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: 1, carSize: new THREE.Vector3(4.82, 2, 2.1) };
const actual = measureWheelFitments(scene, identity);
actual.forEach((wheel, index) => {
  wheel.position.forEach((value, axis) => assert.ok(Math.abs(value - expected[index].position[axis]) < 1e-6));
  assert.ok(Math.abs(wheel.radialScale - expected[index].radialScale) < 1e-6);
});
assert.ok(actual[2].barrelDepth > actual[0].barrelDepth + 0.04, "rear barrel must follow the wider rear tire");
const transform = new THREE.Matrix4().compose(new THREE.Vector3(0.3, -0.2, 1.1), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(0.8, 0.8, 0.8));
scene.applyMatrix4(transform.clone().invert());
const transformedFit = { ...identity, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: 0.8 };
transform.decompose(transformedFit.position, transformedFit.quaternion, new THREE.Vector3());
measureWheelFitments(scene, transformedFit).forEach((wheel, index) => {
  wheel.position.forEach((value, axis) => assert.ok(Math.abs(value - actual[index].position[axis]) < 1e-6, "source transforms and car fit must use the same coordinates"));
});
assert.throws(() => measureWheelFitments(new THREE.Group(), identity), /Missing source wheel geometry/);
console.log("Four wheel seats, radial sizes, mirrored sides and staggered barrel widths verified.");
