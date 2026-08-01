import {
  validateAcceptedConcept,
  type AcceptedConcept,
} from "./authoring-project.js";

const DATABASE_NAME = "open-avatar-authoring";
const STORE_NAME = "projects";
const ACTIVE_KEY = "front-reference-review-v1";
const MAX_CANDIDATES = 4;
const MAX_REASON_LENGTH = 500;
const MAX_STATE_LENGTH = 28 * 1024 * 1024;

export type ReferenceDecision = "pending" | "rejected" | "accepted";

export type ReferenceCandidate = Readonly<{
  id: string;
  concept: AcceptedConcept;
  decision: ReferenceDecision;
  generatedAt: number;
  reviewedAt?: number;
  reason?: string;
}>;

export type ReferenceReviewState = Readonly<{
  version: 1;
  candidates: readonly ReferenceCandidate[];
  selectedId?: string;
  acceptedId?: string;
  updatedAt: number;
}>;

const validTime = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error(`Invalid ${label}.`);
  return value;
};

const boundedReason = (value: string): string => {
  const reason = value.trim();
  if (reason.length > MAX_REASON_LENGTH)
    throw new Error("The rejection reason is too long.");
  return reason;
};

const candidateById = (
  state: ReferenceReviewState,
  id: string,
): ReferenceCandidate => {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) throw new Error("The reference candidate does not exist.");
  return candidate;
};

const validateCandidate = (value: unknown): ReferenceCandidate => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid reference candidate.");
  const candidate = value as Partial<ReferenceCandidate>;
  const decision = candidate.decision;
  if (
    typeof candidate.id !== "string" ||
    !/^[a-f0-9]{64}$/u.test(candidate.id) ||
    !candidate.concept ||
    !decision ||
    !["pending", "rejected", "accepted"].includes(decision)
  )
    throw new Error("Invalid reference candidate.");
  validateAcceptedConcept(candidate.concept);
  if (candidate.id !== candidate.concept.provenance.artifactSha256)
    throw new Error("The reference candidate hash does not match its ID.");
  const generatedAt = validTime(candidate.generatedAt, "generation time");
  const reviewedAt =
    candidate.reviewedAt === undefined
      ? undefined
      : validTime(candidate.reviewedAt, "review time");
  const reason =
    candidate.reason === undefined
      ? undefined
      : boundedReason(candidate.reason);
  if (
    (decision === "pending" &&
      (reviewedAt !== undefined || reason !== undefined)) ||
    (decision !== "pending" && reviewedAt === undefined)
  )
    throw new Error("The reference decision metadata is invalid.");
  return {
    id: candidate.id,
    concept: candidate.concept,
    decision,
    generatedAt,
    ...(reviewedAt === undefined ? {} : { reviewedAt }),
    ...(reason === undefined ? {} : { reason }),
  };
};

const validateState = (value: unknown): ReferenceReviewState => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid reference review state.");
  const state = value as Partial<ReferenceReviewState>;
  if (
    state.version !== 1 ||
    !Array.isArray(state.candidates) ||
    state.candidates.length > MAX_CANDIDATES
  )
    throw new Error("Unsupported or invalid reference review state.");
  const candidates = state.candidates.map(validateCandidate);
  if (new Set(candidates.map(({ id }) => id)).size !== candidates.length)
    throw new Error("The reference review contains duplicate candidates.");
  const accepted = candidates.filter(({ decision }) => decision === "accepted");
  if (
    accepted.length > 1 ||
    (state.selectedId !== undefined &&
      !candidates.some(({ id }) => id === state.selectedId)) ||
    (state.acceptedId !== undefined &&
      !accepted.some(({ id }) => id === state.acceptedId)) ||
    (accepted.length === 1 && state.acceptedId !== accepted[0]?.id) ||
    (accepted.length === 0 && state.acceptedId !== undefined)
  )
    throw new Error("The reference review decision is invalid.");
  return {
    version: 1,
    candidates,
    ...(state.selectedId === undefined ? {} : { selectedId: state.selectedId }),
    ...(state.acceptedId === undefined ? {} : { acceptedId: state.acceptedId }),
    updatedAt: validTime(state.updatedAt, "review update time"),
  };
};

export const createReferenceReviewState = (now = 0): ReferenceReviewState => ({
  version: 1,
  candidates: [],
  updatedAt: validTime(now, "review update time"),
});

