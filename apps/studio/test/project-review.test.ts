import { expect, it } from "vitest";
import { createAuthoringProject } from "../src/authoring-project.js";
import {
  MemoryProjectStore,
  normalizedImagePoint,
} from "../src/project-review.js";

const project = createAuthoringProject(
  {
    image: "data:image/png;base64,iVBORw0KGgo=",
    width: 768,
    height: 768,
    prompt: "blue-haired librarian",
    provenance: {
      provider: "fake",
      templateId: "open-avatar-concept-v1",
      checkpoint: "approved.safetensors",
      seed: 7,
      artifactSha256: "0".repeat(64),
    },
  },
  { projectId: "project-1", createdAt: 100 },
);

it("normalizes clicks inside a contained image and rejects letterboxing", () => {
  expect(
    normalizedImagePoint(
      { left: 10, top: 20, width: 200, height: 100 },
      { width: 100, height: 100 },
      { x: 110, y: 70 },
    ),
  ).toEqual({ x: 0.5, y: 0.5 });
  expect(
    normalizedImagePoint(
      { left: 10, top: 20, width: 200, height: 100 },
      { width: 100, height: 100 },
      { x: 20, y: 70 },
    ),
  ).toBeUndefined();
});

it("round trips a private project through the storage abstraction", async () => {
  const store = new MemoryProjectStore();
  await expect(store.load()).resolves.toBeUndefined();
  await store.save(project);
  await expect(store.load()).resolves.toEqual(project);
});
