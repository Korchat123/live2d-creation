import { describe, expect, it } from "vitest";
import clips from "../../../assets/reference-avatar/animation-clips.json" with { type: "json" };
import {
  REQUIRED_EXPRESSION_IDS,
  REQUIRED_MOTION_IDS,
  evaluateNamedAnimation,
  type NamedAnimationClips,
} from "../src/index.js";

const authored = clips as NamedAnimationClips;

describe("reference avatar clips", () => {
  it("contains every required semantic expression and motion", () => {
    for (const id of REQUIRED_EXPRESSION_IDS)
      expect(authored.expressions[id]).toBeDefined();
    for (const id of REQUIRED_MOTION_IDS)
      expect(authored.motions[id]).toBeDefined();
  });

  it("evaluates authored clips deterministically and within parameter limits", () => {
    const limits = clips.parameters;
    for (const [channel, content] of [
      ["expression", authored.expressions],
      ["motion", authored.motions],
    ] as const) {
      for (const [id, clip] of Object.entries(content)) {
        expect(clip.durationMs).toBeGreaterThan(0);
        for (let timeMs = 0; timeMs <= clip.durationMs; timeMs += 20) {
          const first = evaluateNamedAnimation(authored, channel, id, timeMs);
          const second = evaluateNamedAnimation(authored, channel, id, timeMs);
          expect(first).toEqual(second);
          for (const [parameterId, value] of Object.entries(first ?? {})) {
            const limit = limits[parameterId as keyof typeof limits];
            expect(limit).toBeDefined();
            expect(value).toBeGreaterThanOrEqual(limit!.min);
            expect(value).toBeLessThanOrEqual(limit!.max);
          }
        }
      }
    }
  });
});
