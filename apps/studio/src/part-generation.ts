import type {
  AuthoringProject,
  CharacterBible,
  NormalizedPoint,
  PartId,
} from "./authoring-project.js";
import {
  addPartCandidate,
  dependencyOrderedParts,
  type PartArtifact,
  type PartRevisionState,
} from "./part-artifacts.js";

export const partGenerationTemplateId = "open-avatar-purpose-part-v1";

export type PartGenerationStage =
  | "base-body"
  | "face"
  | "hair"
  | "clothing"
  | "accessory";

export type PartGenerationJob = Readonly<{
  templateId: typeof partGenerationTemplateId;
  partId: PartId;
  stage: PartGenerationStage;
  dependencies: readonly PartId[];
  sourceConceptSha256: string;
  checkpoint: string;
  seed: number;
  canvas: Readonly<{ width: 2048; height: 2048 }>;
  anchor: NormalizedPoint;
  prompt: string;
  negative: string;
  minimumConcealedOverlapPixels: 24;
}>;

export interface PartGenerationProvider {
  generatePart(
    job: PartGenerationJob,
    signal: AbortSignal,
  ): Promise<PartArtifact>;
}

const partPurpose: Readonly<Record<PartId, string>> = {
  "back hair": "complete rear hair mass including scalp beneath front hair",
  torso:
    "adult neutral anatomy foundation covered by an opaque full-coverage fitted base suit, complete torso beneath neck, outfit, and arm boundaries",
  neck: "complete neck continuing beneath head and clothing, natural skin tone under neutral white light",
  "face base":
    "complete face and ears without eyes, brows, mouth, or front hair",
  "left eye white": "complete left sclera extending beneath both eyelids",
  "right eye white": "complete right sclera extending beneath both eyelids",
  "left pupil iris": "complete left iris and pupil beneath eyelids",
  "right pupil iris": "complete right iris and pupil beneath eyelids",
  "left eye highlight": "separate left-eye catchlight",
  "right eye highlight": "separate right-eye catchlight",
  "left upper eyelid": "complete left upper eyelid and lash line",
  "right upper eyelid": "complete right upper eyelid and lash line",
  "left lower eyelid": "complete left lower eyelid line",
  "right lower eyelid": "complete right lower eyelid line",
  "left eyebrow": "complete left eyebrow beneath front hair",
  "right eyebrow": "complete right eyebrow beneath front hair",
  "mouth interior": "complete dark mouth cavity beneath lips",
  tongue: "separate tongue extending beneath teeth and lips",
  teeth: "separate teeth extending beneath lips",
  "mouth closed lips": "complete closed lip line",
  "front hair":
    "complete bangs and side locks with roots beneath overlapping hair",
  "left side hair": "separate left side hair lock with hidden root overlap",
  "right side hair": "separate right side hair lock with hidden root overlap",
  "outfit front":
    "complete front outfit extending beneath neck, hair, and arms",
  "coat tails": "separate rear coat or cape tails extending beneath the torso",
  "left sleeve": "complete left sleeve and cuff with shoulder overlap",
  "right sleeve": "complete right sleeve and cuff with shoulder overlap",
  corset: "separate fitted corset or waistcoat front with concealed edges",
  "skirt layers": "complete layered skirt and ruffles beneath the bodice",
  "left leg":
    "complete adult left leg from hip to ankle covered by the opaque neutral base suit, before stockings or clothing",
  "right leg":
    "complete adult right leg from hip to ankle covered by the opaque neutral base suit, before stockings or clothing",
  "left footwear": "separate complete left shoe or boot with ankle overlap",
  "right footwear": "separate complete right shoe or boot with ankle overlap",
  headwear: "complete separate hat or headpiece without hair or face",
  "held prop": "complete separate held prop with clean hand attachment area",
  accessory: "complete separate accessory with attachment area concealed",
  "left arm and hand":
    "complete adult left arm and hand extending beneath torso clothing, with upper arm covered by the opaque neutral base suit",
  "right arm and hand":
    "complete adult right arm and hand extending beneath torso clothing, with upper arm covered by the opaque neutral base suit",
};

