import { expect, it } from "vitest";
import {
  catalogSetLayer,
  catalogSetRegions,
  createCatalogSetWorkflow,
  selectCatalogCheckpoint,
  validateCatalogSetCandidateMetrics,
} from "../src/avatar-kit-comfy.js";
import {
  minimumAvatarSetKinds,
  optionalAvatarSetKinds,
} from "../src/avatar-kit-planner.js";

it("defines a bounded aligned generation region and target layer for every set", () => {
  for (const kind of [...minimumAvatarSetKinds, ...optionalAvatarSetKinds]) {
    const region = catalogSetRegions[kind];
    expect(region).toBeDefined();
    expect(region.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(region[0] + region[2]).toBeLessThanOrEqual(1);
    expect(region[1] + region[3]).toBeLessThanOrEqual(1);
    expect(catalogSetLayer[kind]).toBeTruthy();
  }
});

it("uses a checkpoint model rather than a Z-Image diffusion file for inpainting", () => {
  expect(
    selectCatalogCheckpoint([
      "z_image_turbo_bf16.safetensors",
      "animagine-xl-4.0-opt.safetensors",
    ]),
  ).toBe("animagine-xl-4.0-opt.safetensors");
  expect(selectCatalogCheckpoint(["z_image_turbo_bf16.safetensors"])).toBe("");
});

it("builds an allowlisted masked workflow for one missing set", () => {
  const workflow = createCatalogSetWorkflow(
    "approved.safetensors",
    "context.png",
    "mask.png",
    "prop",
    "ornate silver cane",
    43,
  );
  expect(workflow["1"]?.inputs.ckpt_name).toBe("approved.safetensors");
  expect(workflow["2"]?.inputs.image).toBe("context.png");
  expect(workflow["3"]?.inputs.image).toBe("mask.png");
  expect(workflow["5"]?.inputs.text).toContain("create only the prop set");
  expect(workflow["5"]?.inputs.text).toContain("no complete character");
  expect(workflow["6"]?.inputs.text).toContain("opaque rectangle");
  expect(workflow["7"]?.inputs.seed).toBe(43);
  expect(workflow["7"]?.inputs.denoise).toBe(1);
});

it("conditions a new outfit on the visible fitting body", () => {
  const workflow = createCatalogSetWorkflow(
    "approved.safetensors",
    "body.png",
    "outfit-mask.png",
    "outfit",
    "navy gothic dress",
    7,
  );
  expect(workflow["5"]?.inputs.text).toContain("fitted exactly");
  expect(workflow["5"]?.inputs.text).toContain("preserve the visible head");
  expect(workflow["5"]?.inputs.text).toContain("navy gothic dress");
});

it("rejects empty outfits and any candidate that repaints outside its mask", () => {
  expect(() =>
    validateCatalogSetCandidateMetrics("outfit", 0.05, 0.5, 0),
  ).toThrow("enough fitted garment");
  expect(() =>
    validateCatalogSetCandidateMetrics("outfit", 0.5, 0.7, 0.2),
  ).toThrow("outside the fitted set mask");
  expect(() =>
    validateCatalogSetCandidateMetrics("outfit", 0.8, 0.95, 0.01),
  ).not.toThrow();
});
