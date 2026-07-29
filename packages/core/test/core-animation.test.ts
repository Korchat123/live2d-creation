import { describe, expect, it } from "vitest";
import { CoreAnimation, FakeClock, mixParameters } from "../src/index.js";
import type { CommandEnvelope, ControlSource } from "@open-avatar/schema";

const context = (source: ControlSource) => ({ source });
const set = (
  id: string,
  payload:
    | { channel: "gaze"; x: number; y: number }
    | { channel: "mouthOpen"; value: number },
): CommandEnvelope => ({
  protocolVersion: "1.0",
  id,
  type: "control.set",
  payload,
  delivery: { mode: "coalesce", key: payload.channel, supersedesPending: true },
});
const play = (
  id: string,
  action: "blink" | "expression" | "motion" | "pose",
  contentId?: string,
): CommandEnvelope => ({
  protocolVersion: "1.0",
  id,
  type: "action.play",
  payload: action === "blink" ? { action } : { action, contentId: contentId! },
});

describe("CoreAnimation", () => {
  it("is deterministic for the same clock and seed", () => {
    const aClock = new FakeClock(),
      bClock = new FakeClock();
    const a = new CoreAnimation({
      clock: aClock,
      seed: 42,
      blinkIntervalMs: [10, 20],
    });
    const b = new CoreAnimation({
      clock: bClock,
      seed: 42,
      blinkIntervalMs: [10, 20],
    });
    for (const delta of [9, 4, 40, 12]) {
      aClock.advance(delta);
      bClock.advance(delta);
      expect(a.evaluate()).toEqual(b.evaluate());
    }
  });

  it("coalesces continuous values and isolates their channels", () => {
    const engine = new CoreAnimation({ clock: new FakeClock() });
    engine.submit(
      set("g1", { channel: "gaze", x: 0.2, y: -0.4 }),
      context("ai"),
    );
    engine.submit(
      set("m1", { channel: "mouthOpen", value: 0.7 }),
      context("ai"),
    );
    engine.submit(set("g2", { channel: "gaze", x: 9, y: 0.5 }), context("ai"));
    expect(engine.evaluate()).toMatchObject({
      gaze: { x: 1, y: 0.5 },
      mouthOpen: 0.7,
    });
  });

  it("gives trusted human input a temporary per-channel override", () => {
    const clock = new FakeClock();
    const engine = new CoreAnimation({ clock, humanOverrideMs: 100 });
    engine.submit(
      set("human", { channel: "gaze", x: 0.8, y: 0.2 }),
      context("human"),
    );
    engine.submit(
      set("ai-gaze", { channel: "gaze", x: -0.8, y: 0 }),
      context("ai"),
    );
    engine.submit(
      set("ai-mouth", { channel: "mouthOpen", value: 0.5 }),
      context("ai"),
    );
    expect(engine.evaluate()).toMatchObject({
      gaze: { x: 0.8, y: 0.2 },
      mouthOpen: 0.5,
    });
    clock.advance(100);
    engine.submit(
      set("ai-later", { channel: "gaze", x: -0.8, y: 0 }),
      context("ai"),
    );
    expect(engine.evaluate().gaze.x).toBe(-0.8);
  });

  it("interrupts only the matching action channel and emits terminal once", () => {
    const clock = new FakeClock();
    const engine = new CoreAnimation({ clock, actionDurationMs: 50 });
    const results: unknown[] = [];
    engine.on("terminal", (event) => results.push(event));
    engine.submit(play("motion-1", "motion", "wave"), context("ai"));
    engine.submit(play("expression-1", "expression", "happy"), context("ai"));
    engine.submit(play("motion-2", "motion", "nod"), context("human"));
    expect(engine.evaluate()).toMatchObject({
      motion: "nod",
      expression: "happy",
      motionWeight: 0,
      outgoing: [{ channel: "motion", contentId: "wave", weight: 1 }],
    });
    clock.advance(25);
    expect(engine.evaluate()).toMatchObject({
      motionWeight: 0.25,
      outgoing: [{ weight: 0.75 }],
    });
    clock.advance(75);
    engine.evaluate();
    engine.evaluate();
    expect(results).toEqual([
      { commandId: "motion-1", reason: "interrupted", at: 0 },
      { commandId: "motion-2", reason: "completed", at: 50 },
      { commandId: "expression-1", reason: "completed", at: 50 },
    ]);
  });

  it("supports cancellation, cross-faded blink, and stable neutral reset", () => {
    const clock = new FakeClock();
    const engine = new CoreAnimation({
      clock,
      blinkIntervalMs: [10_000, 10_000],
    });
    const results: unknown[] = [];
    engine.on("terminal", (event) => results.push(event));
    engine.submit(play("blink", "blink"), context("ai"));
    clock.advance(40);
    expect(engine.evaluate().blink).toBeCloseTo(0.5);
    engine.submit(
      {
        protocolVersion: "1.0",
        id: "cancel",
        type: "command.cancel",
        payload: { commandId: "blink" },
      },
      context("human"),
    );
    engine.submit(set("g", { channel: "gaze", x: 1, y: 1 }), context("human"));
    engine.submit(play("pose", "pose", "lean"), context("human"));
    engine.submit(
      { protocolVersion: "1.0", id: "reset", type: "control.reset" },
      context("human"),
    );
    const neutral = engine.evaluate();
    expect(neutral).toMatchObject({
      gaze: { x: 0, y: 0 },
      blink: 0,
      mouthOpen: 0,
      expression: null,
      expressionWeight: 0,
      motion: null,
      motionWeight: 0,
      pose: null,
      poseWeight: 0,
    });
    clock.advance(100);
    expect(engine.evaluate()).toEqual(neutral);
    expect(results).toEqual([
      { commandId: "blink", reason: "cancelled", at: 40 },
      { commandId: "pose", reason: "interrupted", at: 40 },
    ]);
  });
});

describe("mixParameters", () => {
  it("applies fixed layer order and clamps every declared parameter", () => {
    expect(
      mixParameters(
        {
          x: { min: -1, max: 1, default: 0 },
          y: { min: 0, max: 1, default: 0.2 },
        },
        [{ x: 0.2, y: 0.4 }, { x: 8 }],
      ),
    ).toEqual({ x: 1, y: 0.4 });
  });
});
