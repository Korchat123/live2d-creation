import { expect, it } from "vitest";
import {
  cropBoundsFromAlpha,
  findMissingArtwork,
  isProjectReady,
} from "../src/authoring.js";

it("finds the smallest rectangle enclosing an authored crop mask", () => {
  const pixels = new Uint8ClampedArray(4 * 3 * 4);
  pixels[(1 * 4 + 1) * 4 + 3] = 255;
  pixels[(2 * 4 + 2) * 4 + 3] = 255;
  expect(cropBoundsFromAlpha(pixels, 4, 3)).toEqual({
    x: 1,
    y: 1,
    width: 2,
    height: 2,
  });
});

it("identifies missing production parts and requires the eye rig before Motion Lab can open", () => {
  const incomplete = { "face base": "mask", "left eye white": "mask" };
  expect(isProjectReady(incomplete)).toBe(false);
  expect(findMissingArtwork(incomplete)).toContain("right pupil iris");
  expect(
    isProjectReady({
      "face base": "mask",
      "left eye white": "mask",
      "right eye white": "mask",
      "left pupil iris": "mask",
      "right pupil iris": "mask",
      "left upper eyelid": "mask",
      "right upper eyelid": "mask",
      "left lower eyelid": "mask",
      "right lower eyelid": "mask",
      "mouth closed lips": "mask",
      "mouth interior": "mask",
      torso: "mask",
    }),
  ).toBe(true);
});
