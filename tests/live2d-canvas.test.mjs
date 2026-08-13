import assert from "node:assert/strict";
import test from "node:test";
import { Live2DCanvasEngine } from "../src/live2d-canvas.js";

// Mock HTML5 Canvas & Context 2D for Node test environment
function createMockCanvas() {
  const context = {
    clearRect: () => {},
    fillRect: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    toDataURL: () => "data:image/png;base64,mock"
  };

  return {
    width: 2048,
    height: 2048,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 800, height: 800, left: 0, top: 0 }),
    toDataURL: () => "data:image/png;base64,mock"
  };
}

test("Live2DCanvasEngine initializes default physics and parameters", () => {
  const mockCanvas = createMockCanvas();
  const engine = new Live2DCanvasEngine(mockCanvas);

  assert.ok(engine);
  assert.equal(engine.activeExpression, "neutral");
  assert.equal(engine.activePose, "natural");
  assert.equal(engine.isAnimating, true);
  assert.equal(engine.isGazeTracking, true);
});

test("Live2DCanvasEngine handles expression switching", () => {
  const mockCanvas = createMockCanvas();
  const engine = new Live2DCanvasEngine(mockCanvas);

  engine.setExpression("wink");
  assert.equal(engine.activeExpression, "wink");
  assert.equal(engine.params.eyeLOpen, 0.0);
  assert.equal(engine.params.eyeROpen, 1.0);

  engine.setExpression("happy");
  assert.equal(engine.activeExpression, "happy");
  assert.equal(engine.params.eyebrowStyle, "happy");
});

test("Live2DCanvasEngine exports Live2D model JSON manifest", () => {
  const mockCanvas = createMockCanvas();
  const engine = new Live2DCanvasEngine(mockCanvas);

  const manifestStr = engine.exportLive2DManifest();
  const manifest = JSON.parse(manifestStr);

  assert.ok(manifest.version.includes("Cubism"));
  assert.ok(Array.isArray(manifest.model.parameters));
  assert.ok(manifest.model.parameters.some((p) => p.id === "ParamAngleX"));
  assert.ok(manifest.model.parameters.some((p) => p.id === "ParamEyeLOpen"));
});
