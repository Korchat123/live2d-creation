import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parts } from "../src/model-parts.js";

const sourceBox = [289, 103, 1759, 1869];

test("composed heads map to every anatomy face registration", async () => {
  const anatomy = parts.filter((part) => part.category === "anatomy" && part.gender === "androgynous");
  assert.equal(anatomy.length, 10);
  for (const part of anatomy) {
    const manifest = JSON.parse(await readFile(new URL(`../assets/anatomy/${part.style}/androgynous/manifest.json`, import.meta.url), "utf8"));
    const expected = manifest.parts["facebase/facebase"].crop;
    const projected = [
      (part.headFit.left + sourceBox[0] / 2048 * part.headFit.width) * 2048,
      (part.headFit.top + sourceBox[1] / 2048 * part.headFit.height) * 2048,
      (part.headFit.left + sourceBox[2] / 2048 * part.headFit.width) * 2048,
      (part.headFit.top + sourceBox[3] / 2048 * part.headFit.height) * 2048
    ];
    projected.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) <= 0.2, `${part.style} edge ${index}`));
  }
});

test("final preview uses the registered character draw stack", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(app, /head-composite is-back[\s\S]*outfit-layer[\s\S]*hand-layer is-left[\s\S]*hand-layer is-right[\s\S]*selected-face-layer[\s\S]*head-composite is-front/);
  assert.match(styles, /head-composite\.is-back \{ z-index: 2/);
  assert.match(styles, /outfit-layer \{ z-index: 3/);
  assert.match(styles, /hand-layer \{ z-index: 2/);
  assert.match(styles, /selected-face-layer \{[^}]*z-index: 5/);
  assert.match(styles, /selected-face-layer \{ clip-path: polygon\(/);
  assert.match(styles, /head-composite\.is-front \{ z-index: 6/);
  assert.match(styles, /head-composite \{ transform: scale\(var\(--preview-head-scale\)\)/);
});

test("every selectable face carries its anatomy crop and feature mapping", () => {
  const faces = parts.filter((part) => part.category === "base");
  for (const face of faces) {
    assert.ok(face.faceFit && face.headFit, face.id);
    for (const key of ["left", "top", "width", "height"]) assert.ok(Number.isFinite(face.faceFit[key]), `${face.id} ${key}`);
  }
});
