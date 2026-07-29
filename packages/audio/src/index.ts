const DEFAULT_MAX_SAMPLES = 16_384;

export interface RmsLipSyncOptions {
  /** RMS values at or below this level produce a closed mouth. */
  readonly noiseFloor?: number;
  /** RMS value that produces a fully open mouth. */
  readonly fullScale?: number;
  /** Time constant used while mouth openness is increasing. */
  readonly attackMs?: number;
  /** Time constant used while mouth openness is decreasing. */
  readonly releaseMs?: number;
  /** Maximum samples accepted in one processing call. */
  readonly maxSamplesPerFrame?: number;
  readonly initialMouthOpen?: number;
}

export interface LipSyncFrame {
  readonly rms: number;
  readonly gatedLevel: number;
  readonly mouthOpen: number;
}

const finiteInRange = (
  name: string,
  value: number,
  minimum: number,
  maximum: number,
): number => {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(
      `${name} must be finite and between ${minimum} and ${maximum}`,
    );
  }
  return value;
};

const positiveFinite = (name: string, value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be finite and greater than zero`);
  }
  return value;
};

const positiveSafeInteger = (name: string, value: number): number => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
};

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Stateful, deterministic audio-envelope processor.
 *
 * The processor consumes a sample window synchronously and retains only the
 * previous scalar mouth level. It never stores or exposes raw audio.
 */
export class RmsLipSyncProcessor {
  readonly #noiseFloor: number;
  readonly #fullScale: number;
  readonly #attackMs: number;
  readonly #releaseMs: number;
  readonly #maxSamples: number;
  #mouthOpen: number;

  constructor(options: RmsLipSyncOptions = {}) {
    this.#noiseFloor = finiteInRange(
      "noiseFloor",
      options.noiseFloor ?? 0.02,
      0,
      1,
    );
    this.#fullScale = finiteInRange(
      "fullScale",
      options.fullScale ?? 0.3,
      0,
      1,
    );
    if (this.#fullScale <= this.#noiseFloor) {
      throw new RangeError("fullScale must be greater than noiseFloor");
    }
    this.#attackMs = positiveFinite("attackMs", options.attackMs ?? 35);
    this.#releaseMs = positiveFinite("releaseMs", options.releaseMs ?? 120);
    this.#maxSamples = positiveSafeInteger(
      "maxSamplesPerFrame",
      options.maxSamplesPerFrame ?? DEFAULT_MAX_SAMPLES,
    );
    this.#mouthOpen = finiteInRange(
      "initialMouthOpen",
      options.initialMouthOpen ?? 0,
      0,
      1,
    );
  }

  get mouthOpen(): number {
    return this.#mouthOpen;
  }

  process(samples: ArrayLike<number>, deltaMs: number): LipSyncFrame {
    positiveFinite("deltaMs", deltaMs);
    if (!Number.isSafeInteger(samples.length) || samples.length < 0) {
      throw new RangeError("sample length must be a non-negative safe integer");
    }
    if (samples.length > this.#maxSamples) {
      throw new RangeError(
        `sample window exceeds the ${this.#maxSamples} sample limit`,
      );
    }

    let sumSquares = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      if (sample === undefined || !Number.isFinite(sample)) {
        throw new TypeError(`sample at index ${index} must be finite`);
      }
      const bounded = Math.min(1, Math.max(-1, sample));
      sumSquares += bounded * bounded;
    }

    const rms =
      samples.length === 0 ? 0 : Math.sqrt(sumSquares / samples.length);
    const gatedLevel = clampUnit(
      (rms - this.#noiseFloor) / (this.#fullScale - this.#noiseFloor),
    );
    const timeConstant =
      gatedLevel > this.#mouthOpen ? this.#attackMs : this.#releaseMs;
    const smoothing = 1 - Math.exp(-deltaMs / timeConstant);
    this.#mouthOpen += (gatedLevel - this.#mouthOpen) * smoothing;
    this.#mouthOpen = clampUnit(this.#mouthOpen);

    return Object.freeze({ rms, gatedLevel, mouthOpen: this.#mouthOpen });
  }

  reset(mouthOpen = 0): void {
    this.#mouthOpen = finiteInRange("mouthOpen", mouthOpen, 0, 1);
  }
}

export interface VisemeMapping {
  /** Host/provider label to bundle semantic viseme identifier. */
  readonly [inputLabel: string]: string;
}

export type VisemeFrame =
  | { readonly kind: "viseme"; readonly id: string; readonly weight: number }
  | { readonly kind: "mouthOpen"; readonly mouthOpen: number };

export interface VisemeMapperOptions {
  readonly minimumWeight?: number;
  readonly maxCandidates?: number;
}

/**
 * Maps already-derived host viseme weights to bundle identifiers.
 *
 * This class performs no speech analysis. When no declared label is usable it
 * returns the caller-provided RMS mouth level, keeping RMS the v1 baseline.
 */
export class VisemeMapper {
  readonly #mapping: Readonly<Record<string, string>>;
  readonly #minimumWeight: number;
  readonly #maxCandidates: number;

  constructor(mapping: VisemeMapping, options: VisemeMapperOptions = {}) {
    const entries = Object.entries(mapping);
    if (entries.length > 128)
      throw new RangeError("viseme mapping exceeds 128 entries");
    const normalized: Record<string, string> = Object.create(null) as Record<
      string,
      string
    >;
    for (const [input, output] of entries) {
      if (
        input.length === 0 ||
        input.length > 64 ||
        output.length === 0 ||
        output.length > 64
      ) {
        throw new RangeError(
          "viseme labels must contain between 1 and 64 characters",
        );
      }
      normalized[input] = output;
    }
    this.#mapping = Object.freeze(normalized);
    this.#minimumWeight = finiteInRange(
      "minimumWeight",
      options.minimumWeight ?? 0.05,
      0,
      1,
    );
    this.#maxCandidates = positiveSafeInteger(
      "maxCandidates",
      options.maxCandidates ?? 32,
    );
  }

  map(
    candidates: Readonly<Record<string, number>>,
    fallbackMouthOpen: number,
  ): VisemeFrame {
    finiteInRange("fallbackMouthOpen", fallbackMouthOpen, 0, 1);
    const entries = Object.entries(candidates);
    if (entries.length > this.#maxCandidates) {
      throw new RangeError(
        `viseme candidate count exceeds the ${this.#maxCandidates} candidate limit`,
      );
    }

    let selectedId: string | undefined;
    let selectedWeight = -1;
    for (const [input, weight] of entries) {
      finiteInRange(`viseme weight for ${input}`, weight, 0, 1);
      const output = this.#mapping[input];
      if (
        output !== undefined &&
        weight >= this.#minimumWeight &&
        weight > selectedWeight
      ) {
        selectedId = output;
        selectedWeight = weight;
      }
    }

    return selectedId === undefined
      ? Object.freeze({ kind: "mouthOpen", mouthOpen: fallbackMouthOpen })
      : Object.freeze({
          kind: "viseme",
          id: selectedId,
          weight: selectedWeight,
        });
  }
}
