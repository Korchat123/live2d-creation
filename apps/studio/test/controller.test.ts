import { describe, expect, it } from "vitest";
import manifest from "../../../assets/fixtures/minimal-avatar/avatar.json" with { type: "json" };
import {
  TrustedStudioAdapter,
  actionCommand,
  resetCommand,
  setCommand,
} from "../src/controller.js";

describe("TrustedStudioAdapter", () => {
  it("uses one validated path for human and AI input", () => {
    const adapter = new TrustedStudioAdapter(manifest);
    expect(
      adapter.submit(
        setCommand(adapter.createId("ai"), {
          channel: "mouthOpen",
          value: 0.7,
        }),
        "ai",
      ).accepted,
    ).toBe(true);
    expect(
      adapter.submit(
        setCommand(adapter.createId("human"), {
          channel: "gaze",
          x: 0.5,
          y: -0.25,
        }),
        "human",
      ).accepted,
    ).toBe(true);
    expect(adapter.snapshot().pose).toMatchObject({
      gaze: { x: 0.5, y: -0.25 },
      mouthOpen: 0.7,
    });
  });

  it("rejects unsupported content without changing pose", () => {
    const adapter = new TrustedStudioAdapter(manifest);
    const before = adapter.snapshot().pose;
    const result = adapter.submit(
      actionCommand(adapter.createId("ai"), "motion", "unknown-motion"),
      "ai",
    );
    expect(result.accepted).toBe(false);
    expect(adapter.snapshot().pose).toEqual(before);
  });

  it("supports authored blink and stable reset", () => {
    const adapter = new TrustedStudioAdapter(manifest);
    expect(
      adapter.submit(actionCommand(adapter.createId("human"), "blink"), "human")
        .accepted,
    ).toBe(true);
    expect(
      adapter.submit(resetCommand(adapter.createId("human")), "human").accepted,
    ).toBe(true);
    expect(adapter.snapshot().pose).toMatchObject({
      gaze: { x: 0, y: 0 },
      mouthOpen: 0,
      expression: null,
      motion: null,
      pose: null,
    });
  });

  it("accepts declared semantic expression and motion identifiers", () => {
    const adapter = new TrustedStudioAdapter(manifest);
    expect(
      adapter.submit(
        actionCommand(adapter.createId("human"), "expression", "happy"),
        "human",
      ).accepted,
    ).toBe(true);
    expect(
      adapter.submit(
        actionCommand(adapter.createId("ai"), "motion", "wave"),
        "ai",
      ).accepted,
    ).toBe(true);
  });

  it("records only accepted provider-neutral commands with deterministic offsets", () => {
    let now = 100;
    const adapter = new TrustedStudioAdapter(manifest, { now: () => now });
    adapter.startRecording();
    now = 125;
    adapter.submit(
      setCommand(adapter.createId("human"), {
        channel: "mouthOpen",
        value: 0.4,
      }),
      "human",
    );
    now = 180;
    adapter.submit(
      actionCommand(adapter.createId("ai"), "motion", "unknown-motion"),
      "ai",
    );
    const recording = adapter.stopRecording();

    expect(recording).toEqual({
      format: "open-avatar-studio-recording",
      version: 1,
      commands: [
        expect.objectContaining({
          atMs: 25,
          source: "human",
          command: expect.objectContaining({ type: "control.set" }),
        }),
      ],
    });
    expect(adapter.diagnostics()).toHaveLength(2);
    expect(adapter.diagnostics()[1]).toMatchObject({
      accepted: false,
      source: "ai",
    });
  });
});
