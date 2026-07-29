import {
  PROTOCOL_VERSION,
  SECURITY_LIMITS,
  validateCommandEnvelope,
  type Acknowledgement,
  type CapabilityReport,
  type CommandEnvelope,
  type ControlSource,
  type OpenAvatarManifest,
  type ProtocolError,
  type SemanticCapability,
} from "@open-avatar/schema";

export interface TrustedSourceContext {
  /** Assigned by the embedding application; never read from the envelope. */
  readonly source: ControlSource;
}

export interface ControlPolicy {
  readonly queueLimit: number;
  readonly globalCommandsPerSecond: number;
  readonly sourceCommandsPerSecond: Readonly<Record<ControlSource, number>>;
}

export interface ControlDiagnostic {
  readonly kind:
    | "accepted"
    | "rejected"
    | "coalesced"
    | "cancelled"
    | "dispatched";
  readonly commandId?: string;
  readonly source: ControlSource;
  readonly detail?: string;
}

export interface RoutedCommand {
  readonly command: CommandEnvelope;
  readonly context: TrustedSourceContext;
}

export type SubmitResult = Acknowledgement | ProtocolError | CapabilityReport;

const DEFAULT_POLICY: ControlPolicy = {
  queueLimit: 64,
  globalCommandsPerSecond: SECURITY_LIMITS.maxCommandsPerSecond,
  sourceCommandsPerSecond: { human: 120, ai: 30, automation: 60 },
};
const priorities: Record<ControlSource, number> = {
  human: 0,
  automation: 1,
  ai: 2,
};

