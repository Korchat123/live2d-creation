import { expect, it } from "vitest";
import type { AcceptedConcept } from "../src/authoring-project.js";
import {
  acceptReferenceCandidate,
  addReferenceCandidate,
  createReferenceReviewState,
  MemoryReferenceReviewStore,
  parseReferenceReview,
  rejectReferenceCandidate,
  selectReferenceCandidate,
  serializeReferenceReview,
} from "../src/reference-review.js";

const concept = (digit: string): AcceptedConcept => ({
  image: "data:image/png;base64,iVBORw0KGgo=",
  width: 896,
  height: 1152,
  prompt: "front-facing blue-haired anime librarian",
  provenance: {
    provider: "fake",
    templateId: "open-avatar-concept-v1",
    checkpoint: "approved.safetensors",
    seed: Number(digit),
    artifactSha256: digit.repeat(64),
  },
});

it("persists pending, rejected, selected, and regenerated references", async () => {
  let state = addReferenceCandidate(
    createReferenceReviewState(1),
    concept("1"),
    2,
  );
  state = rejectReferenceCandidate(state, "1".repeat(64), "shoes cropped", 3);
  state = addReferenceCandidate(state, concept("2"), 4);
  state = selectReferenceCandidate(state, "1".repeat(64), 5);

  expect(state.candidates.map(({ decision }) => decision)).toEqual([
    "rejected",
    "pending",
  ]);
  expect(state.selectedId).toBe("1".repeat(64));
  expect(state.candidates[0]?.reason).toBe("shoes cropped");

  const store = new MemoryReferenceReviewStore();
  await store.save(state);
  await expect(store.load()).resolves.toEqual(state);
  expect(parseReferenceReview(serializeReferenceReview(state))).toEqual(state);
});

it("persists and renders candidates from the reviewed Z-Image template", async () => {
  const base = concept("1");
  const zImageConcept: AcceptedConcept = {
    ...base,
    width: 768,
    provenance: {
      ...base.provenance,
      provider: "comfyui",
      templateId: "open-avatar-z-image-turbo-v1",
      checkpoint: "z_image_turbo_bf16.safetensors",
      partCheckpoint: "animagine-xl-4.0-opt.safetensors",
      artifactSha256: "a".repeat(64),
    },
  };
  const state = addReferenceCandidate(
    createReferenceReviewState(1),
    zImageConcept,
    2,
  );
  const store = new MemoryReferenceReviewStore();
  await store.save(state);
  await expect(store.load()).resolves.toEqual(state);
});

it("makes the accepted neutral master immutable", () => {
  const pending = addReferenceCandidate(
    createReferenceReviewState(1),
    concept("1"),
    2,
  );
  const accepted = acceptReferenceCandidate(pending, "1".repeat(64), 3);

  expect(accepted.acceptedId).toBe("1".repeat(64));
  expect(accepted.candidates[0]?.decision).toBe("accepted");
  expect(() =>
    rejectReferenceCandidate(accepted, "1".repeat(64), "changed mind", 4),
  ).toThrow("immutable");
  expect(() => addReferenceCandidate(accepted, concept("2"), 4)).toThrow(
    "immutable",
  );
  expect(() => acceptReferenceCandidate(accepted, "1".repeat(64), 4)).toThrow(
    "immutable",
  );
  expect(accepted).toEqual(
    parseReferenceReview(serializeReferenceReview(accepted)),
  );
});

it("bounds candidates, deduplicates hashes, and prunes only reviewed history", () => {
  let state = createReferenceReviewState(0);
  for (const digit of ["1", "2", "3", "4"])
    state = addReferenceCandidate(state, concept(digit), Number(digit));
  expect(() => addReferenceCandidate(state, concept("5"), 5)).toThrow(
    "Reject or accept",
  );
  expect(() => addReferenceCandidate(state, concept("4"), 5)).toThrow(
    "already exists",
  );
  state = rejectReferenceCandidate(state, "4".repeat(64), "bad framing", 6);
  state = selectReferenceCandidate(state, "1".repeat(64), 7);
  state = addReferenceCandidate(state, concept("5"), 8);
  expect(state.candidates).toHaveLength(4);
  expect(state.candidates.some(({ id }) => id === "4".repeat(64))).toBe(false);
  expect(state.candidates.at(-1)?.id).toBe("5".repeat(64));
});

it("rejects corrupt, remote, mismatched, and unknown-version review state", () => {
  const pending = addReferenceCandidate(
    createReferenceReviewState(1),
    concept("1"),
    2,
  );
  const value = JSON.parse(serializeReferenceReview(pending)) as {
    version: number;
    candidates: Array<{
      id: string;
      concept: { image: string };
    }>;
  };
  value.version = 2;
  expect(() => parseReferenceReview(JSON.stringify(value))).toThrow(
    "Unsupported",
  );
  value.version = 1;
  value.candidates[0]!.concept.image = "https://attacker.example/reference.png";
  expect(() => parseReferenceReview(JSON.stringify(value))).toThrow(
    "embedded PNG or WebP",
  );
  value.candidates[0]!.concept.image = concept("1").image;
  value.candidates[0]!.id = "2".repeat(64);
  expect(() => parseReferenceReview(JSON.stringify(value))).toThrow(
    "does not match",
  );
});
