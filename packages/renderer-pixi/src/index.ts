export interface EvaluatedPose {
  readonly parameters: Readonly<Record<string, number>>;
}

export interface AvatarLayer {
  readonly id: string;
  readonly assetUrl: string;
  readonly x: number;
  readonly y: number;
  readonly zIndex: number;
  readonly scale?: number;
  readonly alpha?: {
    readonly parameter: string;
    readonly minimum?: number;
    readonly maximum?: number;
  };
  readonly deform?: {
    readonly parameter: string;
    readonly amount: number;
  };
  readonly translate?: {
    readonly xParameter: string;
    readonly yParameter: string;
    readonly amount: number;
  };
  readonly offset?: {
    readonly xParameter?: string;
    readonly xAmount?: number;
    readonly yParameter?: string;
    readonly yAmount?: number;
  };
  readonly rotation?: {
    readonly parameter: string;
    readonly degrees: number;
  };
}

export interface RenderBundle {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly AvatarLayer[];
}

export interface RendererViewport {
  readonly width: number;
  readonly height: number;
  readonly resolution?: number;
}

export interface BackendScene {
  render(pose: EvaluatedPose): void;
  resize(viewport: RendererViewport): void;
  recover(): Promise<void>;
  dispose(): void;
}

export interface RendererBackend {
  createScene(
    canvas: HTMLCanvasElement,
    bundle: RenderBundle,
    viewport: RendererViewport,
  ): Promise<BackendScene>;
}

export type RendererState =
  | "idle"
  | "loading"
  | "ready"
  | "recovering"
  | "disposed";

/**
 * Owns exactly one backend scene. Control envelopes intentionally cannot cross
 * this boundary: callers must provide an already evaluated pose.
 */
export class AvatarRenderer {
  readonly #backend: RendererBackend;
  #scene: BackendScene | undefined;
  #canvas: HTMLCanvasElement | undefined;
  #state: RendererState = "idle";
  #onContextLost: ((event: Event) => void) | undefined;
  #onContextRestored: (() => void) | undefined;

  constructor(backend: RendererBackend = new PixiWebGLBackend()) {
    this.#backend = backend;
  }

  get state(): RendererState {
    return this.#state;
  }

  async load(
    canvas: HTMLCanvasElement,
    bundle: RenderBundle,
    viewport: RendererViewport = {
      width: bundle.width,
      height: bundle.height,
    },
  ): Promise<void> {
    if (this.#state !== "idle") {
      throw new Error(`Renderer cannot load while ${this.#state}`);
    }
    this.#state = "loading";
    try {
      this.#scene = await this.#backend.createScene(canvas, bundle, viewport);
      this.#canvas = canvas;
      this.#attachContextListeners(canvas);
      this.#state = "ready";
    } catch (error) {
      this.#state = "idle";
      throw error;
    }
  }

  render(pose: EvaluatedPose): void {
    this.#assertReady("render");
    this.#scene?.render(pose);
  }

  resize(viewport: RendererViewport): void {
    this.#assertReady("resize");
    this.#scene?.resize(viewport);
  }

