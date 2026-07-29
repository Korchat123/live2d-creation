import { describe, expect, it } from "vitest";

import { RmsLipSyncProcessor, VisemeMapper } from "../src/index.js";

describe("RmsLipSyncProcessor", () => {
  it("calculates RMS and gates quiet input", () => {
    const processor = new RmsLipSyncProcessor({
      noiseFloor: 0.1,
      fullScale: 0.5,
      attackMs: 10,
      releaseMs: 10,
    });

    const quiet = processor.process(new Float32Array([0.05, -0.05]), 10);
    expect(quiet.rms).toBeCloseTo(0.05);
    expect(quiet.gatedLevel).toBe(0);
    expect(quiet.mouthOpen).toBe(0);
  });

  it("uses attack and release smoothing deterministically", () => {
    const options = {
      noiseFloor: 0,
      fullScale: 1,
      attackMs: 10,
      releaseMs: 100,
    };
    const first = new RmsLipSyncProcessor(options);
    const second = new RmsLipSyncProcessor(options);

    const opened = first.process(new Float32Array([1, -1]), 10);
    const repeated = second.process(new Float32Array([1, -1]), 10);
    expect(opened).toEqual(repeated);
    expect(opened.mouthOpen).toBeCloseTo(1 - Math.exp(-1));

    const released = first.process(new Float32Array([0, 0]), 10);
    expect(released.mouthOpen).toBeGreaterThan(0);
    expect(released.mouthOpen).toBeLessThan(opened.mouthOpen);
  });

  it("bounds hostile amplitudes and rejects invalid or oversized input", () => {
    const processor = new RmsLipSyncProcessor({ maxSamplesPerFrame: 2 });
    expect(processor.process([4, -4], 16).rms).toBe(1);
    expect(() => processor.process([0, Number.NaN], 16)).toThrow(TypeError);
    expect(() => processor.process([0, 0, 0], 16)).toThrow(/sample limit/);
    expect(() => processor.process([0], 0)).toThrow(RangeError);
    expect(() => new RmsLipSyncProcessor({ maxSamplesPerFrame: 1.5 })).toThrow(
      RangeError,
    );
  });

  it("can reset without retaining a sample window", () => {
    const processor = new RmsLipSyncProcessor();
    processor.process([1], 16);
    processor.reset(0.25);
    expect(processor.mouthOpen).toBe(0.25);
  });
});

describe("VisemeMapper", () => {
  it("maps the strongest supported host label", () => {
    const mapper = new VisemeMapper({ AA: "open", OH: "round" });
    expect(mapper.map({ AA: 0.4, OH: 0.8 }, 0.2)).toEqual({
      kind: "viseme",
      id: "round",
      weight: 0.8,
    });
  });

  it("falls back to the RMS mouth level for unsupported or weak labels", () => {
    const mapper = new VisemeMapper({ AA: "open" }, { minimumWeight: 0.2 });
    expect(mapper.map({ unknown: 1, AA: 0.1 }, 0.35)).toEqual({
      kind: "mouthOpen",
      mouthOpen: 0.35,
    });
  });

  it("rejects invalid weights and bounded-input violations", () => {
    const mapper = new VisemeMapper({ AA: "open" }, { maxCandidates: 1 });
    expect(() => mapper.map({ AA: Number.NaN }, 0)).toThrow(RangeError);
    expect(() => mapper.map({ AA: 0.5, OH: 0.5 }, 0)).toThrow(
      /candidate limit/,
    );
    expect(() => mapper.map({}, 2)).toThrow(RangeError);
    expect(() => new VisemeMapper({}, { maxCandidates: 0.5 })).toThrow(
      RangeError,
    );
  });
});
