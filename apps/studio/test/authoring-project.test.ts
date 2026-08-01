import { expect, it } from "vitest";
import {
  createAuthoringProject,
  defaultPartPlan,
  isCharacterBibleComplete,
  parseAuthoringProject,
  serializeAuthoringProject,
  setPartEnabled,
  setProjectLandmark,
  updateCharacterBible,
} from "../src/authoring-project.js";

const concept = {
  image: "data:image/png;base64,iVBORw0KGgo=",
  width: 768,
  height: 768,
  prompt: "blue-haired librarian",
  provenance: {
    provider: "comfyui" as const,
    templateId: "open-avatar-concept-v1" as const,
    checkpoint: "approved.safetensors",
    seed: 7,
    artifactSha256: "0".repeat(64),
  },
};

it("creates a deterministic private project only after concept acceptance", () => {
  const project = createAuthoringProject(concept, {
    projectId: "project-1",
    createdAt: 100,
  });
  expect(project.acceptedConcept).toEqual(concept);
  expect(project.partPlan).toEqual(defaultPartPlan);
  expect(
    project.partPlan.find((entry) => entry.id === "left pupil iris")
      ?.dependencies,
  ).toEqual(["left eye white"]);
  expect(project.rights.status).toBe("blocked");
  expect(serializeAuthoringProject(project)).toBe(
    serializeAuthoringProject(project),
  );
});

it("round trips the versioned project and rejects external concept URLs", () => {
  const project = createAuthoringProject(concept, {
    projectId: "project-1",
    createdAt: 100,
  });
  expect(parseAuthoringProject(serializeAuthoringProject(project))).toEqual(
    project,
  );
  expect(() =>
    createAuthoringProject(
      { ...concept, image: "https://attacker.example/concept.png" },
      { projectId: "project-1", createdAt: 100 },
    ),
  ).toThrow("embedded PNG or WebP");
});

it("rejects unknown versions, oversized concepts, and invalid dimensions", () => {
  expect(() => parseAuthoringProject('{"version":2}')).toThrow(
    "Unsupported project version",
  );
  expect(() =>
    createAuthoringProject(
      { ...concept, width: 2048 },
      { projectId: "project-1", createdAt: 100 },
    ),
  ).toThrow("dimensions");
  expect(() =>
    createAuthoringProject(
      {
        ...concept,
        image: `data:image/png;base64,${"a".repeat(6 * 1024 * 1024)}`,
      },
      { projectId: "project-1", createdAt: 100 },
    ),
  ).toThrow("image limit");
});

it("rejects unknown composition-control provenance", () => {
  const project = createAuthoringProject(concept, {
    projectId: "project-1",
    createdAt: 100,
  });
  const value = JSON.parse(serializeAuthoringProject(project)) as {
    acceptedConcept: {
      provenance: {
        compositionControl?: { templateId: string; controlNet: string };
      };
    };
  };
  value.acceptedConcept.provenance.compositionControl = {
    templateId: "unknown-control",
    controlNet: "pose.safetensors",
  };
  expect(() => parseAuthoringProject(JSON.stringify(value))).toThrow(
    "composition control provenance",
  );
});

it("requires a reviewed bible and all normalized landmarks", () => {
  let project = createAuthoringProject(concept, {
    projectId: "project-1",
    createdAt: 100,
  });
  project = updateCharacterBible(project, {
    displayName: "Aoi",
    style: "clean anime line art",
    palette: "navy and blue",
    outfit: "navy librarian jacket",
    identityNotes: "round glasses and shoulder-length blue hair",
  });
  expect(isCharacterBibleComplete(project)).toBe(false);
  for (const name of [
    "leftEye",
    "rightEye",
    "nose",
    "mouth",
    "chin",
    "neck",
  ] as const)
    project = setProjectLandmark(project, name, { x: 0.5, y: 0.5 });
  expect(isCharacterBibleComplete(project)).toBe(true);
  expect(parseAuthoringProject(serializeAuthoringProject(project))).toEqual(
    project,
  );
});

it("allows bounded optional parts but never disables a required part", () => {
  const project = createAuthoringProject(concept, {
    projectId: "project-1",
    createdAt: 100,
  });
  const withAccessory = setPartEnabled(project, "accessory", true);
  expect(
    withAccessory.partPlan.find((entry) => entry.id === "accessory")?.enabled,
  ).toBe(true);
  expect(() => setPartEnabled(project, "face base", false)).toThrow(
    "invalid part plan",
  );
});