export class ControlRouter {
  readonly #policy: ControlPolicy;
  readonly #now: () => number;
  readonly #diagnostics = new Set<(event: ControlDiagnostic) => void>();
  #manifest: OpenAvatarManifest;
  #queue: RoutedCommand[] = [];
  #globalWindow: number[] = [];
  #sourceWindows: Record<ControlSource, number[]> = {
    human: [],
    ai: [],
    automation: [],
  };

  constructor(
    manifest: OpenAvatarManifest,
    options: { policy?: Partial<ControlPolicy>; now?: () => number } = {},
  ) {
    this.#manifest = manifest;
    this.#now = options.now ?? (() => performance.now());
    this.#policy = {
      ...DEFAULT_POLICY,
      ...options.policy,
      sourceCommandsPerSecond: {
        ...DEFAULT_POLICY.sourceCommandsPerSecond,
        ...options.policy?.sourceCommandsPerSecond,
      },
    };
  }

  onDiagnostic(listener: (event: ControlDiagnostic) => void): () => void {
    this.#diagnostics.add(listener);
    return () => this.#diagnostics.delete(listener);
  }

  get pending(): number {
    return this.#queue.length;
  }

  capabilities(requestId: string): CapabilityReport {
    const enabled = Object.entries(this.#manifest.capabilities)
      .filter(([, value]) => value === true || typeof value === "object")
      .map(([name]) => name as SemanticCapability);
    const content: CapabilityReport["content"] = {};
    const expression = this.#manifest.capabilities.expression;
    const motion = this.#manifest.capabilities.motion;
    const pose = this.#manifest.capabilities.pose;
    if (typeof expression === "object")
      content.expressions = [...expression.content];
    if (typeof motion === "object") content.motions = [...motion.content];
    if (typeof pose === "object") content.poses = [...pose.content];
    return {
      protocolVersion: PROTOCOL_VERSION,
      type: "capability.report",
      requestId,
      capabilities: enabled,
      content,
      limits: SECURITY_LIMITS,
    };
  }

  submit(input: unknown, context: TrustedSourceContext): SubmitResult {
    const requestId = this.#requestId(input);
    let bytes = Number.POSITIVE_INFINITY;
    try {
      bytes = new TextEncoder().encode(JSON.stringify(input)).byteLength;
    } catch {
      // Cyclic and otherwise non-serializable input is hostile input.
    }
    if (bytes > SECURITY_LIMITS.maxEnvelopeBytes)
      return this.#reject(
        context.source,
        requestId,
        "INVALID_ENVELOPE",
        "Envelope exceeds the byte limit",
      );
    const validation = validateCommandEnvelope(input);
    if (!validation.valid || !validation.value)
      return this.#reject(
        context.source,
        requestId,
        "INVALID_ENVELOPE",
        "Envelope failed schema validation",
      );
    const command = validation.value;
    if (command.type === "capability.query")
      return this.capabilities(command.id);
    const unsupported = this.#unsupported(command);
    if (unsupported)
      return this.#reject(
        context.source,
        command.id,
        unsupported.code,
        unsupported.message,
      );
    if (!this.#takeRateToken(context.source))
      return this.#reject(
        context.source,
        command.id,
        "RATE_LIMITED",
        "Command rate limit exceeded",
        true,
      );
    if (command.type === "command.cancel") {
      const index = this.#queue.findIndex(
        ({ command: item }) => item.id === command.payload.commandId,
      );
      if (index >= 0) {
        const [removed] = this.#queue.splice(index, 1);
        this.#emit({
          kind: "cancelled",
          ...(removed ? { commandId: removed.command.id } : {}),
          source: context.source,
        });
      } else {
        this.#enqueue({ command, context });
      }
      return this.#ack(command.id, "accepted");
    }
    if (command.type === "control.set") {
      const index = this.#queue.findIndex(
        (item) =>
          item.context.source === context.source &&
          item.command.type === "control.set" &&
          item.command.payload.channel === command.payload.channel,
      );
      if (index >= 0) {
        this.#queue[index] = { command, context };
        this.#emit({
          kind: "coalesced",
          commandId: command.id,
          source: context.source,
        });
        return this.#ack(command.id, "accepted");
      }
    }
    if (this.#queue.length >= this.#policy.queueLimit)
      return this.#reject(
        context.source,
        command.id,
        "RATE_LIMITED",
        "Command queue is full",
        true,
      );
    this.#enqueue({ command, context });
    return this.#ack(command.id, "accepted");
  }

  drain(limit = Number.POSITIVE_INFINITY): RoutedCommand[] {
    const count = Math.max(0, Math.floor(limit));
    this.#queue.sort(
      (a, b) => priorities[a.context.source] - priorities[b.context.source],
    );
    const result = this.#queue.splice(0, count);
    for (const item of result)
      this.#emit({
        kind: "dispatched",
        commandId: item.command.id,
        source: item.context.source,
      });
    return result;
  }

  clear(): void {
    this.#queue = [];
  }

  #enqueue(item: RoutedCommand): void {
    this.#queue.push(item);
    this.#emit({
      kind: "accepted",
      commandId: item.command.id,
      source: item.context.source,
    });
  }

  #takeRateToken(source: ControlSource): boolean {
    const now = this.#now();
    const cutoff = now - 1_000;
    this.#globalWindow = this.#globalWindow.filter((time) => time > cutoff);
    this.#sourceWindows[source] = this.#sourceWindows[source].filter(
      (time) => time > cutoff,
    );
    if (
      this.#globalWindow.length >= this.#policy.globalCommandsPerSecond ||
      this.#sourceWindows[source].length >=
        this.#policy.sourceCommandsPerSecond[source]
    )
      return false;
    this.#globalWindow.push(now);
    this.#sourceWindows[source].push(now);
    return true;
  }

  #unsupported(
    command: CommandEnvelope,
  ):
    | { code: "UNSUPPORTED_CAPABILITY" | "UNKNOWN_CONTENT"; message: string }
    | undefined {
    const capability =
      command.type === "control.set"
        ? command.payload.channel
        : command.type === "action.play"
          ? command.payload.action
          : command.type === "control.reset"
            ? "reset"
            : undefined;
    if (capability && !this.#manifest.capabilities[capability])
      return {
        code: "UNSUPPORTED_CAPABILITY",
        message: `${capability} is not supported`,
      };
    if (command.type === "action.play" && "contentId" in command.payload) {
      const configured = this.#manifest.capabilities[command.payload.action];
      if (
        typeof configured !== "object" ||
        !configured.content.includes(command.payload.contentId)
      )
        return {
          code: "UNKNOWN_CONTENT",
          message: `Unknown ${command.payload.action} content`,
        };
    }
    return undefined;
  }

  #requestId(input: unknown): string | undefined {
    if (typeof input !== "object" || input === null || !("id" in input))
      return undefined;
    return typeof input.id === "string" ? input.id : undefined;
  }

  #ack(requestId: string, status: Acknowledgement["status"]): Acknowledgement {
    return {
      protocolVersion: PROTOCOL_VERSION,
      type: "ack",
      requestId,
      status,
    };
  }

  #reject(
    source: ControlSource,
    requestId: string | undefined,
    code: ProtocolError["code"],
    message: string,
    retryable = false,
  ): ProtocolError {
    this.#emit({
      kind: "rejected",
      ...(requestId ? { commandId: requestId } : {}),
      source,
      detail: code,
    });
    return {
      protocolVersion: PROTOCOL_VERSION,
      type: "error",
      ...(requestId ? { requestId } : {}),
      code,
      message,
      retryable,
    };
  }

  #emit(event: ControlDiagnostic): void {
    for (const listener of this.#diagnostics) listener(event);
  }
}
