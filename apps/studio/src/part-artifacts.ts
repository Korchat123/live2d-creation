import {
  partDefinitions,
  partDependencies,
  type NormalizedPoint,
  type PartId,
  type PartPlanEntry,
} from "./authoring-project.js";

export const authoringCanvasSize = 2048;
export const partArtifactVersion = "open-avatar-part-v1";

export type PixelBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type PartArtifactProvenance = Readonly<{
  provider: "comfyui" | "manual" | "fake";
  workflow: string;
  checkpoint: string;
  seed: number;
  sourceConceptSha256: string;
  artifactSha256: string;
}>;

export type PartArtifact = Readonly<{
  version: typeof partArtifactVersion;
  partId: PartId;
  candidateId: string;
  revision: number;
  width: typeof authoringCanvasSize;
  height: typeof authoringCanvasSize;
  mimeType: "image/png";
  anchor: NormalizedPoint;
  alphaBounds: PixelBounds;
  concealedOverlapPixels: number;
  provenance: PartArtifactProvenance;
}>;

export type PartCandidate = Readonly<{
  artifact: PartArtifact;
  status: "pending" | "accepted" | "rejected";
}>;

export type PartRevisionState = Readonly<{
  candidates: Readonly<Partial<Record<PartId, readonly PartCandidate[]>>>;
  accepted: Readonly<Partial<Record<PartId, string>>>;
}>;

export type PartValidationIssue = Readonly<{
  code:
    | "invalid-dimensions"
    | "invalid-pixels"
    | "empty-alpha"
    | "clipped-alpha"
    | "anchor-mismatch"
    | "missing-concealed-overlap"
    | "duplicate-content"
    | "missing-required-part";
  partId: PartId;
  message: string;
}>;

const sha256Pattern = /^[a-f0-9]{64}$/u;
const candidateIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/u;

const assertPoint = (point: NormalizedPoint, label: string): void => {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x > 1 ||
    point.y < 0 ||
    point.y > 1
  )
    throw new Error(`Invalid ${label}.`);
};

export const dependencyOrderedParts = (
  plan: readonly PartPlanEntry[],
): readonly PartId[] => {
  const enabled = new Set(
    plan.filter((entry) => entry.enabled).map((entry) => entry.id),
  );
  const visiting = new Set<PartId>();
  const visited = new Set<PartId>();
  const ordered: PartId[] = [];

  const visit = (partId: PartId): void => {
    if (!enabled.has(partId) || visited.has(partId)) return;
    if (visiting.has(partId))
      throw new Error("The part plan contains a cycle.");
    visiting.add(partId);
    partDependencies[partId].forEach(visit);
    visiting.delete(partId);
    visited.add(partId);
    ordered.push(partId);
  };

  plan.forEach((entry) => visit(entry.id));
  return ordered;
};

export const alphaBounds = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): PixelBounds | undefined => {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    rgba.length !== width * height * 4
  )
    return undefined;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if ((rgba[pixel * 4 + 3] ?? 0) === 0) continue;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return right < left
    ? undefined
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
};

export const validatePartPixels = (
  partId: PartId,
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  expectedAnchor: NormalizedPoint,
  concealedOverlapPixels: number,
  options: Readonly<{
    anchorTolerance?: number;
    minimumConcealedOverlapPixels?: number;
  }> = {},
): readonly PartValidationIssue[] => {
  assertPoint(expectedAnchor, "expected part anchor");
  const issues: PartValidationIssue[] = [];
  if (width !== authoringCanvasSize || height !== authoringCanvasSize) {
    issues.push({
      code: "invalid-dimensions",
      partId,
      message: `Part must use the ${authoringCanvasSize} by ${authoringCanvasSize} authoring canvas.`,
    });
    return issues;
  }
  if (rgba.length !== width * height * 4) {
    issues.push({
      code: "invalid-pixels",
      partId,
      message: "Part RGBA byte length does not match its dimensions.",
    });
    return issues;
  }
  const bounds = alphaBounds(rgba, width, height);
  if (!bounds) {
    issues.push({
      code: "empty-alpha",
      partId,
      message: "Part has no visible pixels.",
    });
    return issues;
  }
  if (
    bounds.x === 0 ||
    bounds.y === 0 ||
    bounds.x + bounds.width === width ||
    bounds.y + bounds.height === height
  )
    issues.push({
      code: "clipped-alpha",
      partId,
      message: "Visible artwork touches the canvas edge and may be clipped.",
    });

  const centerX = (bounds.x + bounds.width / 2) / width;
  const centerY = (bounds.y + bounds.height / 2) / height;
  const tolerance = options.anchorTolerance ?? 0.08;
  if (
    Math.hypot(centerX - expectedAnchor.x, centerY - expectedAnchor.y) >
    tolerance
  )
    issues.push({
      code: "anchor-mismatch",
      partId,
      message: "Visible artwork is outside the approved anchor tolerance.",
    });

  const requiredOverlap = options.minimumConcealedOverlapPixels ?? 24;
  if (
    !Number.isSafeInteger(concealedOverlapPixels) ||
    concealedOverlapPixels < requiredOverlap
  )
    issues.push({
      code: "missing-concealed-overlap",
      partId,
      message: `Part needs at least ${requiredOverlap} pixels of concealed overlap.`,
    });
  return issues;
};

