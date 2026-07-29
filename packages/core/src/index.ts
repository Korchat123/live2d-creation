import type {
  CommandEnvelope,
  ControlSource,
  PlayActionEnvelope,
  SetControlEnvelope,
} from "@open-avatar/schema";

export interface Clock {
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return performance.now();
  }
}

export class FakeClock implements Clock {
  constructor(private time = 0) {}
  now(): number {
    return this.time;
  }
  advance(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0)
      throw new RangeError("milliseconds must be finite and non-negative");
    this.time += milliseconds;
  }
  set(time: number): void {
    if (!Number.isFinite(time) || time < this.time)
      throw new RangeError("time cannot move backwards");
    this.time = time;
  }
}

export class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0 || 0x6d2b79f5;
  }
  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
}

export interface ParameterDefinition {
  min: number;
  max: number;
  default: number;
}
export type ParameterLayer = Readonly<Record<string, number>>;

export type KeyframeInterpolation = "linear" | "step";
export interface ParameterKeyframe {
  timeMs: number;
  value: number;
  interpolation?: KeyframeInterpolation;
}
export interface ParameterTrack {
  parameterId: string;
  keyframes: readonly ParameterKeyframe[];
}
export interface AnimationClip {
  durationMs: number;
  loop?: boolean;
  tracks: readonly ParameterTrack[];
}
export interface NamedAnimationClips {
  expressions: Readonly<Record<string, AnimationClip>>;
  motions: Readonly<Record<string, AnimationClip>>;
}

export const REQUIRED_EXPRESSION_IDS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "thinking",
] as const;
export const REQUIRED_MOTION_IDS = [
  "idle",
  "nod",
  "wave",
  "explain",
  "shrug",
] as const;

export function evaluateAnimationClip(
  clip: AnimationClip,
  elapsedMs: number,
): Record<string, number> {
  if (!Number.isFinite(elapsedMs))
    throw new RangeError("elapsedMs must be finite");
  if (!Number.isFinite(clip.durationMs) || clip.durationMs < 0)
    throw new RangeError("clip durationMs must be finite and non-negative");

  const localTime =
    clip.loop && clip.durationMs > 0
      ? ((elapsedMs % clip.durationMs) + clip.durationMs) % clip.durationMs
      : Math.min(clip.durationMs, Math.max(0, elapsedMs));
  const values: Record<string, number> = {};
  for (const track of clip.tracks) {
    if (track.keyframes.length === 0) continue;
    values[track.parameterId] = evaluateTrack(track, localTime);
  }
  return values;
}

export function evaluateNamedAnimation(
  clips: NamedAnimationClips,
  channel: "expression" | "motion",
  id: string,
  elapsedMs: number,
): Record<string, number> | null {
  const clip =
    channel === "expression" ? clips.expressions[id] : clips.motions[id];
  return clip ? evaluateAnimationClip(clip, elapsedMs) : null;
}

function evaluateTrack(track: ParameterTrack, timeMs: number): number {
  const frames = track.keyframes;
  const first = frames[0]!;
  assertKeyframe(first, track.parameterId, 0);
  if (timeMs <= first.timeMs) return first.value;

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1]!;
    const next = frames[index]!;
    assertKeyframe(next, track.parameterId, index);
    if (next.timeMs <= previous.timeMs)
      throw new RangeError(
        `keyframes for ${track.parameterId} must have increasing times`,
      );
    if (timeMs <= next.timeMs) {
      if ((previous.interpolation ?? "linear") === "step")
        return previous.value;
      const progress =
        (timeMs - previous.timeMs) / (next.timeMs - previous.timeMs);
      return previous.value + (next.value - previous.value) * progress;
    }
  }
  return frames[frames.length - 1]!.value;
}

