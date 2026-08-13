import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { composeHairLayers, defaultHairMix, normalizeHairMix } from "../src/hair-mixer.js";
import { defaultEyeMix, eyeMaskPath, normalizeEyeMix } from "../src/eye-mixer.js";

test("hair mixer combines independent front, back, add-on, and color choices", () => {
  const mix = normalizeHairMix({ backStyle: "long-wavy", frontStyle: "hime-cut", addons: ["ahoge", "bun-left", "ahoge"], color: "#c45cff" });
  const layers = composeHairLayers(mix);
  assert.equal(layers.back.length, 5);
  assert.equal(layers.front.length, 9);
  assert.ok(layers.front.some((path) => path.endsWith("hime-cut/source/source.png")));
  assert.ok(layers.back.every((path) => path.includes("long-wavy")));
  assert.ok(layers.front.some((path) => path.includes("hime-cut/front-hair")));
  assert.ok(layers.front.some((path) => path.includes("messy-ahoge/ahoge")));
  assert.ok(layers.front.some((path) => path.includes("double-bun/buns/bun-left")));
  assert.equal(mix.color, "#c45cff");
  assert.deepEqual(normalizeHairMix({ color: "bad" }), defaultHairMix());
});

test("eye mixer validates three independent color channels", () => {
  const mix = normalizeEyeMix({ sclera: "#ffeeee", iris: "#39cc77", pupil: "#331155" });
  assert.deepEqual(mix, { sclera: "#ffeeee", iris: "#39cc77", pupil: "#331155" });
  assert.deepEqual(normalizeEyeMix({ iris: "green" }), defaultEyeMix());
  assert.equal(eyeMaskPath("classic-blue", "iris"), "./assets/parts/eyes/classic-blue/color-masks/iris.png");
  assert.throws(() => eyeMaskPath("../bad", "iris"));
});

test("every eye style exposes nonempty color masks", async () => {
  const roots = new URL("../assets/parts/eyes/", import.meta.url);
  const styles = ["classic-blue", "soft-brown", "sharp-red", "sleepy-violet", "round-green", "golden-cat", "heterochromia", "monochrome-gray", "magical-star", "mature-narrow"];
  for (const style of styles) {
    const manifest = JSON.parse(await readFile(new URL(`${style}/manifest.json`, roots), "utf8"));
    for (const channel of ["sclera", "iris", "pupil"]) {
      assert.equal(manifest.color_masks[channel], `color-masks/${channel}.png`);
      await access(new URL(`${style}/${manifest.color_masks[channel]}`, roots));
    }
  }
});
