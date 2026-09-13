import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { classifyPart } from "../src/components/configurator/fitModel";

const roof = new Box3(new Vector3(-0.4, 1.7, -0.3), new Vector3(0.4, 1.73, 0.3));
const car = new Vector3(2, 2, 4.82);
assert.equal(classifyPart(null, roof, car, "Group_64"), "roofGlass");
assert.equal(classifyPart(null, roof, car, "otherWindow"), "glass");
console.log("Roof glass is distinct from the cabin windows.");
