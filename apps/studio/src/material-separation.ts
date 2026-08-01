import type { PartId } from "./authoring-project.js";

export type NormalizedRegion = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type SemanticMaskCandidate = Readonly<{
  partId: PartId;
  prompt: string;
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
}>;

export type SelectedSemanticMask = Readonly<{
  candidate: SemanticMaskCandidate;
  confidence: number;
  bounds: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

const alphaOffset = (pixel: number): number => pixel * 4 + 3;

const maskBounds = (
  candidate: SemanticMaskCandidate,
): SelectedSemanticMask["bounds"] | undefined => {
  let left = candidate.width;
  let top = candidate.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < candidate.height; y += 1)
    for (let x = 0; x < candidate.width; x += 1) {
      if ((candidate.alpha[alphaOffset(y * candidate.width + x)] ?? 0) === 0)
        continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  if (right < left || bottom < top) return undefined;
  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

const intersectionArea = (
  bounds: SelectedSemanticMask["bounds"],
  region: NormalizedRegion,
  width: number,
  height: number,
): number => {
  const left = Math.max(bounds.x, region.x * width);
  const top = Math.max(bounds.y, region.y * height);
  const right = Math.min(
    bounds.x + bounds.width,
    (region.x + region.width) * width,
  );
  const bottom = Math.min(
    bounds.y + bounds.height,
    (region.y + region.height) * height,
  );
  return Math.max(0, right - left) * Math.max(0, bottom - top);
};

export const selectSemanticMask = (
  partId: PartId,
  candidates: readonly SemanticMaskCandidate[],
  region: NormalizedRegion,
  anchor: Readonly<{ x: number; y: number }>,
): SelectedSemanticMask | undefined => {
  const scored = candidates
    .filter(
      (candidate) =>
        candidate.partId === partId &&
        candidate.width > 0 &&
        candidate.height > 0 &&
        candidate.alpha.length === candidate.width * candidate.height * 4,
    )
    .flatMap((candidate) => {
      const bounds = maskBounds(candidate);
      if (!bounds || bounds.width * bounds.height < 16) return [];
      const area = bounds.width * bounds.height;
      const overlap = intersectionArea(
        bounds,
        region,
        candidate.width,
        candidate.height,
      );
      const centerX = (bounds.x + bounds.width / 2) / candidate.width;
      const centerY = (bounds.y + bounds.height / 2) / candidate.height;
      const anchorDistance = Math.hypot(centerX - anchor.x, centerY - anchor.y);
      const regionFit = overlap / area;
      const confidence = Math.max(
        0,
        Math.min(
          1,
          regionFit * 0.75 + (1 - Math.min(1, anchorDistance)) * 0.25,
        ),
      );
      return [{ candidate, bounds, confidence }];
    })
    .filter(({ confidence }) => confidence >= 0.5)
    .sort((left, right) => right.confidence - left.confidence);
  return scored[0];
};

export const extractVisiblePixels = (
  sourceRgba: Uint8ClampedArray,
  maskRgba: Uint8ClampedArray,
): Uint8ClampedArray => {
  if (sourceRgba.length !== maskRgba.length || sourceRgba.length % 4 !== 0)
    throw new Error("Visible source and semantic mask dimensions must match.");
  const output = new Uint8ClampedArray(sourceRgba.length);
  for (let offset = 0; offset < sourceRgba.length; offset += 4) {
    const maskAlpha = maskRgba[offset + 3] ?? 0;
    output[offset] = sourceRgba[offset] ?? 0;
    output[offset + 1] = sourceRgba[offset + 1] ?? 0;
    output[offset + 2] = sourceRgba[offset + 2] ?? 0;
    output[offset + 3] = Math.round(
      ((sourceRgba[offset + 3] ?? 0) * maskAlpha) / 255,
    );
  }
  return output;
};

export const createHiddenInpaintMask = (
  concealedRequired: Uint8ClampedArray,
  visible: Uint8ClampedArray,
  protectedPixels: Uint8ClampedArray,
): Uint8ClampedArray => {
  if (
    concealedRequired.length !== visible.length ||
    visible.length !== protectedPixels.length ||
    visible.length % 4 !== 0
  )
    throw new Error("Occlusion masks must use the same dimensions.");
  const output = new Uint8ClampedArray(visible.length);
  for (let offset = 0; offset < output.length; offset += 4) {
    const allowed =
      (concealedRequired[offset + 3] ?? 0) > 0 &&
      (visible[offset + 3] ?? 0) === 0 &&
      (protectedPixels[offset + 3] ?? 0) === 0;
    if (!allowed) continue;
    output[offset] = 255;
    output[offset + 1] = 255;
    output[offset + 2] = 255;
    output[offset + 3] = 255;
  }
  return output;
};

export const meanReconstructionError = (
  referenceRgba: Uint8ClampedArray,
  reconstructionRgba: Uint8ClampedArray,
): number => {
  if (
    referenceRgba.length !== reconstructionRgba.length ||
    referenceRgba.length === 0
  )
    throw new Error("Reconstruction dimensions must match the reference.");
  let difference = 0;
  for (let offset = 0; offset < referenceRgba.length; offset += 1)
    difference += Math.abs(
      (referenceRgba[offset] ?? 0) - (reconstructionRgba[offset] ?? 0),
    );
  return difference / referenceRgba.length / 255;
};