export const addReferenceCandidate = (
  state: ReferenceReviewState,
  concept: AcceptedConcept,
  now: number,
): ReferenceReviewState => {
  validateAcceptedConcept(concept);
  if (state.acceptedId)
    throw new Error("The accepted neutral master is immutable.");
  const id = concept.provenance.artifactSha256;
  if (state.candidates.some((candidate) => candidate.id === id))
    throw new Error("This reference candidate already exists.");
  let previous = state.candidates;
  if (previous.length >= MAX_CANDIDATES) {
    const removable = previous.find(
      ({ id, decision }) => decision === "rejected" && id !== state.selectedId,
    );
    if (!removable)
      throw new Error("Reject or accept a reference before generating more.");
    previous = previous.filter(({ id }) => id !== removable.id);
  }
  return validateState({
    ...state,
    candidates: [
      ...previous,
      { id, concept, decision: "pending", generatedAt: now },
    ],
    selectedId: id,
    updatedAt: now,
  });
};

export const selectReferenceCandidate = (
  state: ReferenceReviewState,
  id: string,
  now: number,
): ReferenceReviewState => {
  candidateById(state, id);
  return validateState({ ...state, selectedId: id, updatedAt: now });
};

export const rejectReferenceCandidate = (
  state: ReferenceReviewState,
  id: string,
  reason: string,
  now: number,
): ReferenceReviewState => {
  if (state.acceptedId)
    throw new Error("The accepted neutral master is immutable.");
  const selected = candidateById(state, id);
  if (selected.decision !== "pending")
    throw new Error("Only a pending reference can be rejected.");
  const candidates = state.candidates.map((candidate) =>
    candidate.id === id
      ? {
          ...candidate,
          decision: "rejected" as const,
          reviewedAt: now,
          reason: boundedReason(reason),
        }
      : candidate,
  );
  const next = candidates.find(({ decision }) => decision === "pending");
  return validateState({
    ...state,
    candidates,
    ...(next ? { selectedId: next.id } : { selectedId: id }),
    updatedAt: now,
  });
};

export const acceptReferenceCandidate = (
  state: ReferenceReviewState,
  id: string,
  now: number,
): ReferenceReviewState => {
  if (state.acceptedId)
    throw new Error("The accepted neutral master is immutable.");
  const selected = candidateById(state, id);
  if (selected.decision !== "pending")
    throw new Error("Only a pending reference can be accepted.");
  return validateState({
    ...state,
    candidates: state.candidates.map((candidate) =>
      candidate.id === id
        ? { ...candidate, decision: "accepted", reviewedAt: now }
        : candidate,
    ),
    selectedId: id,
    acceptedId: id,
    updatedAt: now,
  });
};

export const serializeReferenceReview = (
  state: ReferenceReviewState,
): string => {
  const contents = JSON.stringify(validateState(state));
  if (new TextEncoder().encode(contents).byteLength > MAX_STATE_LENGTH)
    throw new Error("The reference review exceeds the storage limit.");
  return contents;
};

export const parseReferenceReview = (
  contents: string,
): ReferenceReviewState => {
  if (new TextEncoder().encode(contents).byteLength > MAX_STATE_LENGTH)
    throw new Error("The reference review exceeds the storage limit.");
  return validateState(JSON.parse(contents) as unknown);
};

export interface ReferenceReviewStore {
  save(state: ReferenceReviewState): Promise<void>;
  load(): Promise<ReferenceReviewState | undefined>;
}

export class MemoryReferenceReviewStore implements ReferenceReviewStore {
  #contents: string | undefined;

  save(state: ReferenceReviewState): Promise<void> {
    this.#contents = serializeReferenceReview(state);
    return Promise.resolve();
  }

  load(): Promise<ReferenceReviewState | undefined> {
    return Promise.resolve(
      this.#contents ? parseReferenceReview(this.#contents) : undefined,
    );
  }
}

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () =>
      reject(new Error("Could not open reference-review storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });

export class IndexedDbReferenceReviewStore implements ReferenceReviewStore {
  async save(state: ReferenceReviewState): Promise<void> {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.onerror = () =>
          reject(new Error("Could not save the reference review."));
        transaction.oncomplete = () => resolve();
        transaction
          .objectStore(STORE_NAME)
          .put(serializeReferenceReview(state), ACTIVE_KEY);
      });
    } finally {
      database.close();
    }
  }

  async load(): Promise<ReferenceReviewState | undefined> {
    const database = await openDatabase();
    try {
      const contents = await new Promise<unknown>((resolve, reject) => {
        const request = database
          .transaction(STORE_NAME, "readonly")
          .objectStore(STORE_NAME)
          .get(ACTIVE_KEY);
        request.onerror = () =>
          reject(new Error("Could not restore the reference review."));
        request.onsuccess = () => resolve(request.result);
      });
      if (contents === undefined) return undefined;
      if (typeof contents !== "string")
        throw new Error("Stored reference review is invalid.");
      return parseReferenceReview(contents);
    } finally {
      database.close();
    }
  }
}
