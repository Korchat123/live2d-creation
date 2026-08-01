import {
  conceptTemplateId,
  partsFirstTemplateId,
  type ConceptProvenance,
} from "./generation-provider.js";
import {
  compositionControlVersion,
  legacyCompositionControlVersion,
} from "./composition-control.js";

const MAX_CONCEPT_DATA_URL_LENGTH = 6 * 1024 * 1024;
const MAX_PROJECT_LENGTH = MAX_CONCEPT_DATA_URL_LENGTH + 96 * 1024;

export const partDefinitions = [
  { id: "back hair", required: true },
  { id: "torso", required: true },
  { id: "neck", required: true },
  { id: "face base", required: true },
  { id: "left eye white", required: true },
  { id: "right eye white", required: true },
  { id: "left pupil iris", required: true },
  { id: "right pupil iris", required: true },
  { id: "left eye highlight", required: true },
  { id: "right eye highlight", required: true },
  { id: "left upper eyelid", required: true },
  { id: "right upper eyelid", required: true },
  { id: "left lower eyelid", required: true },
  { id: "right lower eyelid", required: true },
  { id: "left eyebrow", required: true },
  { id: "right eyebrow", required: true },
  { id: "mouth interior", required: true },
  { id: "tongue", required: false },
  { id: "teeth", required: false },
  { id: "mouth closed lips", required: true },
  { id: "front hair", required: true },
  { id: "left side hair", required: false },
  { id: "right side hair", required: false },
  { id: "outfit front", required: true },
  { id: "coat tails", required: false },
  { id: "left sleeve", required: false },
  { id: "right sleeve", required: false },
  { id: "corset", required: false },
  { id: "skirt layers", required: false },
  { id: "left leg", required: true },
  { id: "right leg", required: true },
  { id: "left footwear", required: true },
  { id: "right footwear", required: true },
  { id: "headwear", required: false },
  { id: "held prop", required: false },
  { id: "accessory", required: false },
  { id: "left arm and hand", required: false },
  { id: "right arm and hand", required: false },
] as const;

export type PartId = (typeof partDefinitions)[number]["id"];
export const partDependencies: Readonly<Record<PartId, readonly PartId[]>> = {
  "back hair": [],
  torso: [],
  neck: ["torso"],
  "face base": ["neck"],
  "left eye white": ["face base"],
  "right eye white": ["face base"],
  "left pupil iris": ["left eye white"],
  "right pupil iris": ["right eye white"],
  "left eye highlight": ["left pupil iris"],
  "right eye highlight": ["right pupil iris"],
  "left upper eyelid": ["face base"],
  "right upper eyelid": ["face base"],
  "left lower eyelid": ["face base"],
  "right lower eyelid": ["face base"],
  "left eyebrow": ["face base"],
  "right eyebrow": ["face base"],
  "mouth interior": ["face base"],
  tongue: ["mouth interior"],
  teeth: ["mouth interior"],
  "mouth closed lips": ["mouth interior"],
  "front hair": ["back hair", "face base"],
  "left side hair": ["back hair"],
  "right side hair": ["back hair"],
  "outfit front": ["torso", "neck"],
  "coat tails": ["outfit front"],
  "left sleeve": ["outfit front"],
  "right sleeve": ["outfit front"],
  corset: ["outfit front"],
  "skirt layers": ["outfit front"],
  "left leg": ["torso"],
  "right leg": ["torso"],
  "left footwear": ["left leg"],
  "right footwear": ["right leg"],
  headwear: ["front hair"],
  "held prop": ["left arm and hand"],
  accessory: ["front hair", "outfit front"],
  "left arm and hand": ["torso"],
  "right arm and hand": ["torso"],
};

export type PartPlanEntry = Readonly<{
  id: PartId;
  required: boolean;
  enabled: boolean;
  dependencies: readonly PartId[];
}>;

export const defaultPartPlan: readonly PartPlanEntry[] = partDefinitions.map(
  ({ id, required }) => ({
    id,
    required,
    enabled: required,
    dependencies: partDependencies[id],
  }),
);

export const createPromptPartPlan = (
  prompt: string,
): readonly PartPlanEntry[] => {
  const value = prompt.toLowerCase();
  const enabled = new Set<PartId>([
    "tongue",
    "teeth",
    "left arm and hand",
    "right arm and hand",
  ]);
  const enableWhen = (pattern: RegExp, ...parts: PartId[]) => {
    if (pattern.test(value)) parts.forEach((part) => enabled.add(part));
  };
  enableWhen(
    /long(?:\s+[a-z-]+){0,4}\s+hair|twin.?tail|side lock|braid/u,
    "left side hair",
    "right side hair",
  );
  enableWhen(/hat|hood|crown|cap|headwear|headpiece|tiara/u, "headwear");
  enableWhen(
    /cane|staff|wand|sword|spear|weapon|holding|umbrella/u,
    "held prop",
  );
  enableWhen(
    /coat|tailcoat|cape|cloak/u,
    "coat tails",
    "left sleeve",
    "right sleeve",
  );
  enableWhen(/sleeve|cuff|jacket/u, "left sleeve", "right sleeve");
  enableWhen(/corset|waistcoat/u, "corset");
  enableWhen(/dress|skirt|ruffle|petticoat/u, "skirt layers");
  enableWhen(
    /glasses|choker|necklace|earring|ribbon|brooch|jewelry|accessory/u,
    "accessory",
  );
  return defaultPartPlan.map((entry) => ({
    ...entry,
    enabled: entry.required || enabled.has(entry.id),
  }));
};