function assertKeyframe(
  keyframe: ParameterKeyframe,
  parameterId: string,
  index: number,
): void {
  if (
    !Number.isFinite(keyframe.timeMs) ||
    keyframe.timeMs < 0 ||
    !Number.isFinite(keyframe.value)
  )
    throw new RangeError(
      `keyframe ${index} for ${parameterId} must contain finite values and a non-negative time`,
    );
}

export function mixParameters(
  definitions: Readonly<Record<string, ParameterDefinition>>,
  layers: readonly ParameterLayer[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, definition] of Object.entries(definitions)) {
    let value = definition.default;
    for (const layer of layers) if (layer[id] !== undefined) value = layer[id]!;
    result[id] = Math.min(definition.max, Math.max(definition.min, value));
  }
  return result;
}

export interface TrustedCommandContext {
  source: ControlSource;
}
export type TerminalReason = "completed" | "cancelled" | "interrupted";
export interface ActionResult {
  commandId: string;
  reason: TerminalReason;
  at: number;
}
export interface CoreEventMap {
  accepted: { commandId: string; at: number };
  terminal: ActionResult;
}
export interface EvaluatedPose {
  gaze: { x: number; y: number };
  blink: number;
  mouthOpen: number;
  expression: string | null;
  expressionWeight: number;
  motion: string | null;
  motionWeight: number;
  pose: string | null;
  poseWeight: number;
  outgoing: ReadonlyArray<{
    channel: "expression" | "motion" | "pose";
    contentId: string;
    weight: number;
  }>;
  parameters: Record<string, number>;
}
export interface CoreAnimationOptions {
  clock: Clock;
  clips?: NamedAnimationClips;
  seed?: number;
  humanOverrideMs?: number;
  actionDurationMs?: number;
  crossFadeMs?: number;
  blinkIntervalMs?: readonly [number, number];
  parameters?: Readonly<Record<string, ParameterDefinition>>;
}

type Channel = "expression" | "motion" | "pose" | "blink";
interface ActiveAction {
  id: string;
  channel: Channel;
  contentId: string | null;
  startedAt: number;
  endsAt: number;
  fadeMs: number;
  terminal: boolean;
}
interface OutgoingAction {
  channel: "expression" | "motion" | "pose";
  contentId: string;
  startedAt: number;
  fadeMs: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clampSigned = (value: number) => Math.min(1, Math.max(-1, value));

export class CoreAnimation {
  private readonly clock: Clock;
  private readonly random: SeededRandom;
  private readonly humanOverrideMs: number;
  private readonly actionDurationMs: number;
  private readonly crossFadeMs: number;
  private readonly blinkRange: readonly [number, number];
  private readonly definitions: Readonly<Record<string, ParameterDefinition>>;
  private readonly clips: NamedAnimationClips;
  private readonly listeners = new Map<
    keyof CoreEventMap,
    Set<(event: never) => void>
  >();
  private readonly actions = new Map<Channel, ActiveAction>();
  private outgoing: OutgoingAction[] = [];
  private readonly terminalIds = new Set<string>();
  private gaze = { x: 0, y: 0 };
  private mouthOpen = 0;
  private humanUntil = { gaze: 0, mouthOpen: 0 };
  private nextBlinkAt: number;

  constructor(options: CoreAnimationOptions) {
    this.clock = options.clock;
    this.random = new SeededRandom(options.seed ?? 1);
    this.humanOverrideMs = options.humanOverrideMs ?? 1_000;
    this.actionDurationMs = options.actionDurationMs ?? 500;
    this.crossFadeMs = options.crossFadeMs ?? 100;
    this.blinkRange = options.blinkIntervalMs ?? [2_500, 5_000];
    this.definitions = options.parameters ?? {};
    this.clips = options.clips ?? { expressions: {}, motions: {} };
    this.nextBlinkAt = this.clock.now() + this.randomBlinkDelay();
  }

