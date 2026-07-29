import {
  ControlRouter,
  type ControlDiagnostic,
  type ControlPolicy,
  type SubmitResult,
  type TrustedSourceContext,
} from "@open-avatar/controls";
import {
  CoreAnimation,
  SystemClock,
  type Clock,
  type EvaluatedPose,
} from "@open-avatar/core";
import {
  PROTOCOL_VERSION,
  validateManifest,
  type Acknowledgement,
  type OpenAvatarManifest,
  type ProtocolError,
} from "@open-avatar/schema";
import type { ValidatedBundle } from "@open-avatar/validator";

export interface RuntimeViewport {
  readonly width: number;
  readonly height: number;
  readonly resolution?: number;
}

/** Renderer adapter; browser and headless renderers can implement this boundary. */
export interface RuntimeRenderer {
  load(
    manifest: OpenAvatarManifest,
    viewport?: RuntimeViewport,
    assets?: RuntimeAssets,
  ): Promise<void>;
  render(pose: EvaluatedPose): void;
  resize(viewport: RuntimeViewport): void;
  dispose(): void;
}

export interface RuntimeAssets {
  getFile(path: string): Uint8Array | undefined;
}

export type RuntimeState =
  | "idle"
  | "loading"
  | "ready"
  | "fallback"
  | "disposed";
export interface RuntimeDiagnostic {
  readonly kind: "state" | "control" | "error";
  readonly state: RuntimeState;
  readonly control?: ControlDiagnostic;
  readonly error?: Error;
}

export class AvatarRuntime {
  readonly #renderer: RuntimeRenderer;
  readonly #clock: Clock;
  readonly #policy: Partial<ControlPolicy> | undefined;
  readonly #listeners = new Set<(event: RuntimeDiagnostic) => void>();
  #state: RuntimeState = "idle";
  #router: ControlRouter | undefined;
  #core: CoreAnimation | undefined;
  #unsubscribeRouter: (() => void) | undefined;

  constructor(options: {
    renderer: RuntimeRenderer;
    clock?: Clock;
    controlPolicy?: Partial<ControlPolicy>;
  }) {
    this.#renderer = options.renderer;
    this.#clock = options.clock ?? new SystemClock();
    this.#policy = options.controlPolicy;
  }

  get state(): RuntimeState {
    return this.#state;
  }

  onDiagnostic(listener: (event: RuntimeDiagnostic) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async load(input: unknown, viewport?: RuntimeViewport): Promise<void> {
    this.#assertState("load", ["idle", "fallback"]);
    this.#setState("loading");
    const result = validateManifest(input);
    if (!result.valid || !result.value) {
      const error = new Error("Avatar manifest failed validation");
      this.#fallback(error);
      throw error;
    }
    await this.#loadManifest(result.value, viewport);
  }

  async loadBundle(
    bundle: ValidatedBundle,
    viewport?: RuntimeViewport,
  ): Promise<void> {
    this.#assertState("load", ["idle", "fallback"]);
    if (bundle.disposed) {
      const error = new Error("Validated avatar bundle has been disposed");
      this.#fallback(error);
      throw error;
    }
    this.#setState("loading");
    await this.#loadManifest(bundle.manifest, viewport, {
      getFile: (path) => bundle.getFile(path),
    });
  }

  async #loadManifest(
    manifest: OpenAvatarManifest,
    viewport?: RuntimeViewport,
    assets?: RuntimeAssets,
  ): Promise<void> {
    try {
      const definitions = Object.fromEntries(
        manifest.parameters.map((parameter) => [
          parameter.id,
          {
            min: parameter.min,
            max: parameter.max,
            default: parameter.default,
          },
        ]),
      );
      const router = new ControlRouter(manifest, {
        now: () => this.#clock.now(),
        ...(this.#policy ? { policy: this.#policy } : {}),
      });
      const core = new CoreAnimation({
        clock: this.#clock,
        parameters: definitions,
      });
      await this.#renderer.load(manifest, viewport, assets);
      this.#router = router;
      this.#core = core;
      this.#unsubscribeRouter = router.onDiagnostic((control) =>
        this.#emit({ kind: "control", state: this.#state, control }),
      );
      this.#setState("ready");
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.#fallback(error);
      throw error;
    }
  }

  submit(input: unknown, context: TrustedSourceContext): SubmitResult {
    if (this.#state !== "ready" || !this.#router)
      return this.#error("Runtime is not ready");
    return this.#router.submit(input, context);
  }

  tick(): EvaluatedPose | undefined {
    if (this.#state !== "ready" || !this.#router || !this.#core)
      return undefined;
    try {
      for (const item of this.#router.drain())
        this.#core.submit(item.command, item.context);
      const pose = this.#core.evaluate();
      this.#renderer.render(pose);
      return pose;
    } catch (cause) {
      this.#fallback(cause instanceof Error ? cause : new Error(String(cause)));
      return undefined;
    }
  }

  resize(viewport: RuntimeViewport): void {
    this.#assertState("resize", ["ready"]);
    try {
      this.#renderer.resize(viewport);
    } catch (cause) {
      this.#fallback(cause instanceof Error ? cause : new Error(String(cause)));
    }
  }

  dispose(): void {
    if (this.#state === "disposed") return;
    this.#unsubscribeRouter?.();
    this.#router?.clear();
    this.#renderer.dispose();
    this.#router = undefined;
    this.#core = undefined;
    this.#setState("disposed");
  }

  #fallback(error: Error): void {
    this.#unsubscribeRouter?.();
    this.#router?.clear();
    this.#router = undefined;
    this.#core = undefined;
    this.#setState("fallback");
    this.#emit({ kind: "error", state: this.#state, error });
  }

  #error(message: string): ProtocolError {
    return {
      protocolVersion: PROTOCOL_VERSION,
      type: "error",
      code: "INTERRUPTED",
      message,
      retryable: this.#state !== "disposed",
    };
  }

  #assertState(operation: string, allowed: RuntimeState[]): void {
    if (!allowed.includes(this.#state))
      throw new Error(`Runtime cannot ${operation} while ${this.#state}`);
  }

  #setState(state: RuntimeState): void {
    this.#state = state;
    this.#emit({ kind: "state", state });
  }

  #emit(event: RuntimeDiagnostic): void {
    for (const listener of this.#listeners) listener(event);
  }
}

export type { Acknowledgement };
