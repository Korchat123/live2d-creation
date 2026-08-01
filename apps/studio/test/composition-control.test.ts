import { describe, expect, it } from "vitest";
import {
  compositionControlSize,
  compositionControlVersion,
  compositionPoseJoints,
  compositionPoseSegments,
} from "../src/composition-control.js";

describe("application-owned composition control", () => {
  it("keeps a deterministic full-body pose inside a square control canvas", () => {
    expect(compositionControlVersion).toBe("open-avatar-openpose-v1");
    expect(compositionControlSize).toBe(1024);
    expect(Object.keys(compositionPoseJoints)).toHaveLength(18);
    expect(compositionPoseSegments).toHaveLength(17);
    for (const joint of Object.values(compositionPoseJoints)) {
      expect(joint.x).toBeGreaterThanOrEqual(0.1);
      expect(joint.x).toBeLessThanOrEqual(0.9);
      expect(joint.y).toBeGreaterThanOrEqual(0.1);
      expect(joint.y).toBeLessThanOrEqual(0.92);
      expect(joint.color).toMatch(/^#[0-9a-f]{6}$/u);
    }
  });

  it("references only declared joints", () => {
    for (const segment of compositionPoseSegments) {
      expect(compositionPoseJoints[segment.from]).toBeDefined();
      expect(compositionPoseJoints[segment.to]).toBeDefined();
    }
  });
});