  on<K extends keyof CoreEventMap>(
    type: K,
    listener: (event: CoreEventMap[K]) => void,
  ): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener as (event: never) => void);
    this.listeners.set(type, set);
    return () => set.delete(listener as (event: never) => void);
  }

  submit(command: CommandEnvelope, context: TrustedCommandContext): void {
    const now = this.clock.now();
    if (command.type === "control.set") {
      this.applyContinuous(command, context, now);
      this.emit("accepted", { commandId: command.id, at: now });
      return;
    }
    if (command.type === "action.play") {
      this.startAction(command, now);
      return;
    }
    if (command.type === "command.cancel") {
      this.cancel(command.payload.commandId, now);
      return;
    }
    if (command.type === "control.reset") {
      this.reset(now);
      this.emit("accepted", { commandId: command.id, at: now });
      return;
    }
  }

  evaluate(): EvaluatedPose {
    const now = this.clock.now();
    this.finishExpired(now);
    const explicitBlink = this.actions.get("blink");
    let blink = explicitBlink ? this.blinkValue(explicitBlink, now) : 0;
    if (!explicitBlink && now >= this.nextBlinkAt) {
      const idle: ActiveAction = {
        id: `idle-blink-${this.nextBlinkAt}`,
        channel: "blink",
        contentId: null,
        startedAt: this.nextBlinkAt,
        endsAt: this.nextBlinkAt + 160,
        fadeMs: 80,
        terminal: false,
      };
      blink = this.blinkValue(idle, now);
      if (now >= idle.endsAt) this.nextBlinkAt = now + this.randomBlinkDelay();
    }
    const expression = this.actions.get("expression") ?? null;
    const motion = this.actions.get("motion") ?? null;
    const pose = this.actions.get("pose") ?? null;
    this.outgoing = this.outgoing.filter(
      (action) => now < action.startedAt + action.fadeMs,
    );
    const animationLayers: ParameterLayer[] = [
      ...this.outgoing.map((action) =>
        action.channel === "pose"
          ? {}
          : this.clipLayer(
              action.channel,
              action.contentId,
              now - action.startedAt,
              clamp01(1 - (now - action.startedAt) / action.fadeMs),
            ),
      ),
    ];
    if (motion?.contentId)
      animationLayers.push(
        this.clipLayer(
          "motion",
          motion.contentId,
          now - motion.startedAt,
          this.actionWeight(motion, now),
        ),
      );
    if (expression?.contentId)
      animationLayers.push(
        this.clipLayer(
          "expression",
          expression.contentId,
          now - expression.startedAt,
          this.actionWeight(expression, now),
        ),
      );
    const semantic: ParameterLayer = {
      gazeX: this.gaze.x,
      gazeY: this.gaze.y,
      blink,
      mouthOpen: this.mouthOpen,
    };
    return {
      gaze: { ...this.gaze },
      blink,
      mouthOpen: this.mouthOpen,
      expression: expression?.contentId ?? null,
      expressionWeight: expression ? this.actionWeight(expression, now) : 0,
      motion: motion?.contentId ?? null,
      motionWeight: motion ? this.actionWeight(motion, now) : 0,
      pose: pose?.contentId ?? null,
      poseWeight: pose ? this.actionWeight(pose, now) : 0,
      outgoing: this.outgoing.map((action) => ({
        channel: action.channel,
        contentId: action.contentId,
        weight: clamp01(1 - (now - action.startedAt) / action.fadeMs),
      })),
      parameters: mixParameters(this.definitions, [
        ...animationLayers,
        semantic,
      ]),
    };
  }

  reset(now = this.clock.now()): void {
    for (const action of this.actions.values())
      this.terminal(action, "interrupted", now);
    this.actions.clear();
    this.outgoing = [];
    this.gaze = { x: 0, y: 0 };
    this.mouthOpen = 0;
    this.humanUntil = { gaze: 0, mouthOpen: 0 };
    this.nextBlinkAt = now + this.randomBlinkDelay();
  }

  private applyContinuous(
    command: SetControlEnvelope,
    context: TrustedCommandContext,
    now: number,
  ): void {
    const channel = command.payload.channel;
    if (context.source !== "human" && now < this.humanUntil[channel]) return;
    if (context.source === "human")
      this.humanUntil[channel] = now + this.humanOverrideMs;
    if (command.payload.channel === "gaze")
      this.gaze = {
        x: clampSigned(command.payload.x),
        y: clampSigned(command.payload.y),
      };
    else this.mouthOpen = clamp01(command.payload.value);
  }

  private startAction(command: PlayActionEnvelope, now: number): void {
    const channel = command.payload.action;
    const previous = this.actions.get(channel);
    if (previous) {
      this.terminal(previous, "interrupted", now);
      if (
        channel !== "blink" &&
        previous.contentId !== null &&
        this.crossFadeMs > 0
      )
        this.outgoing.push({
          channel,
          contentId: previous.contentId,
          startedAt: now,
          fadeMs: this.crossFadeMs,
        });
    }
    const contentId =
      "contentId" in command.payload ? command.payload.contentId : null;
    const clip =
      contentId && (channel === "expression" || channel === "motion")
        ? this.clipFor(channel, contentId)
        : undefined;
    const duration = clip?.durationMs ?? this.actionDurationMs;
    const action: ActiveAction = {
      id: command.id,
      channel,
      contentId,
      startedAt: now,
      endsAt:
        channel === "blink"
          ? now + 160
          : clip?.loop
            ? Infinity
            : now + duration,
      fadeMs: channel === "blink" ? 80 : this.crossFadeMs,
      terminal: false,
    };
    this.actions.set(channel, action);
    this.emit("accepted", { commandId: command.id, at: now });
  }

  private cancel(id: string, now: number): void {
    for (const [channel, action] of this.actions) {
      if (action.id === id) {
        this.terminal(action, "cancelled", now);
        this.actions.delete(channel);
        break;
      }
    }
  }

  private finishExpired(now: number): void {
    for (const [channel, action] of this.actions)
      if (now >= action.endsAt) {
        this.terminal(action, "completed", action.endsAt);
        this.actions.delete(channel);
      }
  }

  private blinkValue(action: ActiveAction, now: number): number {
    return clamp01(
      Math.min(
        (now - action.startedAt) / action.fadeMs,
        (action.endsAt - now) / action.fadeMs,
      ),
    );
  }

  private actionWeight(action: ActiveAction, now: number): number {
    return action.fadeMs === 0
      ? 1
      : clamp01((now - action.startedAt) / action.fadeMs);
  }

  private clipFor(
    channel: "expression" | "motion",
    contentId: string,
  ): AnimationClip | undefined {
    return channel === "expression"
      ? this.clips.expressions[contentId]
      : this.clips.motions[contentId];
  }

  private clipLayer(
    channel: "expression" | "motion",
    contentId: string,
    elapsedMs: number,
    weight: number,
  ): ParameterLayer {
    const clip = this.clipFor(channel, contentId);
    if (!clip) return {};
    const values = evaluateAnimationClip(clip, elapsedMs);
    const layer: Record<string, number> = {};
    for (const [parameterId, value] of Object.entries(values)) {
      const fallback = this.definitions[parameterId]?.default ?? 0;
      layer[parameterId] = fallback + (value - fallback) * weight;
    }
    return layer;
  }

  private terminal(
    action: ActiveAction,
    reason: TerminalReason,
    at: number,
  ): void {
    if (action.terminal || this.terminalIds.has(action.id)) return;
    action.terminal = true;
    this.terminalIds.add(action.id);
    this.emit("terminal", { commandId: action.id, reason, at });
  }

  private randomBlinkDelay(): number {
    const [min, max] = this.blinkRange;
    return min + (max - min) * this.random.next();
  }

  private emit<K extends keyof CoreEventMap>(
    type: K,
    event: CoreEventMap[K],
  ): void {
    for (const listener of this.listeners.get(type) ?? [])
      listener(event as never);
  }
}
