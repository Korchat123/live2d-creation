import { expect, it } from "vitest";
import {
  catalogSetLayer,
  catalogSetRegions,
  createCatalogSetWorkflow,
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
