import { describe, expect, it, vi } from "vitest";
import { FakeClock } from "@open-avatar/core";
import { AvatarRuntime, type RuntimeRenderer } from "../src/index.js";
import type { OpenAvatarManifest } from "@open-avatar/schema";
import { validateBundle } from "@open-avatar/validator";

const manifest: OpenAvatarManifest = {
  manifestVersion: "1.0",
  id: "avatar",
  name: "Avatar",
  canvas: { width: 100, height: 100 },
  assets: [],
  parameters: [
    { id: "gazeX", min: -1, max: 1, default: 0 },
    { id: "gazeY", min: -1, max: 1, default: 0 },
    { id: "mouthOpen", min: 0, max: 1, default: 0 },
  ],
  capabilities: { gaze: true, mouthOpen: true, reset: true },
};

function renderer(): RuntimeRenderer {
  return {
    load: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  };
}
const gaze = (id: string, x: number) => ({
  protocolVersion: "1.0",
  id,
  type: "control.set",
  payload: { channel: "gaze", x, y: 0 },
  delivery: { mode: "coalesce", key: "gaze", supersedesPending: true },
});

describe("AvatarRuntime", () => {
  it("loads, routes commands, renders, resizes, and disposes", async () => {
    const adapter = renderer();
    const runtime = new AvatarRuntime({
      renderer: adapter,
      clock: new FakeClock(),
    });
    await runtime.load(manifest);
    expect(runtime.state).toBe("ready");
    expect(
      runtime.submit(gaze("look", 0.75), { source: "human" }),
    ).toMatchObject({
      type: "ack",
      status: "accepted",
    });
    expect(runtime.tick()?.gaze.x).toBe(0.75);
    expect(adapter.render).toHaveBeenCalledOnce();
    runtime.resize({ width: 200, height: 150 });
    expect(adapter.resize).toHaveBeenCalledWith({ width: 200, height: 150 });
    runtime.dispose();
    runtime.dispose();
    expect(adapter.dispose).toHaveBeenCalledOnce();
    expect(runtime.state).toBe("disposed");
  });

  it("loads only live validated bundles through the asset boundary", async () => {
    const adapter = renderer();
    const runtime = new AvatarRuntime({ renderer: adapter });
    const result = await validateBundle({
      manifestBytes: new TextEncoder().encode(JSON.stringify(manifest)),
      files: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await runtime.loadBundle(result.bundle);
    const assets = vi.mocked(adapter.load).mock.calls[0]?.[2];
    expect(assets?.getFile("missing")).toBeUndefined();
    runtime.dispose();

    result.bundle.dispose();
    const second = new AvatarRuntime({ renderer: renderer() });
    await expect(second.loadBundle(result.bundle)).rejects.toThrow("disposed");
    expect(second.state).toBe("fallback");
  });

  it("enforces human override when AI and human commands share a tick", async () => {
    const runtime = new AvatarRuntime({
      renderer: renderer(),
      clock: new FakeClock(),
    });
    await runtime.load(manifest);
    runtime.submit(gaze("ai", -1), { source: "ai" });
    runtime.submit(gaze("human", 1), { source: "human" });
    expect(runtime.tick()?.gaze.x).toBe(1);
  });

  it("enters fallback for invalid manifests and renderer failures", async () => {
    const invalidRuntime = new AvatarRuntime({ renderer: renderer() });
    await expect(invalidRuntime.load({})).rejects.toThrow("manifest");
    expect(invalidRuntime.state).toBe("fallback");

    const broken = renderer();
    vi.mocked(broken.render).mockImplementation(() => {
      throw new Error("context failed");
    });
    const runtime = new AvatarRuntime({ renderer: broken });
    await runtime.load(manifest);
    expect(runtime.tick()).toBeUndefined();
    expect(runtime.state).toBe("fallback");
    expect(runtime.submit(gaze("late", 0), { source: "ai" })).toMatchObject({
      type: "error",
      code: "INTERRUPTED",
    });
  });
});