export const validatePartArtifact = (artifact: PartArtifact): void => {
  if (
    artifact.version !== partArtifactVersion ||
    !partDefinitions.some(({ id }) => id === artifact.partId) ||
    !candidateIdPattern.test(artifact.candidateId) ||
    !Number.isSafeInteger(artifact.revision) ||
    artifact.revision < 1 ||
    artifact.width !== authoringCanvasSize ||
    artifact.height !== authoringCanvasSize ||
    artifact.mimeType !== "image/png" ||
    !Number.isSafeInteger(artifact.concealedOverlapPixels) ||
    artifact.concealedOverlapPixels < 0
  )
    throw new Error("Invalid part artifact.");
  assertPoint(artifact.anchor, "part anchor");
  const { alphaBounds: bounds, provenance } = artifact;
  if (
    !Number.isSafeInteger(bounds.x) ||
    !Number.isSafeInteger(bounds.y) ||
    !Number.isSafeInteger(bounds.width) ||
    !Number.isSafeInteger(bounds.height) ||
    bounds.x < 0 ||
    bounds.y < 0 ||
    bounds.width < 1 ||
    bounds.height < 1 ||
    bounds.x + bounds.width > authoringCanvasSize ||
    bounds.y + bounds.height > authoringCanvasSize ||
    !["comfyui", "manual", "fake"].includes(provenance.provider) ||
    provenance.workflow.length < 1 ||
    provenance.workflow.length > 256 ||
    provenance.checkpoint.length > 256 ||
    !Number.isSafeInteger(provenance.seed) ||
    provenance.seed < 0 ||
    provenance.seed > 0xffffffff ||
    !sha256Pattern.test(provenance.sourceConceptSha256) ||
    !sha256Pattern.test(provenance.artifactSha256)
  )
    throw new Error("Invalid part artifact provenance or bounds.");
};

export const emptyPartRevisionState = (): PartRevisionState => ({
  candidates: {},
  accepted: {},
});

export const addPartCandidate = (
  state: PartRevisionState,
  artifact: PartArtifact,
): PartRevisionState => {
  validatePartArtifact(artifact);
  const existing = state.candidates[artifact.partId] ?? [];
  if (
    existing.some(
      ({ artifact: item }) => item.candidateId === artifact.candidateId,
    )
  )
    throw new Error("Part candidate id already exists.");
  return {
    candidates: {
      ...state.candidates,
      [artifact.partId]: [...existing, { artifact, status: "pending" }],
    },
    accepted: { ...state.accepted },
  };
};

const decidePartCandidate = (
  state: PartRevisionState,
  partId: PartId,
  candidateId: string,
  status: "accepted" | "rejected",
): PartRevisionState => {
  const candidates = state.candidates[partId] ?? [];
  if (!candidates.some(({ artifact }) => artifact.candidateId === candidateId))
    throw new Error("Unknown part candidate.");
  const next = candidates.map((candidate) => ({
    ...candidate,
    status:
      candidate.artifact.candidateId === candidateId
        ? status
        : status === "accepted" && candidate.status === "accepted"
          ? "rejected"
          : candidate.status,
  })) satisfies readonly PartCandidate[];
  const accepted = { ...state.accepted };
  if (status === "accepted") accepted[partId] = candidateId;
  else if (accepted[partId] === candidateId) delete accepted[partId];
  return {
    candidates: { ...state.candidates, [partId]: next },
    accepted,
  };
};

export const acceptPartCandidate = (
  state: PartRevisionState,
  partId: PartId,
  candidateId: string,
): PartRevisionState =>
  decidePartCandidate(state, partId, candidateId, "accepted");

export const rejectPartCandidate = (
  state: PartRevisionState,
  partId: PartId,
  candidateId: string,
): PartRevisionState =>
  decidePartCandidate(state, partId, candidateId, "rejected");

export const validateAcceptedParts = (
  plan: readonly PartPlanEntry[],
  state: PartRevisionState,
): readonly PartValidationIssue[] => {
  const issues: PartValidationIssue[] = [];
  const hashes = new Map<string, PartId>();
  for (const entry of plan) {
    if (!entry.enabled) continue;
    const candidateId = state.accepted[entry.id];
    const candidate = (state.candidates[entry.id] ?? []).find(
      ({ artifact }) => artifact.candidateId === candidateId,
    );
    if (!candidate) {
      if (entry.required)
        issues.push({
          code: "missing-required-part",
          partId: entry.id,
          message: `Required part ${entry.id} has no accepted artifact.`,
        });
      continue;
    }
    const hash = candidate.artifact.provenance.artifactSha256;
    const duplicateOf = hashes.get(hash);
    if (duplicateOf)
      issues.push({
        code: "duplicate-content",
        partId: entry.id,
        message: `Part duplicates the accepted ${duplicateOf} artifact.`,
      });
    else hashes.set(hash, entry.id);
  }
  return issues;
};
