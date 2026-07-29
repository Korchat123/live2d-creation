import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SECURITY_LIMITS,
  validateCommandEnvelope,
  validateManifest,
} from "../src/index.js";

const fixture = (path: string): unknown =>
  JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../assets/fixtures/schema", path),
      "utf8",
    ),
  );

const manifest = fixture("valid/minimal-manifest.json") as Record<
  string,
  unknown
>;
const gaze = fixture("valid/gaze-envelope.json") as Record<string, unknown>;

describe("Open Avatar manifest", () => {
  it("accepts the minimal fixture", () => {
    expect(validateManifest(manifest).valid).toBe(true);
    expect(
      validateManifest(fixture("malformed/traversal-manifest.json")).valid,
    ).toBe(false);
  });

  it.each([
    "../secret.png",
    "textures/../../secret.png",
    "/etc/passwd",
    "C:/secret.png",
    "\\\\server\\share.png",
  ])("rejects unsafe asset path %s", (path) => {
    const candidate = structuredClone(manifest) as {
      assets: Array<{ path: string }>;
    };
    candidate.assets[0].path = path;
    expect(validateManifest(candidate).valid).toBe(false);
  });

  it("rejects unknown major versions", () => {
    expect(
      validateManifest({ ...manifest, manifestVersion: "2.0" }).valid,
    ).toBe(false);
  });

  it.each([
    { min: 1, max: 0, default: 0 },
    { min: 0, max: 1, default: 2 },
    { min: 0, max: Infinity, default: 0 },
    { min: 0, max: 1, default: Number.NaN },
  ])("rejects non-finite or invalid ranges", (range) => {
    expect(
      validateManifest({ ...manifest, parameters: [{ id: "bad", ...range }] })
        .valid,
    ).toBe(false);
  });

  it("rejects provider and UI fields", () => {
    expect(validateManifest({ ...manifest, ui: { slider: true } }).valid).toBe(
      false,
    );
    expect(validateManifest({ ...manifest, provider: "vendor" }).valid).toBe(
      false,
    );
  });
});

describe("control envelope", () => {
  it("accepts coalescible continuous input metadata", () => {
    const result = validateCommandEnvelope(gaze);
    expect(result.valid).toBe(true);
    expect(
      result.value?.type === "control.set" ? result.value.delivery : undefined,
    ).toEqual({
      mode: "coalesce",
      key: "gaze",
      supersedesPending: true,
    });
  });

  it("rejects invalid ranges and non-finite values", () => {
    for (const x of [1.1, -1.1, Infinity, Number.NaN]) {
      const candidate = structuredClone(gaze) as {
        payload: { x: number };
      };
      candidate.payload.x = x;
      expect(validateCommandEnvelope(candidate).valid).toBe(false);
    }
  });

  it("requires the coalescing key to match its continuous channel", () => {
    expect(
      validateCommandEnvelope({
        ...gaze,
        delivery: {
          mode: "coalesce",
          key: "mouthOpen",
          supersedesPending: true,
        },
      }).valid,
    ).toBe(false);
  });

  it("rejects unknown major, provider, and UI fields", () => {
    expect(
      validateCommandEnvelope({ ...gaze, protocolVersion: "9.0" }).valid,
    ).toBe(false);
    expect(validateCommandEnvelope({ ...gaze, provider: "vendor" }).valid).toBe(
      false,
    );
    expect(validateCommandEnvelope({ ...gaze, ui: "slider" }).valid).toBe(
      false,
    );
    expect(validateCommandEnvelope({ ...gaze, source: "human" }).valid).toBe(
      false,
    );
    expect(
      validateCommandEnvelope(fixture("malformed/provider-envelope.json"))
        .valid,
    ).toBe(false);
  });

  it("defines bounded hostile-input limits", () => {
    expect(SECURITY_LIMITS.maxEnvelopeBytes).toBeLessThanOrEqual(16_384);
    expect(SECURITY_LIMITS.maxCommandsPerSecond).toBeLessThanOrEqual(120);
  });

  it.each([
    { type: "capability.query" },
    { type: "command.cancel", payload: { commandId: "motion-1" } },
    { type: "control.reset" },
    { type: "action.play", payload: { action: "blink" } },
  ])("accepts $type contracts", (part) => {
    expect(
      validateCommandEnvelope({
        protocolVersion: "1.0",
        id: "request-1",
        ...part,
      }).valid,
    ).toBe(true);
  });
});
