import { describe, expect, it, vi } from "vitest";
import {
  AvatarRenderer,
  type BackendScene,
  type RenderBundle,
  type RendererBackend,
} from "../src/index.js";

const bundle: RenderBundle = {
  width: 256,
  height: 256,
  layers: [
    { id: "torso", assetUrl: "torso.svg", x: 0, y: 80, zIndex: 0 },
    {
      id: "mouth",
      assetUrl: "mouth.svg",
      x: 96,
      y: 130,
      zIndex: 2,
      deform: { parameter: "mouthOpen", amount: 18 },
    },
  ],
};

function harness() {
  const scene: BackendScene = {
    render: vi.fn(),
    resize: vi.fn(),
    recover: vi.fn(async () => undefined),
    dispose: vi.fn(),
  };
  const backend: RendererBackend = {
    createScene: vi.fn(async () => scene),
  };
  const canvas = new EventTarget() as HTMLCanvasElement;
  return { backend, canvas, scene };
}

describe("AvatarRenderer", () => {
  it("passes evaluated poses to an isolated backend", async () => {
    const { backend, canvas, scene } = harness();
    const renderer = new AvatarRenderer(backend);
    await renderer.load(canvas, bundle);
    const pose = { parameters: { mouthOpen: 0.75 } };
    renderer.render(pose);
    expect(scene.render).toHaveBeenCalledWith(pose);
    expect(backend.createScene).toHaveBeenCalledOnce();
  });

  it("owns resize, recovery, and disposal lifecycle", async () => {
    const { backend, canvas, scene } = harness();
    const renderer = new AvatarRenderer(backend);
    await renderer.load(canvas, bundle);
    renderer.resize({ width: 640, height: 360, resolution: 2 });
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(renderer.state).toBe("recovering");
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    await vi.waitFor(() => expect(renderer.state).toBe("ready"));
    renderer.dispose();
    renderer.dispose();
    expect(scene.resize).toHaveBeenCalledOnce();
    expect(scene.recover).toHaveBeenCalledOnce();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(renderer.state).toBe("disposed");
  });

  it("rejects use before load and after disposal", async () => {
    const { backend, canvas } = harness();
    const renderer = new AvatarRenderer(backend);
    expect(() => renderer.render({ parameters: {} })).toThrow(/while idle/);
    await renderer.load(canvas, bundle);
    renderer.dispose();
    expect(() => renderer.resize({ width: 1, height: 1 })).toThrow(
      /while disposed/,
    );
  });
});
