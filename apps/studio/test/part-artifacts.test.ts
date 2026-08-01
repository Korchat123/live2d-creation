import { describe, expect, it } from "vitest";
import { defaultPartPlan, type PartId } from "../src/authoring-project.js";
import {
  acceptPartCandidate,
  addPartCandidate,
  alphaBounds,
  authoringCanvasSize,
  dependencyOrderedParts,
  emptyPartRevisionState,
  partArtifactVersion,
  rejectPartCandidate,
  validateAcceptedParts,
  validatePartPixels,
  type PartArtifact,
} from "../src/part-artifacts.js";

const artifact = (
  partId: PartId,
  candidateId: string,
  hash = `${"a".repeat(63)}${candidateId.endsWith("2") ? "2" : "1"}`,
): PartArtifact => ({
  version: partArtifactVersion,
  partId,
  candidateId,
  revision: 1,
  width: authoringCanvasSize,
  height: authoringCanvasSize,
  mimeType: "image/png",
  anchor: { x: 0.5, y: 0.5 },
  alphaBounds: { x: 900, y: 900, width: 200, height: 200 },
  concealedOverlapPixels: 32,
  provenance: {
    provider: "fake",
    workflow: "test-part-v1",
    checkpoint: "fixture.safetensors",
    seed: 7,
    sourceConceptSha256: "b".repeat(64),
    artifactSha256: hash,
  },
});

describe("part artifacts", () => {
  it("orders enabled parts after their dependencies", () => {
    const order = dependencyOrderedParts(defaultPartPlan);
    expect(order.indexOf("torso")).toBeLessThan(order.indexOf("neck"));
    expect(order.indexOf("neck")).toBeLessThan(order.indexOf("face base"));
    expect(order.indexOf("face base")).toBeLessThan(
      order.indexOf("front hair"),
    );
    expect(order).not.toContain("accessory");
  });

  it("measures alpha and rejects edge clipping, anchor drift, and overlap gaps", () => {
    const pixels = new Uint8ClampedArray(
      authoringCanvasSize * authoringCanvasSize * 4,
    );
    pixels[3] = 255;
    pixels[(10 * authoringCanvasSize + 10) * 4 + 3] = 255;
    expect(
      alphaBounds(pixels, authoringCanvasSize, authoringCanvasSize),
    ).toEqual({ x: 0, y: 0, width: 11, height: 11 });
    expect(
      validatePartPixels(
        "face base",
        pixels,
        authoringCanvasSize,
        authoringCanvasSize,
        { x: 0.5, y: 0.5 },
        0,
      ).map(({ code }) => code),
    ).toEqual([
      "clipped-alpha",
      "anchor-mismatch",
      "missing-concealed-overlap",
    ]);
  });

  it("keeps accepted revisions immutable while variants are retried", () => {
    const first = artifact("face base", "face-1");
    const second = artifact("face base", "face-2");
    const initial = emptyPartRevisionState();
    const withFirst = addPartCandidate(initial, first);
    const acceptedFirst = acceptPartCandidate(withFirst, "face base", "face-1");
    const withRetry = addPartCandidate(acceptedFirst, second);
    expect(acceptedFirst.accepted["face base"]).toBe("face-1");
    expect(withRetry.accepted["face base"]).toBe("face-1");
    const acceptedSecond = acceptPartCandidate(
      withRetry,
      "face base",
      "face-2",
    );
    expect(acceptedSecond.accepted["face base"]).toBe("face-2");
    expect(
      acceptedSecond.candidates["face base"]?.map(({ status }) => status),
    ).toEqual(["rejected", "accepted"]);
    expect(
      rejectPartCandidate(acceptedSecond, "face base", "face-2").accepted,
    ).not.toHaveProperty("face base");
    expect(initial).toEqual({ candidates: {}, accepted: {} });
  });

  it("reports missing and duplicate accepted parts", () => {
    const duplicateHash = "c".repeat(64);
    let state = emptyPartRevisionState();
    state = addPartCandidate(
      state,
      artifact("back hair", "back-hair", duplicateHash),
    );
    state = acceptPartCandidate(state, "back hair", "back-hair");
    state = addPartCandidate(state, artifact("torso", "torso", duplicateHash));
    state = acceptPartCandidate(state, "torso", "torso");
    const issues = validateAcceptedParts(defaultPartPlan, state);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "duplicate-content", partId: "torso" }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "missing-required-part",
        partId: "face base",
      }),
    );
  });
});
