import {
  Ajv2020,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import manifestSchema from "./schemas/open-avatar-manifest.schema.json" with { type: "json" };
import controlEnvelopeSchema from "./schemas/control-envelope.schema.json" with { type: "json" };

export const PROTOCOL_VERSION = "1.0" as const;
export const MANIFEST_VERSION = "1.0" as const;
export type ControlSource = "human" | "ai" | "automation";
export type ContinuousChannel = "gaze" | "mouthOpen";
export type SemanticCapability =
  | "expression"
  | "motion"
  | "gaze"
  | "blink"
  | "mouthOpen"
  | "pose"
  | "reset"
  | "reducedMotion";

export interface OpenAvatarManifest {
  manifestVersion: string;
  id: string;
  name: string;
  canvas: { width: number; height: number };
  assets: Array<{ id: string; type: "image"; path: string; sha256?: string }>;
  parameters: Array<{ id: string; min: number; max: number; default: number }>;
  capabilities: Partial<
    Record<SemanticCapability, boolean | { content: string[] }>
  >;
}

interface EnvelopeBase {
  protocolVersion: string;
  id: string;
  timestamp?: number;
}
export interface CapabilityQueryEnvelope extends EnvelopeBase {
  type: "capability.query";
}
export interface SetControlEnvelope extends EnvelopeBase {
  type: "control.set";
  payload:
    | { channel: "gaze"; x: number; y: number }
    | { channel: "mouthOpen"; value: number };
  delivery: {
    mode: "coalesce";
    key: ContinuousChannel;
    supersedesPending: true;
  };
}
export interface PlayActionEnvelope extends EnvelopeBase {
  type: "action.play";
  payload:
    | { action: "blink" }
    | { action: "expression" | "motion" | "pose"; contentId: string };
}
export interface CancelEnvelope extends EnvelopeBase {
  type: "command.cancel";
  payload: { commandId: string };
}
export interface ResetEnvelope extends EnvelopeBase {
  type: "control.reset";
}
export type CommandEnvelope =
  | CapabilityQueryEnvelope
  | SetControlEnvelope
  | PlayActionEnvelope
  | CancelEnvelope
  | ResetEnvelope;

export type ErrorCode =
  | "INVALID_ENVELOPE"
  | "UNSUPPORTED_VERSION"
  | "UNSUPPORTED_CAPABILITY"
  | "UNKNOWN_CONTENT"
  | "CANCELLED"
  | "INTERRUPTED"
  | "RATE_LIMITED";
export interface Acknowledgement {
  protocolVersion: string;
  type: "ack";
  requestId: string;
  status: "accepted" | "completed" | "cancelled";
}
export interface ProtocolError {
  protocolVersion: string;
  type: "error";
  requestId?: string;
  code: ErrorCode;
  message: string;
  retryable: boolean;
}
export interface CapabilityReport {
  protocolVersion: string;
  type: "capability.report";
  requestId: string;
  capabilities: SemanticCapability[];
  content: Partial<Record<"expressions" | "motions" | "poses", string[]>>;
  limits: typeof SECURITY_LIMITS;
}

export const SECURITY_LIMITS = {
  maxEnvelopeBytes: 16_384,
  maxCommandsPerSecond: 120,
  maxIdLength: 128,
  maxAssets: 256,
  maxParameters: 256,
  maxManifestBytes: 1_048_576,
} as const;
export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  errors: ReadonlyArray<ErrorObject>;
}
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
});
const manifestValidator = ajv.compile(manifestSchema);
const envelopeValidator = ajv.compile(controlEnvelopeSchema);
function validate<T>(
  validator: ValidateFunction,
  input: unknown,
): ValidationResult<T> {
  const valid = validator(input);
  return {
    valid,
    ...(valid ? { value: input as T } : {}),
    errors: validator.errors ? [...validator.errors] : [],
  };
}
export function validateManifest(
  input: unknown,
): ValidationResult<OpenAvatarManifest> {
  const result = validate<OpenAvatarManifest>(manifestValidator, input);
  if (!result.valid || !result.value) return result;
  const rangeErrors: ErrorObject[] = [];
  result.value.parameters.forEach((parameter, index) => {
    if (
      parameter.min > parameter.max ||
      parameter.default < parameter.min ||
      parameter.default > parameter.max
    ) {
      rangeErrors.push({
        instancePath: `/parameters/${index}`,
        schemaPath: "#/properties/parameters/range",
        keyword: "range",
        params: {},
        message: "must satisfy min <= default <= max",
      });
    }
  });
  return rangeErrors.length ? { valid: false, errors: rangeErrors } : result;
}
export function validateCommandEnvelope(
  input: unknown,
): ValidationResult<CommandEnvelope> {
  const result = validate<CommandEnvelope>(envelopeValidator, input);
  if (
    result.valid &&
    result.value?.type === "control.set" &&
    result.value.delivery.key !== result.value.payload.channel
  ) {
    return {
      valid: false,
      errors: [
        {
          instancePath: "/delivery/key",
          schemaPath: "#/properties/delivery/key",
          keyword: "channelKey",
          params: {},
          message: "must match payload.channel",
        },
      ],
    };
  }
  return result;
}
export { controlEnvelopeSchema, manifestSchema };