const partStage: Readonly<Record<PartId, PartGenerationStage>> = {
  torso: "base-body",
  neck: "base-body",
  "face base": "base-body",
  "left leg": "base-body",
  "right leg": "base-body",
  "left arm and hand": "base-body",
  "right arm and hand": "base-body",
  "left eye white": "face",
  "right eye white": "face",
  "left pupil iris": "face",
  "right pupil iris": "face",
  "left eye highlight": "face",
  "right eye highlight": "face",
  "left upper eyelid": "face",
  "right upper eyelid": "face",
  "left lower eyelid": "face",
  "right lower eyelid": "face",
  "left eyebrow": "face",
  "right eyebrow": "face",
  "mouth interior": "face",
  tongue: "face",
  teeth: "face",
  "mouth closed lips": "face",
  "back hair": "hair",
  "front hair": "hair",
  "left side hair": "hair",
  "right side hair": "hair",
  "outfit front": "clothing",
  "coat tails": "clothing",
  "left sleeve": "clothing",
  "right sleeve": "clothing",
  corset: "clothing",
  "skirt layers": "clothing",
  "left footwear": "clothing",
  "right footwear": "clothing",
  headwear: "accessory",
  "held prop": "accessory",
  accessory: "accessory",
};

const stageOrder: Readonly<Record<PartGenerationStage, number>> = {
  "base-body": 0,
  face: 1,
  hair: 2,
  clothing: 3,
  accessory: 4,
};

const fallbackAnchors: Readonly<Record<PartId, NormalizedPoint>> = {
  "back hair": { x: 0.5, y: 0.36 },
  torso: { x: 0.5, y: 0.7 },
  neck: { x: 0.5, y: 0.55 },
  "face base": { x: 0.5, y: 0.36 },
  "left eye white": { x: 0.42, y: 0.35 },
  "right eye white": { x: 0.58, y: 0.35 },
  "left pupil iris": { x: 0.42, y: 0.35 },
  "right pupil iris": { x: 0.58, y: 0.35 },
  "left eye highlight": { x: 0.42, y: 0.34 },
  "right eye highlight": { x: 0.58, y: 0.34 },
  "left upper eyelid": { x: 0.42, y: 0.34 },
  "right upper eyelid": { x: 0.58, y: 0.34 },
  "left lower eyelid": { x: 0.42, y: 0.36 },
  "right lower eyelid": { x: 0.58, y: 0.36 },
  "left eyebrow": { x: 0.42, y: 0.3 },
  "right eyebrow": { x: 0.58, y: 0.3 },
  "mouth interior": { x: 0.5, y: 0.47 },
  tongue: { x: 0.5, y: 0.48 },
  teeth: { x: 0.5, y: 0.46 },
  "mouth closed lips": { x: 0.5, y: 0.47 },
  "front hair": { x: 0.5, y: 0.27 },
  "left side hair": { x: 0.36, y: 0.4 },
  "right side hair": { x: 0.64, y: 0.4 },
  "outfit front": { x: 0.5, y: 0.68 },
  "coat tails": { x: 0.5, y: 0.72 },
  "left sleeve": { x: 0.3, y: 0.57 },
  "right sleeve": { x: 0.7, y: 0.57 },
  corset: { x: 0.5, y: 0.55 },
  "skirt layers": { x: 0.5, y: 0.7 },
  "left leg": { x: 0.43, y: 0.8 },
  "right leg": { x: 0.57, y: 0.8 },
  "left footwear": { x: 0.43, y: 0.92 },
  "right footwear": { x: 0.57, y: 0.92 },
  headwear: { x: 0.5, y: 0.14 },
  "held prop": { x: 0.25, y: 0.65 },
  accessory: { x: 0.64, y: 0.45 },
  "left arm and hand": { x: 0.32, y: 0.7 },
  "right arm and hand": { x: 0.68, y: 0.7 },
};