export const landmarkNames = [
  "leftEye",
  "rightEye",
  "nose",
  "mouth",
  "chin",
  "neck",
] as const;

export type LandmarkName = (typeof landmarkNames)[number];
export type NormalizedPoint = Readonly<{ x: number; y: number }>;

export type CharacterBible = Readonly<{
  displayName: string;
  style: string;
  palette: string;
  outfit: string;
  identityNotes: string;
  canvasWidth: 2048;
  canvasHeight: 2048;
}>;

export type AcceptedConcept = Readonly<{
  image: string;
  width: number;
  height: number;
  prompt: string;
  provenance: ConceptProvenance;
}>;

export type AuthoringProject = Readonly<{
  version: 1;
  projectId: string;
  createdAt: number;
  activeRevision: 1;
  acceptedConcept: AcceptedConcept;
  characterBible: CharacterBible;
  landmarks: Readonly<Partial<Record<LandmarkName, NormalizedPoint>>>;
  partPlan: readonly PartPlanEntry[];
  rights: Readonly<{
    status: "blocked";
    reason: string;
  }>;
}>;

const boundedText = (
  value: unknown,
  label: string,
  maximum: number,
): string => {
  if (typeof value !== "string" || value.length > maximum)
    throw new Error(`Invalid ${label}.`);
  return value;
};

export const validateAcceptedConcept = (concept: AcceptedConcept): void => {
  if (
    !concept.image.startsWith("data:image/png;base64,") &&
    !concept.image.startsWith("data:image/webp;base64,")
  )
    throw new Error("The accepted concept must be an embedded PNG or WebP.");
  if (concept.image.length > MAX_CONCEPT_DATA_URL_LENGTH)
    throw new Error("The accepted concept exceeds the project image limit.");
  if (
    !Number.isInteger(concept.width) ||
    !Number.isInteger(concept.height) ||
    concept.width < 1 ||
    concept.height < 1 ||
    concept.width > 1024 ||
    concept.height > 1152
  )
    throw new Error("The accepted concept dimensions are invalid.");
  boundedText(concept.prompt, "concept prompt", 16 * 1024);
  if (
    !["comfyui", "fake"].includes(concept.provenance.provider) ||
    ![conceptTemplateId, partsFirstTemplateId].includes(
      concept.provenance.templateId,
    ) ||
    !/^[a-f0-9]{64}$/u.test(concept.provenance.artifactSha256) ||
    !Number.isSafeInteger(concept.provenance.seed) ||
    concept.provenance.seed < 0 ||
    concept.provenance.seed > 0xffffffff
  )
    throw new Error("The accepted concept provenance is invalid.");
  boundedText(concept.provenance.checkpoint, "checkpoint", 256);
  if (concept.provenance.compositionControl) {
    if (
      concept.provenance.compositionControl.templateId !==
        compositionControlVersion &&
      concept.provenance.compositionControl.templateId !==
        legacyCompositionControlVersion
    )
      throw new Error("The composition control provenance is invalid.");
    boundedText(
      concept.provenance.compositionControl.controlNet,
      "composition control model",
      256,
    );
  }
};

const validateBible = (value: Partial<CharacterBible>): CharacterBible => ({
  displayName: boundedText(value.displayName, "display name", 120),
  style: boundedText(value.style, "style", 1000),
  palette: boundedText(value.palette, "palette", 1000),
  outfit: boundedText(value.outfit, "outfit", 1000),
  identityNotes: boundedText(value.identityNotes, "identity notes", 2000),
  canvasWidth: 2048,
  canvasHeight: 2048,
});

const validateLandmarks = (
  value: unknown,
): Readonly<Partial<Record<LandmarkName, NormalizedPoint>>> => {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (name) => !landmarkNames.includes(name as LandmarkName),
    )
  )
    throw new Error("The project contains an unknown landmark.");
  const result: Partial<Record<LandmarkName, NormalizedPoint>> = {};
  for (const name of landmarkNames) {
    const point = record[name];
    if (point === undefined) continue;
    if (!point || typeof point !== "object")
      throw new Error(`Invalid ${name} landmark.`);
    const { x, y } = point as { x?: unknown; y?: unknown };
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > 1 ||
      y < 0 ||
      y > 1
    )
      throw new Error(`Invalid ${name} landmark.`);
    result[name] = { x, y };
  }
  return result;
};

