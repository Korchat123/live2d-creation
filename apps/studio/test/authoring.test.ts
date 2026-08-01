import { expect, it } from "vitest";
import {
  automaticallySuggestedLayers,
  createInpaintWorkflow,
  createSegmentWorkflow,
  cropBoundsFromAlpha,
  eyeRegionsFromGuide,
  expressionLayers,
  findMissingArtwork,
  isProjectReady,
  motionMouthLayerOrder,
} from "../src/authoring.js";

it("keeps expression generation constrained to the relevant editable layers", () => {
  expect(expressionLayers["open mouth"]).toEqual([
    "mouth closed lips",
    "mouth interior",
    "teeth",
    "tongue",
  ]);
  expect(expressionLayers.blink).toContain("left eye white");
  expect(expressionLayers.blink).toContain("right upper eyelid");
  expect(expressionLayers["left wink"]).not.toContain("right eye white");
});

it("renders generated mouth artwork from interior to foreground lips", () => {
  expect(motionMouthLayerOrder).toEqual([
    "mouth interior",
    "tongue",
    "teeth",
    "mouth closed lips",
  ]);
});

it("only auto-suggests pixel-detectable face and eye layers", () => {
  expect(automaticallySuggestedLayers).toContain("face base");
  expect(automaticallySuggestedLayers).toContain("left pupil iris");
  expect(automaticallySuggestedLayers).not.toContain("torso");
  expect(automaticallySuggestedLayers).not.toContain("front hair");
});

it("creates a SAM3 workflow that saves one editable mask", () => {
  const workflow = createSegmentWorkflow(
    "sam3.1_multiplex_fp16.safetensors",
    "portrait.png",
    "left eye",
  );
  expect(workflow["2"]?.inputs.ckpt_name).toBe(
    "sam3.1_multiplex_fp16.safetensors",
  );
  expect(workflow["3"]?.inputs.text).toBe("left eye");
  expect(workflow["6"]?.class_type).toBe("SaveImage");
});

it("derives eye-layer regions from the four portrait contour points", () => {
  const regions = eyeRegionsFromGuide(
    {
      outer: { x: 20, y: 40 },
      inner: { x: 80, y: 42 },
      top: { x: 50, y: 30 },
      bottom: { x: 50, y: 60 },
    },
    100,
    100,
  );
  expect(regions.white).toEqual([0.2, 0.3, 0.6000000000000001, 0.3]);
  expect(regions.pupil[0]).toBeCloseTo(0.368);
  expect(regions.pupil[2]).toBeCloseTo(0.264);
  expect(regions.upperLid[1]).toBeCloseTo(0.264);
});

it("creates a fixed local inpainting workflow with only the supplied image names", () => {
  const workflow = createInpaintWorkflow(
    "sd-v1-5-inpainting.ckpt",
    "open-avatar-source.png",
    "open-avatar-mask.png",
    "repair the lower lid",
    42,
  );
  expect(workflow["1"]?.inputs.ckpt_name).toBe("sd-v1-5-inpainting.ckpt");
  expect(workflow["3"]?.inputs).toEqual({
    image: "open-avatar-mask.png",
    channel: "alpha",
  });
  expect(workflow["7"]?.inputs.seed).toBe(42);
});

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
