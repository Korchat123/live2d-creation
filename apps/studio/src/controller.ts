import {
  PROTOCOL_VERSION,
  validateCommandEnvelope,
  validateManifest,
  type CommandEnvelope,
  type ControlSource,
  type OpenAvatarManifest,
  type SemanticCapability,
} from "@open-avatar/schema";
import {
  CoreAnimation,
  SystemClock,
  type EvaluatedPose,
} from "@open-avatar/core";

export interface StudioSnapshot {
  pose: EvaluatedPose;
  lastSource: ControlSource | null;
  lastCommand: string;
  humanOverrideUntil: number;
}
export class TrustedStudioAdapter {
  readonly engine: CoreAnimation;
  readonly manifest: OpenAvatarManifest;
  #sequence = 0;
  #lastSource: ControlSource | null = null;
  #lastCommand = "Waiting for input";
  #humanOverrideUntil = 0;
  constructor(
    input: unknown,
    readonly humanOverrideMs = 1500,
  ) {
    const checked = validateManifest(input);
    if (!checked.valid || !checked.value)
      throw new Error("The avatar manifest is invalid.");
    this.manifest = checked.value;
    this.engine = new CoreAnimation({
      clock: new SystemClock(),
      humanOverrideMs,
      parameters: Object.fromEntries(
        this.manifest.parameters.map(({ id, min, max, default: initial }) => [
          id,
          { min, max, default: initial },
        ]),
      ),
    });
  }
  createId(source: ControlSource) {
    return `${source}-${++this.#sequence}`;
  }
  submit(input: unknown, source: ControlSource) {
    const checked = validateCommandEnvelope(input);
    if (!checked.valid || !checked.value)
      return { accepted: false, message: "Rejected invalid command envelope" };
    if (!this.#supports(checked.value))
      return {
        accepted: false,
        message: "Accepted by protocol, unavailable in this avatar bundle",
      };
    this.engine.submit(checked.value, { source });
    this.#lastSource = source;
    this.#lastCommand = `${source}: ${describe(checked.value)}`;
    if (source === "human" && checked.value.type === "control.set")
      this.#humanOverrideUntil = performance.now() + this.humanOverrideMs;
    return { accepted: true, message: this.#lastCommand };
  }
  snapshot(): StudioSnapshot {
    return {
      pose: this.engine.evaluate(),
      lastSource: this.#lastSource,
      lastCommand: this.#lastCommand,
      humanOverrideUntil: this.#humanOverrideUntil,
    };
  }
  capabilities(): SemanticCapability[] {
    return Object.entries(this.manifest.capabilities)
      .filter(([, v]) => v !== false)
      .map(([k]) => k as SemanticCapability);
  }
  #supports(command: CommandEnvelope) {
    if (
      command.type === "capability.query" ||
      command.type === "command.cancel"
    )
      return true;
    if (command.type === "control.reset")
      return this.manifest.capabilities.reset === true;
    if (command.type === "control.set")
      return this.manifest.capabilities[command.payload.channel] === true;
    const declared = this.manifest.capabilities[command.payload.action];
    return (
      declared === true ||
      (typeof declared === "object" &&
        "contentId" in command.payload &&
        declared.content.includes(command.payload.contentId))
    );
  }
}
export function setCommand(
  id: string,
  payload:
    | { channel: "gaze"; x: number; y: number }
    | { channel: "mouthOpen"; value: number },
): CommandEnvelope {
  return {
    protocolVersion: PROTOCOL_VERSION,
    id,
    type: "control.set",
    payload,
    delivery: {
      mode: "coalesce",
      key: payload.channel,
      supersedesPending: true,
    },
  };
}
export function actionCommand(
  id: string,
  action: "blink" | "expression" | "motion" | "pose",
  contentId = "demo",
): CommandEnvelope {
  return {
    protocolVersion: PROTOCOL_VERSION,
    id,
    type: "action.play",
    payload: action === "blink" ? { action } : { action, contentId },
  };
}
export function resetCommand(id: string): CommandEnvelope {
  return { protocolVersion: PROTOCOL_VERSION, id, type: "control.reset" };
}
function describe(c: CommandEnvelope) {
  if (c.type === "control.set") return `set ${c.payload.channel}`;
  if (c.type === "action.play") return `play ${c.payload.action}`;
  if (c.type === "control.reset") return "reset";
  if (c.type === "capability.query") return "query capabilities";
  return `cancel ${c.payload.commandId}`;
}