  async recoverContext(): Promise<void> {
    if (this.#state !== "ready" && this.#state !== "recovering") {
      throw new Error(`Renderer cannot recover while ${this.#state}`);
    }
    this.#state = "recovering";
    const scene = this.#scene;
    await scene?.recover();
    if (this.#scene === scene) this.#state = "ready";
  }

  dispose(): void {
    if (this.#state === "disposed") return;
    if (this.#canvas) this.#detachContextListeners(this.#canvas);
    this.#scene?.dispose();
    this.#scene = undefined;
    this.#canvas = undefined;
    this.#state = "disposed";
  }

  #assertReady(operation: string): void {
    if (this.#state !== "ready") {
      throw new Error(`Renderer cannot ${operation} while ${this.#state}`);
    }
  }

  #attachContextListeners(canvas: HTMLCanvasElement): void {
    this.#onContextLost = (event) => {
      event.preventDefault();
      if (this.#state === "ready") this.#state = "recovering";
    };
    this.#onContextRestored = () => {
      void this.recoverContext();
    };
    canvas.addEventListener("webglcontextlost", this.#onContextLost);
    canvas.addEventListener("webglcontextrestored", this.#onContextRestored);
  }

  #detachContextListeners(canvas: HTMLCanvasElement): void {
    if (this.#onContextLost)
      canvas.removeEventListener("webglcontextlost", this.#onContextLost);
    if (this.#onContextRestored)
      canvas.removeEventListener(
        "webglcontextrestored",
        this.#onContextRestored,
      );
  }
}

export class PixiWebGLBackend implements RendererBackend {
  async createScene(
    canvas: HTMLCanvasElement,
    bundle: RenderBundle,
    viewport: RendererViewport,
  ): Promise<BackendScene> {
    const { Application, Assets, Container, MeshPlane, Sprite, Texture } =
      await import("pixi.js");
    const app = new Application();
    await app.init({
      canvas,
      width: viewport.width,
      height: viewport.height,
      resolution: viewport.resolution ?? 1,
      autoDensity: true,
      autoStart: false,
      backgroundAlpha: 0,
      preference: "webgl",
    });

    const root = new Container();
    root.sortableChildren = true;
    app.stage.addChild(root);
    const parts = await Promise.all(
      [...bundle.layers]
        .sort((left, right) => left.zIndex - right.zIndex)
        .map(async (layer) => {
          const loaded: unknown = await Assets.load(layer.assetUrl);
          if (!(loaded instanceof Texture)) {
            throw new Error(
              `Asset ${layer.assetUrl} did not load as a texture`,
            );
          }
          const texture = loaded;
          // Pixi's runtime-checked Texture class intentionally carries its source as `any`.
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const display = layer.deform
            ? new MeshPlane({ texture, verticesX: 4, verticesY: 4 })
            : new Sprite(texture);
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          display.label = layer.id;
          display.position.set(layer.x, layer.y);
          display.scale.set(layer.scale ?? 1);
          display.zIndex = layer.zIndex;
          root.addChild(display);
          const basePositions =
            display instanceof MeshPlane
              ? new Float32Array(display.geometry.positions)
              : undefined;
          return { layer, display, basePositions };
        }),
    );

    const fit = (next: RendererViewport) => {
      app.renderer.resize(next.width, next.height, next.resolution ?? 1);
      const scale = Math.min(
        next.width / bundle.width,
        next.height / bundle.height,
      );
      root.scale.set(scale);
      root.position.set(
        (next.width - bundle.width * scale) / 2,
        (next.height - bundle.height * scale) / 2,
      );
    };
    fit(viewport);

    return {
      render(pose) {
        for (const { layer, display, basePositions } of parts) {
          let x = layer.x;
          let y = layer.y;
          if (layer.translate) {
            x +=
              (pose.parameters[layer.translate.xParameter] ?? 0) *
              layer.translate.amount;
            y +=
              (pose.parameters[layer.translate.yParameter] ?? 0) *
              layer.translate.amount;
          }
          if (layer.offset) {
            if (layer.offset.xParameter)
              x +=
                (pose.parameters[layer.offset.xParameter] ?? 0) *
                (layer.offset.xAmount ?? 0);
            if (layer.offset.yParameter)
              y +=
                (pose.parameters[layer.offset.yParameter] ?? 0) *
                (layer.offset.yAmount ?? 0);
          }
          display.position.set(x, y);
          display.rotation =
            ((pose.parameters[layer.rotation?.parameter ?? ""] ?? 0) *
              (layer.rotation?.degrees ?? 0) *
              Math.PI) /
            180;
          if (layer.alpha) {
            const value = pose.parameters[layer.alpha.parameter] ?? 0;
            const minimum = layer.alpha.minimum ?? 0;
            const maximum = layer.alpha.maximum ?? 1;
            display.alpha = Math.min(
              1,
              Math.max(0, minimum + value * (maximum - minimum)),
            );
          }
          if (
            !layer.deform ||
            !(display instanceof MeshPlane) ||
            !basePositions
          )
            continue;
          const value = pose.parameters[layer.deform.parameter] ?? 0;
          const positions = new Float32Array(basePositions);
          for (let index = 1; index < positions.length; index += 2) {
            positions[index] =
              (basePositions[index] ?? 0) +
              (index < positions.length / 2 ? 0 : value) * layer.deform.amount;
          }
          display.geometry.positions = positions;
        }
        app.renderer.render(app.stage);
      },
      resize: fit,
      recover() {
        // Pixi rebuilds managed WebGL resources after context restoration.
        // Rendering once re-uploads the scene's textures and geometry.
        app.renderer.render(app.stage);
        return Promise.resolve();
      },
      dispose() {
        for (const assetUrl of new Set(
          bundle.layers.map((layer) => layer.assetUrl),
        ))
          void Assets.unload(assetUrl).catch(() => undefined);
        app.destroy(
          { removeView: false },
          { children: true, texture: false, textureSource: false },
        );
      },
    };
  }
}