const landmarkAnchor = (
  project: AuthoringProject,
  partId: PartId,
): NormalizedPoint => {
  if (partId.startsWith("left eye"))
    return project.landmarks.leftEye ?? fallbackAnchors[partId];
  if (partId.startsWith("right eye"))
    return project.landmarks.rightEye ?? fallbackAnchors[partId];
  if (partId.includes("mouth") || partId === "tongue" || partId === "teeth")
    return project.landmarks.mouth ?? fallbackAnchors[partId];
  if (partId === "neck")
    return project.landmarks.neck ?? fallbackAnchors[partId];
  return fallbackAnchors[partId];
};

const biblePrompt = (bible: CharacterBible, includeWardrobe: boolean): string =>
  [
    bible.displayName,
    bible.style,
    bible.palette,
    includeWardrobe ? bible.outfit : "",
    bible.identityNotes,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");

export const createPartGenerationJobs = (
  project: AuthoringProject,
): readonly PartGenerationJob[] => {
  const sourceConceptSha256 = project.acceptedConcept.provenance.artifactSha256;
  const orderedParts = [...dependencyOrderedParts(project.partPlan)].sort(
    (left, right) => stageOrder[partStage[left]] - stageOrder[partStage[right]],
  );
  return orderedParts.map((partId, index) => ({
    templateId: partGenerationTemplateId,
    partId,
    stage: partStage[partId],
    dependencies:
      project.partPlan.find((entry) => entry.id === partId)?.dependencies ?? [],
    sourceConceptSha256,
    checkpoint:
      project.acceptedConcept.provenance.partCheckpoint ??
      project.acceptedConcept.provenance.checkpoint,
    seed: (project.acceptedConcept.provenance.seed + index + 1) >>> 0,
    canvas: { width: 2048, height: 2048 },
    anchor: landmarkAnchor(project, partId),
    prompt: `same approved adult character, ${biblePrompt(project.characterBible, partStage[partId] === "clothing" || partStage[partId] === "accessory")}, ${partStage[partId]} generation stage, purpose-generated ${partId}, ${partPurpose[partId]}, preserve the registered pose and body anchors, full-canvas aligned RGBA layer, transparent background, clean anime line art${partStage[partId] === "clothing" || partStage[partId] === "accessory" ? ", separate wearable layer fitted over the approved base body, do not repaint skin, face, or hair" : ", no clothing or accessory instructions"}`,
    negative:
      "different character, identity drift, crop, opaque background, duplicate part, flattened character, watermark, text, signature, unrelated object, nudity, underwear, lingerie, exposed intimate anatomy, child body, colored skin cast",
    minimumConcealedOverlapPixels: 24,
  }));
};

export const nextGeneratableJobs = (
  jobs: readonly PartGenerationJob[],
  state: PartRevisionState,
): readonly PartGenerationJob[] =>
  jobs.filter(
    (job) =>
      !state.accepted[job.partId] &&
      job.dependencies.every((dependency) => state.accepted[dependency]),
  );

export const generatePartVariant = async (
  provider: PartGenerationProvider,
  job: PartGenerationJob,
  state: PartRevisionState,
  signal: AbortSignal,
): Promise<PartRevisionState> => {
  if (signal.aborted)
    throw new DOMException("Generation cancelled.", "AbortError");
  if (!job.dependencies.every((dependency) => state.accepted[dependency]))
    throw new Error("Accept every dependency before generating this part.");
  const artifact = await provider.generatePart(job, signal);
  if (
    artifact.partId !== job.partId ||
    artifact.provenance.sourceConceptSha256 !== job.sourceConceptSha256
  )
    throw new Error(
      "The provider returned an artifact for the wrong part or concept.",
    );
  return addPartCandidate(state, artifact);
};
