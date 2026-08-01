import { describe, expect, it } from "vitest";
import {
  createAuthoringProject,
  updateCharacterBible,
  type AcceptedConcept,
  type AuthoringProject,
} from "../src/authoring-project.js";
import {
  acceptPartCandidate,
  addPartCandidate,
  authoringCanvasSize,
  emptyPartRevisionState,
  partArtifactVersion,
  type PartArtifact,
} from "../src/part-artifacts.js";
import {
  createPartGenerationJobs,
  generatePartVariant,
  nextGeneratableJobs,
  type PartGenerationProvider,
} from "../src/part-generation.js";

const concept: AcceptedConcept = {
  image: "data:image/png;base64,AAAA",
  width: 1024,
  height: 1024,
  prompt: "blue-haired librarian",
  provenance: {
    provider: "fake",
    templateId: "open-avatar-concept-v1",
    checkpoint: "fixture.safetensors",
    seed: 7,
    artifactSha256: "b".repeat(64),
  },
};

const project = (): AuthoringProject =>
  updateCharacterBible(
    createAuthoringProject(concept, { projectId: "project-1", createdAt: 1 }),
    {
      displayName: "Mira",
      style: "clean anime line art",
      palette: "cobalt, cream, navy",
      outfit: "cardigan and pleated skirt",
      identityNotes: "long blue hair, green eyes, round glasses",
    },
  );

const artifact = (partId: PartArtifact["partId"]): PartArtifact => ({
  version: partArtifactVersion,
  partId,
  candidateId: `${partId.replaceAll(" ", "-")}-1`,
  revision: 1,
  width: authoringCanvasSize,
  height: authoringCanvasSize,
  mimeType: "image/png",
  anchor: { x: 0.5, y: 0.5 },
  alphaBounds: { x: 900, y: 900, width: 200, height: 200 },
  concealedOverlapPixels: 32,
  provenance: {
    provider: "fake",
    workflow: "open-avatar-purpose-part-v1",
    checkpoint: "fixture.safetensors",
    seed: 7,
    sourceConceptSha256: "b".repeat(64),
    artifactSha256: `${"a".repeat(63)}1`,
  },
});

describe("purpose-generated part orchestration", () => {
  it("locks every job to the accepted concept, bible, canvas, and dependencies", () => {
    const jobs = createPartGenerationJobs(project());
    const face = jobs.find(({ partId }) => partId === "face base");
    expect(face).toEqual(
      expect.objectContaining({
        sourceConceptSha256: "b".repeat(64),
        checkpoint: "fixture.safetensors",
        seed: expect.any(Number),
        canvas: { width: 2048, height: 2048 },
        dependencies: ["neck"],
        stage: "base-body",
      }),
    );
    expect(face?.prompt).toContain("Mira");
    expect(face?.prompt).toContain("purpose-generated face base");
    expect(face?.prompt).toContain("transparent background");
    expect(face?.negative).toContain("underwear");
    const torso = jobs.find(({ partId }) => partId === "torso");
    const outfit = jobs.find(({ partId }) => partId === "outfit front");
    expect(torso?.prompt).toContain("opaque full-coverage fitted base suit");
    expect(outfit).toMatchObject({ stage: "clothing" });
    expect(outfit?.prompt).toContain("do not repaint skin, face, or hair");
    expect(jobs.indexOf(torso!)).toBeLessThan(jobs.indexOf(outfit!));
  });

  it("offers only jobs whose accepted dependencies are complete", () => {
    const jobs = createPartGenerationJobs(project());
    let state = emptyPartRevisionState();
    expect(
      nextGeneratableJobs(jobs, state).map(({ partId }) => partId),
    ).toEqual(["torso", "back hair"]);
    state = addPartCandidate(state, artifact("torso"));
    state = acceptPartCandidate(state, "torso", "torso-1");
    expect(
      nextGeneratableJobs(jobs, state).map(({ partId }) => partId),
    ).toContain("neck");
  });

  it("does not mutate state when generation is cancelled or mismatched", async () => {
    const state = emptyPartRevisionState();
    const job = createPartGenerationJobs(project())[0]!;
    const cancelled = new AbortController();
    cancelled.abort();
    const provider: PartGenerationProvider = {
      generatePart: async () => artifact(job.partId),
    };
    await expect(
      generatePartVariant(provider, job, state, cancelled.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(state).toEqual(emptyPartRevisionState());

    const wrongProvider: PartGenerationProvider = {
      generatePart: async () => artifact("back hair"),
    };
    await expect(
      generatePartVariant(
        wrongProvider,
        job,
        state,
        new AbortController().signal,
      ),
    ).rejects.toThrow("wrong part or concept");
    expect(state).toEqual(emptyPartRevisionState());
  });
});