const validatePartPlan = (value: unknown): readonly PartPlanEntry[] => {
  if (!Array.isArray(value) || value.length > partDefinitions.length)
    throw new Error("The project part plan is incomplete.");
  const entries = new Map<string, Partial<PartPlanEntry>>();
  for (const item of value) {
    const entry = item as Partial<PartPlanEntry> | undefined;
    if (
      typeof entry?.id !== "string" ||
      entries.has(entry.id) ||
      !partDefinitions.some(({ id }) => id === entry.id)
    )
      throw new Error("The project contains an invalid part plan.");
    entries.set(entry.id, entry);
  }
  return partDefinitions.map((definition) => {
    const entry = entries.get(definition.id);
    if (!entry)
      return {
        id: definition.id,
        required: definition.required,
        enabled: definition.required,
        dependencies: partDependencies[definition.id],
      };
    if (
      entry?.id !== definition.id ||
      entry.required !== definition.required ||
      JSON.stringify(entry.dependencies) !==
        JSON.stringify(partDependencies[definition.id]) ||
      typeof entry.enabled !== "boolean" ||
      (definition.required && !entry.enabled)
    )
      throw new Error("The project contains an invalid part plan.");
    return {
      id: definition.id,
      required: definition.required,
      enabled: entry.enabled,
      dependencies: partDependencies[definition.id],
    };
  });
};

export const createAuthoringProject = (
  concept: AcceptedConcept,
  identity: Readonly<{ projectId: string; createdAt: number }>,
): AuthoringProject => {
  validateAcceptedConcept(concept);
  const projectId = boundedText(identity.projectId, "project id", 128);
  if (!/^[a-zA-Z0-9-]+$/u.test(projectId))
    throw new Error("Invalid project id.");
  if (!Number.isSafeInteger(identity.createdAt) || identity.createdAt < 0)
    throw new Error("Invalid project creation time.");
  return {
    version: 1,
    projectId,
    createdAt: identity.createdAt,
    activeRevision: 1,
    acceptedConcept: concept,
    characterBible: {
      displayName: "",
      style: "",
      palette: "",
      outfit: "",
      identityNotes: "",
      canvasWidth: 2048,
      canvasHeight: 2048,
    },
    landmarks: {},
    partPlan: defaultPartPlan,
    rights: {
      status: "blocked",
      reason:
        "Approve reference, model, generated-output, and project-license evidence before export.",
    },
  };
};

export const updateCharacterBible = (
  project: AuthoringProject,
  patch: Partial<Omit<CharacterBible, "canvasWidth" | "canvasHeight">>,
): AuthoringProject => ({
  ...project,
  characterBible: validateBible({ ...project.characterBible, ...patch }),
});

export const setProjectLandmark = (
  project: AuthoringProject,
  name: LandmarkName,
  point: NormalizedPoint | undefined,
): AuthoringProject => {
  const landmarks = { ...project.landmarks };
  if (point) landmarks[name] = point;
  else delete landmarks[name];
  return { ...project, landmarks: validateLandmarks(landmarks) };
};

export const setPartEnabled = (
  project: AuthoringProject,
  id: PartId,
  enabled: boolean,
): AuthoringProject => ({
  ...project,
  partPlan: validatePartPlan(
    project.partPlan.map((entry) =>
      entry.id === id ? { ...entry, enabled } : entry,
    ),
  ),
});

export const isCharacterBibleComplete = (project: AuthoringProject): boolean =>
  Boolean(
    project.characterBible.displayName.trim() &&
      project.characterBible.style.trim() &&
      project.characterBible.palette.trim() &&
      project.characterBible.outfit.trim() &&
      project.characterBible.identityNotes.trim() &&
      landmarkNames.every((name) => project.landmarks[name]) &&
      project.partPlan.every((entry) => !entry.required || entry.enabled),
  );

export const serializeAuthoringProject = (project: AuthoringProject): string =>
  JSON.stringify(project);

export const parseAuthoringProject = (contents: string): AuthoringProject => {
  if (contents.length > MAX_PROJECT_LENGTH)
    throw new Error("The authoring project exceeds the size limit.");
  const value = JSON.parse(contents) as Partial<AuthoringProject>;
  if (value.version !== 1) throw new Error("Unsupported project version.");
  if (
    !value.acceptedConcept ||
    !value.projectId ||
    value.createdAt === undefined
  )
    throw new Error("The authoring project is incomplete.");
  const rebuilt = createAuthoringProject(value.acceptedConcept, {
    projectId: value.projectId,
    createdAt: value.createdAt,
  });
  if (value.activeRevision !== 1 || value.rights?.status !== "blocked")
    throw new Error("The authoring project contains an invalid v1 structure.");
  return {
    ...rebuilt,
    characterBible: validateBible(value.characterBible ?? {}),
    landmarks: validateLandmarks(value.landmarks),
    partPlan: validatePartPlan(value.partPlan),
  };
};
