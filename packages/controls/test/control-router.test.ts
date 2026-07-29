import { describe, expect, it } from "vitest";
import { ControlRouter } from "../src/index.js";
import type { OpenAvatarManifest } from "@open-avatar/schema";

const manifest: OpenAvatarManifest = {
  manifestVersion: "1.0",
  id: "test",
  name: "Test",
  canvas: { width: 100, height: 100 },
  assets: [],
  parameters: [],
  capabilities: {
    gaze: true,
    mouthOpen: true,
    blink: true,
    reset: true,
    expression: { content: ["happy"] },
  },
};
const gaze = (id: string, x = 0) => ({
  protocolVersion: "1.0",
  id,
  type: "control.set",
  payload: { channel: "gaze", x, y: 0 },
  delivery: { mode: "coalesce", key: "gaze", supersedesPending: true },
});
const action = (id: string, contentId = "happy") => ({
  protocolVersion: "1.0",
  id,
  type: "action.play",
  payload: { action: "expression", contentId },
});

describe("ControlRouter", () => {
  it("validates hostile input and reports capability discovery", () => {
    const router = new ControlRouter(manifest);
    expect(router.submit({ id: "bad" }, { source: "ai" })).toMatchObject({
      type: "error",
      code: "INVALID_ENVELOPE",
    });
    expect(
      router.submit(
        { protocolVersion: "1.0", id: "q", type: "capability.query" },
        { source: "ai" },
      ),
    ).toMatchObject({
      type: "capability.report",
      capabilities: expect.arrayContaining(["gaze", "expression"]),
      content: { expressions: ["happy"] },
    });
    expect(
      router.submit(
        { protocolVersion: "1.1", id: "q-next", type: "capability.query" },
        { source: "ai" },
      ),
    ).toMatchObject({ type: "capability.report", requestId: "q-next" });
  });

  it("rejects unsupported capabilities and unknown content", () => {
    const router = new ControlRouter(manifest);
    expect(
      router.submit(
        {
          protocolVersion: "1.0",
          id: "pose",
          type: "action.play",
          payload: { action: "pose", contentId: "x" },
        },
        { source: "ai" },
      ),
    ).toMatchObject({ code: "UNSUPPORTED_CAPABILITY" });
    expect(
      router.submit(action("unknown", "sad"), { source: "ai" }),
    ).toMatchObject({
      code: "UNKNOWN_CONTENT",
    });
  });

  it("coalesces continuous commands and prioritizes trusted human input", () => {
    const router = new ControlRouter(manifest);
    router.submit(gaze("ai-1", -1), { source: "ai" });
    router.submit(gaze("ai-2", 0.5), { source: "ai" });
    router.submit(action("human"), { source: "human" });
    expect(router.pending).toBe(2);
    const drained = router.drain();
    expect(drained.map((item) => item.command.id)).toEqual(["human", "ai-2"]);
  });

  it("cancels queued work and bounds source rate and queue size", () => {
    let now = 0;
    const router = new ControlRouter(manifest, {
      now: () => now,
      policy: {
        queueLimit: 1,
        globalCommandsPerSecond: 2,
        sourceCommandsPerSecond: { human: 2, ai: 1, automation: 2 },
      },
    });
    expect(router.submit(action("one"), { source: "ai" })).toMatchObject({
      type: "ack",
    });
    expect(router.submit(action("two"), { source: "ai" })).toMatchObject({
      code: "RATE_LIMITED",
    });
    expect(
      router.submit(
        {
          protocolVersion: "1.0",
          id: "cancel",
          type: "command.cancel",
          payload: { commandId: "one" },
        },
        { source: "human" },
      ),
    ).toMatchObject({ type: "ack" });
    expect(router.pending).toBe(0);
    now = 1_001;
    expect(router.submit(action("three"), { source: "ai" })).toMatchObject({
      type: "ack",
    });
  });
});
