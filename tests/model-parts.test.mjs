import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { initialSelection, parts, partsForCategory, selectPart, selectedParts } from "../src/model-parts.js";

test("selecting the face base preserves immutable input state", () => {
  const faceBase = parts.find((part) => part.id === "base-anime-neutral-v3");
  const result = selectPart({}, faceBase);

  assert.equal(result.base, "base-anime-neutral-v3");
  assert.equal(initialSelection.base, "base-idol-balanced-androgynous");
});

test("unknown parts are rejected", () => {
  assert.throws(
    () => selectPart(initialSelection, { id: "untrusted", category: "hair" }),
    /unknown or mismatched/
  );
});

test("selectedParts resolves the approved defaults", () => {
  const result = selectedParts(initialSelection);
  assert.equal(result.length, 6);
  assert.equal(result.find((part) => part.category === "base").asset, "./assets/parts/face-base/idol-balanced/androgynous.png");
  assert.equal(result.find((part) => part.category === "anatomy").id, "anatomy-idol-balanced-androgynous");
  assert.equal(result.find((part) => part.category === "bust").id, "bust-idol-balanced");
  assert.equal(result.find((part) => part.category === "hair").id, "hair-long-straight");
  assert.equal(result.find((part) => part.category === "eyes").id, "eyes-classic-blue");
  assert.equal(result.find((part) => part.category === "outfit").id, "outfit-academy-blazer");
  assert.deepEqual(new Set(result.map((part) => part.category)), new Set(Object.keys(initialSelection)));
});

test("every anatomy style exposes female, male, and androgynous variants", () => {
  const anatomy = parts.filter((part) => part.category === "anatomy");
  assert.equal(anatomy.length, 30);

  const styles = new Set(anatomy.map((part) => part.style));
  assert.equal(styles.size, 10);
  for (const style of styles) {
    assert.deepEqual(
      new Set(anatomy.filter((part) => part.style === style).map((part) => part.gender)),
      new Set(["female", "male", "androgynous"])
    );
  }
});

test("anatomy gender filters do not affect other categories", () => {
  assert.equal(partsForCategory("anatomy", "female").length, 10);
  assert.equal(partsForCategory("anatomy", "male").length, 10);
  assert.equal(partsForCategory("anatomy", "androgynous").length, 10);
  assert.equal(partsForCategory("anatomy", "all").length, 30);
  assert.equal(partsForCategory("base", "female").length, 10);
});

test("hair picker exposes all registered hairstyles", () => {
  const hair = partsForCategory("hair");
  assert.equal(hair.length, 10);
  assert.deepEqual(
    new Set(hair.map((part) => part.style)),
    new Set(["long-straight", "short-bob", "hime-cut", "high-ponytail", "twin-tails", "messy-ahoge", "double-bun", "side-braid", "wolf-cut", "long-wavy"])
  );
});

test("eye and outfit pickers expose their registered catalogs", () => {
  assert.equal(partsForCategory("eyes").length, 10);
  assert.equal(partsForCategory("outfit").length, 10);
});

test("approved face-base asset is a square RGBA PNG", async () => {
  const image = await readFile(new URL("../assets/parts/face-base/anime-neutral-v3.png", import.meta.url));
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  assert.deepEqual(image.subarray(0, 8), pngSignature);
  assert.equal(image.readUInt32BE(16), 2048);
  assert.equal(image.readUInt32BE(20), 2048);
  assert.equal(image[25], 6, "PNG color type must be RGBA");
});
