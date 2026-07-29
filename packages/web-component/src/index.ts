import {
  PROTOCOL_VERSION,
  type Acknowledgement,
  type ProtocolError,
} from "@open-avatar/schema";

export const OPEN_AVATAR_ELEMENT = "open-avatar";

export type SemanticCue =
  | { readonly type: "expression"; readonly id: string }
  | { readonly type: "motion"; readonly id: string }
  | { readonly type: "gaze"; readonly x: number; readonly y: number }
  | { readonly type: "mouthOpen"; readonly value: number }
  | { readonly type: "reset" };

export interface SemanticCommandSink {
  submit(input: unknown): Acknowledgement | ProtocolError;
}

export interface SemanticControllerOptions {
  readonly expressions?: readonly string[];
  readonly motions?: readonly string[];
  readonly nextId?: () => string;
}

/**
 * Maps a deliberately small, provider-neutral cue vocabulary to protocol
 * envelopes. Hosts keep AI provider input and source attribution outside this
 * adapter; only allowlisted semantic content reaches the avatar runtime.
 */
export function createSemanticController(
  sink: SemanticCommandSink,
  options: SemanticControllerOptions = {},
): { send(cue: SemanticCue): Acknowledgement | ProtocolError } {
  const expressions = new Set(options.expressions ?? []);
  const motions = new Set(options.motions ?? []);
  let sequence = 0;
  const nextId = options.nextId ?? (() => `semantic-${++sequence}`);

  const rejected = (message: string): ProtocolError => ({
    protocolVersion: PROTOCOL_VERSION,
    type: "error",
    code: "UNKNOWN_CONTENT",
    message,
    retryable: false,
  });

  return {
    send(cue) {
      const id = nextId();
      switch (cue.type) {
        case "expression":
          if (!expressions.has(cue.id))
            return rejected(`Expression is not allowlisted: ${cue.id}`);
          return sink.submit({
            protocolVersion: PROTOCOL_VERSION,
            id,
            type: "action.play",
            payload: { action: "expression", contentId: cue.id },
          });
        case "motion":
          if (!motions.has(cue.id))
            return rejected(`Motion is not allowlisted: ${cue.id}`);
          return sink.submit({
            protocolVersion: PROTOCOL_VERSION,
            id,
            type: "action.play",
            payload: { action: "motion", contentId: cue.id },
          });
        case "gaze":
          return sink.submit({
            protocolVersion: PROTOCOL_VERSION,
            id,
            type: "control.set",
            payload: { channel: "gaze", x: cue.x, y: cue.y },
            delivery: {
              mode: "coalesce",
              key: "gaze",
              supersedesPending: true,
            },
          });
        case "mouthOpen":
          return sink.submit({
            protocolVersion: PROTOCOL_VERSION,
            id,
            type: "control.set",
            payload: { channel: "mouthOpen", value: cue.value },
            delivery: {
              mode: "coalesce",
              key: "mouthOpen",
              supersedesPending: true,
            },
          });
        case "reset":
          return sink.submit({
            protocolVersion: PROTOCOL_VERSION,
            id,
            type: "control.reset",
          });
      }
    },
  };
}

export interface OpenAvatarElementController extends SemanticCommandSink {
  onDiagnostic?(
    listener: (event: { kind: string; state: string; error?: Error }) => void,
  ): () => void;
}

/**
 * Registers the element lazily so importing this package remains safe in SSR
 * and non-DOM environments. The host supplies the runtime bridge and renders
 * its own canvas into the element's light DOM.
 */
export function defineOpenAvatarElement(
  registry: CustomElementRegistry = globalThis.customElements,
): void {
  if (registry.get(OPEN_AVATAR_ELEMENT)) return;
  const BaseElement = globalThis.HTMLElement;
  if (!BaseElement) throw new Error("open-avatar requires a DOM environment");

  class OpenAvatarElement extends BaseElement {
    #controller: OpenAvatarElementController | undefined;
    #unsubscribe: (() => void) | undefined;
    #onCommand = (event: Event) => {
      const command = (event as CustomEvent<unknown>).detail;
      const result = this.#controller?.submit(command) ?? {
        protocolVersion: PROTOCOL_VERSION,
        type: "error",
        code: "INTERRUPTED",
        message: "Avatar controller is unavailable",
        retryable: true,
      };
      this.dispatchEvent(
        new CustomEvent("open-avatar-command-result", { detail: result }),
      );
    };

    set controller(value: OpenAvatarElementController | undefined) {
      this.#unsubscribe?.();
      this.#controller = value;
      this.#unsubscribe = value?.onDiagnostic?.((event) => {
        if (event.state === "fallback")
          this.#showFallback(event.error?.message);
      });
    }

    get controller(): OpenAvatarElementController | undefined {
      return this.#controller;
    }

    connectedCallback(): void {
      this.addEventListener("open-avatar-command", this.#onCommand);
    }

    disconnectedCallback(): void {
      this.removeEventListener("open-avatar-command", this.#onCommand);
      this.#unsubscribe?.();
      this.#unsubscribe = undefined;
    }

    #showFallback(message = "Avatar is unavailable") {
      const fallback = document.createElement("p");
      fallback.setAttribute("role", "status");
      fallback.textContent = message;
      this.replaceChildren(fallback);
    }
  }

  registry.define(OPEN_AVATAR_ELEMENT, OpenAvatarElement);
}
