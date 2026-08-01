import { expect, it } from "vitest";
import {
  createHiddenInpaintMask,
  extractVisiblePixels,
  meanReconstructionError,
  selectSemanticMask,
  type SemanticMaskCandidate,
} from "../src/material-separation.js";

const candidate = (
  partId: SemanticMaskCandidate["partId"],
  x: number,
): SemanticMaskCandidate => {
  const alpha = new Uint8ClampedArray(10 * 10 * 4);
  for (let y = 2; y < 8; y += 1)
    for (let nextX = x; nextX < x + 3; nextX += 1)
      alpha[(y * 10 + nextX) * 4 + 3] = 255;
  return {
    partId,
    prompt: `${partId} candidate`,
    width: 10,
    height: 10,
    alpha,
  };
};

it("selects the semantic candidate nearest the declared side and anchor", () => {
  const selected = selectSemanticMask(
    "left eye white",
    [candidate("left eye white", 1), candidate("left eye white", 6)],
    { x: 0, y: 0.1, width: 0.5, height: 0.8 },
    { x: 0.25, y: 0.4 },
  );
  expect(selected?.bounds.x).toBe(1);
  expect(selected?.confidence).toBeGreaterThanOrEqual(0.5);
});

it("copies exact visible source colors while multiplying alpha by the mask", () => {
  const source = new Uint8ClampedArray([10, 20, 30, 200, 40, 50, 60, 255]);
  const mask = new Uint8ClampedArray([0, 0, 0, 128, 0, 0, 0, 0]);
  expect([...extractVisiblePixels(source, mask)]).toEqual([
    10, 20, 30, 100, 40, 50, 60, 0,
  ]);
});

it("allows inpainting only where concealment is required and no accepted pixel exists", () => {
  const required = new Uint8ClampedArray(12);
  const visible = new Uint8ClampedArray(12);
  const protectedPixels = new Uint8ClampedArray(12);
  required[3] = required[7] = required[11] = 255;
  visible[7] = 255;
  protectedPixels[11] = 255;
  expect([
    ...createHiddenInpaintMask(required, visible, protectedPixels),
  ]).toEqual([255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0]);
});

it("measures normalized reconstruction error", () => {
  expect(
    meanReconstructionError(
      new Uint8ClampedArray([0, 0, 0, 255]),
      new Uint8ClampedArray([255, 0, 0, 255]),
    ),
  ).toBe(0.25);
});
