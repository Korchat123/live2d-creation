import { describe, expect, it, vi } from "vitest";
import { createSemanticController } from "../src/index.js";

describe("createSemanticController", () => {
  it("only forwards allowlisted semantic actions", () => {
    const submit = vi.fn(() => ({
      protocolVersion: "1.0",
      type: "ack" as const,
      requestId: "semantic-1",
      status: "accepted" as const,
    }));
    const controller = createSemanticController(
      { submit },
      { expressions: ["happy"], motions: ["wave"] },
    );

    expect(controller.send({ type: "expression", id: "happy" })).toMatchObject({
      type: "ack",
    });
    expect(submit).toHaveBeenCalledWith({
      protocolVersion: "1.0",
      id: "semantic-1",
      type: "action.play",
      payload: { action: "expression", contentId: "happy" },
    });
    expect(controller.send({ type: "motion", id: "unapproved" })).toMatchObject(
      {
        type: "error",
        code: "UNKNOWN_CONTENT",
        retryable: false,
      },
    );
    expect(submit).toHaveBeenCalledOnce();
  });

  it("uses bounded protocol channels for continuous cues and reset", () => {
    const submit = vi.fn(() => ({
      protocolVersion: "1.0",
      type: "ack" as const,
      requestId: "ok",
      status: "accepted" as const,
    }));
    const controller = createSemanticController({ submit });
    controller.send({ type: "gaze", x: 0.2, y: -0.5 });
    controller.send({ type: "mouthOpen", value: 0.4 });
    controller.send({ type: "reset" });

    expect(submit.mock.calls.map(([command]) => command)).toEqual([
      expect.objectContaining({
        type: "control.set",
        payload: { channel: "gaze", x: 0.2, y: -0.5 },
        delivery: { mode: "coalesce", key: "gaze", supersedesPending: true },
      }),
      expect.objectContaining({
        type: "control.set",
        payload: { channel: "mouthOpen", value: 0.4 },
        delivery: {
          mode: "coalesce",
          key: "mouthOpen",
          supersedesPending: true,
        },
      }),
      expect.objectContaining({ type: "control.reset" }),
    ]);
  });
});
