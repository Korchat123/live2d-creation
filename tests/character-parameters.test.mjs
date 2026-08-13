import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { defaultParameters, parameterContract, setParameter } from "../src/character-parameters.js";

test("character parameters reset to documented defaults", () => {
  const defaults = defaultParameters();
  for (const [name, rule] of Object.entries(parameterContract)) {
    assert.equal(defaults[name], rule.default);
  }
});

test("face and bust parameters clamp to art-safe ranges", () => {
  const defaults = defaultParameters();
  assert.equal(setParameter(defaults, "jawWidth", 100).jawWidth, parameterContract.jawWidth.max);
  assert.equal(setParameter(defaults, "faceScale", -10).faceScale, parameterContract.faceScale.min);
  assert.equal(setParameter(defaults, "bustSize", -1).bustSize, 0);
  assert.equal(setParameter(defaults, "bustSize", 50).bustSize, parameterContract.bustSize.max);
});

test("unknown and non-numeric parameter updates are rejected", () => {
  assert.throws(() => setParameter(defaultParameters(), "noseChaos", 1), /Unknown/);
  assert.throws(() => setParameter(defaultParameters(), "jawWidth", "wide"), /Invalid/);
});

test("adjustable art contract exposes ten bust styles and thirty matched faces", async () => {
  const contract = JSON.parse(await readFile(new URL("../assets/parts/adjustment-contract.json", import.meta.url), "utf8"));
  assert.equal(contract.version, 1);
  assert.equal(contract.busts.length, 10);
  assert.equal(contract.faces.length, 30);
  assert.deepEqual(contract.parameters, parameterContract);

  for (const bust of contract.busts) {
    await access(new URL(`../${bust.left.slice(2)}`, import.meta.url));
    await access(new URL(`../${bust.right.slice(2)}`, import.meta.url));
    await access(new URL(`../${bust.thumbnail.slice(2)}`, import.meta.url));
  }
  for (const face of contract.faces) {
    await access(new URL(`../${face.asset.slice(2)}`, import.meta.url));
  }
});
