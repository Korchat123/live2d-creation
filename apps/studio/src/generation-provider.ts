import {
  acceptReferenceCandidate,
  addReferenceCandidate,
  createReferenceReviewState,
  IndexedDbReferenceReviewStore,
  rejectReferenceCandidate,
  selectReferenceCandidate,
  type ReferenceReviewState,
  type ReferenceReviewStore,
} from "./reference-review.js";

const MAX_PROMPT_BYTES = 16 * 1024;
const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
const MAX_ARTIFACT_EDGE = 1152;
const POLL_LIMIT = 180;

export const conceptTemplateId = "open-avatar-concept-v1";
export const zImageTurboConceptTemplateId = "open-avatar-z-image-turbo-v1";
export const partsFirstTemplateId = "open-avatar-parts-first-v1";

export const avatarStyleIds = ["vtuber", "anime", "soft-anime"] as const;
export type AvatarStyleId = (typeof avatarStyleIds)[number];

const avatarStylePrompts: Readonly<Record<AvatarStyleId, string>> = {
  vtuber:
    "polished VTuber character art, expressive detailed face, crisp tapered anime line art, clean two-step cel shading, grouped hair locks, readable garment seams, rig-friendly boundaries",
  anime:
    "polished Japanese TV anime character design, expressive detailed face, precise clean line art, two-tone cel shading, balanced natural anime colors",
  "soft-anime":
    "polished soft anime character art, expressive detailed face, delicate clean line art, restrained pastel palette, soft cel shading, readable material boundaries",
};

export const describeAvatarStyle = (
  description: string,
  style: AvatarStyleId,
): string =>
  `${normalizePrompt(description)}, art direction: ${avatarStylePrompts[style]}`;

export const conceptNodeAllowlist = [
  "CheckpointLoaderSimple",
  "CLIPTextEncode",
  "EmptyLatentImage",
  "KSampler",
  "VAEDecode",
  "SaveImage",
  "LoadImage",
  "ControlNetLoader",
  "ControlNetApplyAdvanced",
  "CLIPLoader",
  "VAELoader",
  "UNETLoader",
  "EmptySD3LatentImage",
  "ModelSamplingAuraFlow",
] as const;

export type ZImageTurboAssets = Readonly<{
  diffusionModel: string;
  textEncoder: string;
  vae: string;
}>;

type ComfyNode = {
  readonly class_type: (typeof conceptNodeAllowlist)[number];
  readonly inputs: Readonly<Record<string, unknown>>;
};

export type ProviderHealth = {
  readonly state: "ready" | "offline" | "misconfigured";
  readonly approvedCheckpoints: readonly string[];
  readonly approvedControlNets?: readonly string[];
  readonly message: string;
};

export type ConceptRequest = {
  readonly prompt: string;
  readonly checkpoint: string;
  readonly seed: number;
  readonly style?: AvatarStyleId;
};

export type ConceptPromptPlan = {
  readonly profile: "animagine-xl-4" | "z-image-turbo" | "generic";
  readonly identity: string;
  readonly style: string;
  readonly appearance: string;
  readonly clothing: string;
  readonly palette: string;
  readonly pose: string;
  readonly quality: string;
  readonly negative: string;
  readonly positive: string;
};

export type ConceptProvenance = {
  readonly provider: "comfyui" | "fake";
  readonly templateId:
    | typeof conceptTemplateId
    | typeof zImageTurboConceptTemplateId
    | typeof partsFirstTemplateId;
  readonly checkpoint: string;
  readonly partCheckpoint?: string;
  readonly seed: number;
  readonly artifactSha256: string;
  readonly compositionControl?: Readonly<{
    templateId: CompositionControlVersion;
    controlNet: string;
  }>;
};

export type ConceptCandidate = {
  readonly image: Blob;
  readonly provenance: ConceptProvenance;
};

export type AcceptedConceptDetail = {
  readonly image: string;
  readonly width: number;
  readonly height: number;
  readonly prompt: string;
  readonly provenance: ConceptProvenance;
};

export type GenerationProgress = {
  readonly stage: "submitting" | "queued" | "running" | "validating";
  readonly message: string;
};

export type GenerationOptions = {
  readonly signal: AbortSignal;
  readonly onProgress?: (progress: GenerationProgress) => void;
};

export interface GenerationProvider {
  health(signal?: AbortSignal): Promise<ProviderHealth>;
  generate(
    request: ConceptRequest,
    options: GenerationOptions,
  ): Promise<ConceptCandidate>;
}

export const defaultApprovedCheckpoint = (
  checkpoints: readonly string[],
): string =>
  checkpoints.find((checkpoint) => /z_image_turbo/iu.test(checkpoint)) ??
  (checkpoints.length === 1 ? (checkpoints[0] ?? "") : "");

export type DecodedImage = {
  readonly width: number;
  readonly height: number;
  readonly hasAlpha: boolean;
};

type Fetcher = typeof fetch;
type Sleeper = (milliseconds: number, signal: AbortSignal) => Promise<void>;

const utf8Size = (value: string): number =>
  new TextEncoder().encode(value).byteLength;

const hasControlCharacter = (value: string): boolean => {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
};

const boundedString = (
  value: unknown,
  label: string,
  maximum = 256,
): string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum ||
    hasControlCharacter(value)
  )
    throw new Error(`ComfyUI returned an invalid ${label}.`);
  return value;
};

const safeSubfolder = (value: unknown): string => {
  if (value === undefined || value === "") return "";
  const folder = boundedString(value, "output folder");
  if (
    folder.startsWith("/") ||
    folder.startsWith("\\") ||
    folder.includes("..") ||
    !/^[a-zA-Z0-9._/-]+$/u.test(folder)
  )
    throw new Error("ComfyUI returned an unsafe output folder.");
  return folder;
};

const abortError = (): DOMException =>
  new DOMException("Generation cancelled.", "AbortError");

const defaultSleep: Sleeper = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const timer = globalThis.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });

const sha256 = async (blob: Blob): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

export const validateConceptRequest = (
  request: ConceptRequest,
  approvedCheckpoints: ReadonlySet<string>,
): void => {
  const prompt = request.prompt.trim();
  if (!prompt) throw new Error("Describe the character before generating.");
  if (request.style !== undefined && !avatarStyleIds.includes(request.style))
    throw new Error("Select a supported avatar art style.");
  if (
    utf8Size(describeAvatarStyle(prompt, request.style ?? "vtuber")) >
    MAX_PROMPT_BYTES
  )
    throw new Error(
      "The character prompt and art style are larger than 16 KiB.",
    );
  if (!approvedCheckpoints.has(request.checkpoint))
    throw new Error("Select an approved local checkpoint.");
  if (
    !Number.isSafeInteger(request.seed) ||
    request.seed < 0 ||
    request.seed > 0xffffffff
  )
    throw new Error("The generation seed must be a 32-bit unsigned integer.");
};

const normalizePrompt = (value: string): string =>
  value.trim().replace(/\s+/gu, " ");

const subjectTag = (description: string): "1girl" | "1boy" | "1other" => {
  if (/\b(?:cat[- ]?girl|girl|woman|female|1girl)\b/iu.test(description))
    return "1girl";
  if (/\b(?:cat[- ]?boy|boy|man|male|1boy)\b/iu.test(description))
    return "1boy";
  return "1other";
};

export const createConceptPromptPlan = (
  description: string,
  checkpoint: string,
  style: AvatarStyleId = "vtuber",
): ConceptPromptPlan => {
  const identity = normalizePrompt(description);
  const animagine = /animagine-xl-4\.0/iu.test(checkpoint);
  const zImageTurbo = /z_image_turbo/iu.test(checkpoint);
  const hasHood = /\b(?:hood|hoodie|hooded)\b/iu.test(identity);
  const hasJacket = /\b(?:jacket|hoodie|coat|tailcoat)\b/iu.test(identity);
  const hasSkirt = /\bskirt\b/iu.test(identity);
  const allowsLongOuterwear =
    /\b(?:tailcoat|trench coat|long coat|floor[- ]length coat|ankle[- ]length coat|robe|cloak|cape)\b/iu.test(
      identity,
    );
  const appearance = animagine
    ? `${subjectTag(identity)}, adult, solo, original character`
    : "adult original 2D avatar character, solo";
  const clothing = [
    "requested clothes exactly preserved, requested garment lengths preserved",
    hasJacket && hasSkirt
      ? "jacket and skirt remain separate visible layers"
      : "garment layers remain visually distinct",
  ].join(", ");
  const palette =
    "consistent palette, natural skin tone, neutral white lighting";
  const faceVisibility = hasHood
    ? "hood opening frames rather than covers face"
    : "hair and accessories do not cover face";
  const pose = `front view, looking at viewer, full body, centered neutral standing pose, symmetrical level shoulders and hips, face and both eyes fully visible, ${faceVisibility}, hands visible outside sleeves, arms slightly separated, legs and complete shoes visible, entire silhouette inside frame with safe margin, plain white background`;
  const quality = animagine
    ? "masterpiece, high score, great score, absurdres"
    : "high quality";
  const garmentReject = [
    hasHood ? "void inside hood, face covered by hood" : "",
    allowsLongOuterwear ? "" : "floor-length coat, robe, cloak",
    hasJacket && hasSkirt
      ? "fused jacket and skirt, skirt hidden, zipper below garment hem"
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const negative = animagine
    ? `lowres, bad anatomy, bad hands, extra digits, missing digits, extra limbs, cropped, close-up, missing feet, hidden hands, featureless face, blank face, hair covering eyes, ${garmentReject}, mannequin, minimalist vector icon, text, watermark, signature, multiple people, background object, scenery, worst quality, low quality`
    : `cropped head, cropped hair, cropped shoulders, cropped legs, feet out of frame, body touching frame, hidden hands, featureless face, blank face, ${garmentReject}, side view, text, watermark, signature, logo, extra limbs, duplicate face, photorealistic, unnatural skin color, color cast`;
  return {
    profile: animagine
      ? "animagine-xl-4"
      : zImageTurbo
        ? "z-image-turbo"
        : "generic",
    identity,
    style: avatarStylePrompts[style],
    appearance,
    clothing,
    palette,
    pose,
    quality,
    negative,
    positive: [
      appearance,
      identity,
      avatarStylePrompts[style],
      clothing,
      palette,
      pose,
      quality,
    ]
      .filter(Boolean)
      .join(", "),
  };
};

export const createConceptWorkflow = (
  request: ConceptRequest,
  control?: Readonly<{ controlNet: string; image: string }>,
  zImageAssets?: ZImageTurboAssets,
): Readonly<Record<string, ComfyNode>> => {
  const plan = createConceptPromptPlan(
    request.prompt,
    request.checkpoint,
    request.style,
  );
  if (plan.profile === "z-image-turbo") {
    if (!zImageAssets || zImageAssets.diffusionModel !== request.checkpoint)
      throw new Error("The approved Z-Image Turbo assets are incomplete.");
    return {
      "1": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: zImageAssets.textEncoder,
          type: "lumina2",
          device: "default",
        },
      },
      "2": {
        class_type: "VAELoader",
        inputs: { vae_name: zImageAssets.vae },
      },
      "3": {
        class_type: "UNETLoader",
        inputs: {
          unet_name: zImageAssets.diffusionModel,
          weight_dtype: "default",
        },
      },
      "4": {
        class_type: "CLIPTextEncode",
        inputs: { text: plan.positive, clip: ["1", 0] },
      },
      "5": {
        class_type: "CLIPTextEncode",
        inputs: { text: plan.negative, clip: ["1", 0] },
      },
      "6": {
        class_type: "EmptySD3LatentImage",
        inputs: { width: 768, height: 1152, batch_size: 1 },
      },
      "7": {
        class_type: "ModelSamplingAuraFlow",
        inputs: { shift: 3, model: ["3", 0] },
      },
      "8": {
        class_type: "KSampler",
        inputs: {
          seed: request.seed,
          steps: 8,
          cfg: 1,
          sampler_name: "res_multistep",
          scheduler: "simple",
          denoise: 1,
          model: ["7", 0],
          positive: ["4", 0],
          negative: ["5", 0],
          latent_image: ["6", 0],
        },
      },
      "9": {
        class_type: "VAEDecode",
        inputs: { samples: ["8", 0], vae: ["2", 0] },
      },
      "10": {
        class_type: "SaveImage",
        inputs: {
          filename_prefix: "open-avatar-z-image-concept",
          images: ["9", 0],
        },
      },
    };
  }
  const animagine = plan.profile === "animagine-xl-4";
  const workflow: Record<string, ComfyNode> = {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: request.checkpoint },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: plan.positive,
        clip: ["1", 1],
      },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: plan.negative,
        clip: ["1", 1],
      },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: {
        width: animagine ? 896 : 768,
        height: animagine ? 1152 : 1024,
        batch_size: 1,
      },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed: request.seed,
        steps: animagine ? 28 : 20,
        cfg: animagine ? 5 : 6,
        sampler_name: animagine ? "euler_ancestral" : "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["1", 0],
        positive: control ? ["10", 0] : ["2", 0],
        negative: control ? ["10", 1] : ["3", 0],
        latent_image: ["4", 0],
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "open-avatar-concept", images: ["6", 0] },
    },
  };
  if (control) {
    workflow["8"] = {
      class_type: "LoadImage",
      inputs: { image: control.image },
    };
    workflow["9"] = {
      class_type: "ControlNetLoader",
      inputs: { control_net_name: control.controlNet },
    };
    workflow["10"] = {
      class_type: "ControlNetApplyAdvanced",
      inputs: {
        positive: ["2", 0],
        negative: ["3", 0],
        control_net: ["9", 0],
        image: ["8", 0],
        strength: 0.75,
        start_percent: 0,
        end_percent: 0.75,
        vae: ["1", 2],
      },
    };
  }
  return workflow;
};

const sniffImageMime = (bytes: Uint8Array): "image/png" | "image/webp" => {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (isPng) return "image/png";
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isWebp) return "image/webp";
  throw new Error("The provider result is not a supported PNG or WebP image.");
};

export const validateImageArtifact = async (
  blob: Blob,
  decode: (blob: Blob) => Promise<DecodedImage>,
  requireAlpha = false,
): Promise<DecodedImage> => {
  if (blob.size === 0 || blob.size > MAX_ARTIFACT_BYTES)
    throw new Error("The provider image exceeds the 4 MiB artifact limit.");
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const actualMime = sniffImageMime(bytes);
  if (blob.type && blob.type !== actualMime)
    throw new Error(
      "The provider image MIME type does not match its contents.",
    );
  const decoded = await decode(blob);
  if (
    !Number.isInteger(decoded.width) ||
    !Number.isInteger(decoded.height) ||
    decoded.width < 1 ||
    decoded.height < 1 ||
    decoded.width > MAX_ARTIFACT_EDGE ||
    decoded.height > MAX_ARTIFACT_EDGE
  )
    throw new Error("The provider image exceeds the 1152-pixel edge limit.");
  if (requireAlpha && !decoded.hasAlpha)
    throw new Error("This generated part requires a transparent image.");
  return decoded;
};

type HistoryImage = {
  readonly filename?: unknown;
  readonly subfolder?: unknown;
  readonly type?: unknown;
};

const firstHistoryImage = (
  value: unknown,
  promptId: string,
): HistoryImage | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const job = (value as Record<string, unknown>)[promptId];
  if (!job || typeof job !== "object") return undefined;
  const outputs = (job as { outputs?: unknown }).outputs;
  if (!outputs || typeof outputs !== "object") return undefined;
  for (const output of Object.values(outputs as Record<string, unknown>)) {
    if (!output || typeof output !== "object") continue;
    const images = (output as { images?: unknown }).images;
    if (Array.isArray(images) && images.length > 0)
      return images[0] as HistoryImage;
  }
  return undefined;
};

export class ComfyGenerationProvider implements GenerationProvider {
  readonly #approvedCheckpoints: ReadonlySet<string>;
  readonly #approvedClassicCheckpoints: ReadonlySet<string>;
  readonly #approvedControlNets: ReadonlySet<string>;
  readonly #fetch: Fetcher;
  readonly #sleep: Sleeper;
  readonly #createCompositionControl: () => Promise<Blob>;
  readonly #zImageAssets: ZImageTurboAssets | undefined;
  #active = false;

  constructor(
    approvedCheckpoints: readonly string[],
    fetcher: Fetcher = fetch,
    sleeper: Sleeper = defaultSleep,
    approvedControlNets: readonly string[] = [],
    createCompositionControl: () => Promise<Blob> = createCompositionControlPng,
    zImageAssets?: ZImageTurboAssets,
  ) {
    const safeCheckpoints = approvedCheckpoints.filter(
      (checkpoint) =>
        checkpoint.length > 0 &&
        checkpoint.length <= 256 &&
        !hasControlCharacter(checkpoint),
    );
    this.#approvedClassicCheckpoints = new Set(safeCheckpoints);
    this.#zImageAssets =
      zImageAssets &&
      [
        zImageAssets.diffusionModel,
        zImageAssets.textEncoder,
        zImageAssets.vae,
      ].every(
        (name) =>
          name.length > 0 && name.length <= 256 && !hasControlCharacter(name),
      )
        ? zImageAssets
        : undefined;
    this.#approvedCheckpoints = new Set([
      ...safeCheckpoints,
      ...(this.#zImageAssets ? [this.#zImageAssets.diffusionModel] : []),
    ]);
    this.#approvedControlNets = new Set(
      approvedControlNets.filter(
        (controlNet) =>
          controlNet.length > 0 &&
          controlNet.length <= 256 &&
          !hasControlCharacter(controlNet),
      ),
    );
    this.#fetch = fetcher.bind(globalThis);
    this.#sleep = sleeper;
    this.#createCompositionControl = createCompositionControl;
  }

  async health(signal?: AbortSignal): Promise<ProviderHealth> {
    if (this.#approvedCheckpoints.size === 0)
      return {
        state: "misconfigured",
        approvedCheckpoints: [],
        message:
          "No checkpoint is allowlisted. Set VITE_COMFY_CHECKPOINTS before starting Studio.",
      };
    try {
      const request = signal ? { signal } : undefined;
      const [stats, models, controlNets, diffusionModels, textEncoders, vaes] =
        await Promise.all([
          this.#fetch("/comfy/system_stats", request),
          this.#approvedClassicCheckpoints.size
            ? this.#fetch("/comfy/models/checkpoints", request)
            : Promise.resolve(undefined),
          this.#approvedControlNets.size
            ? this.#fetch("/comfy/models/controlnet", request)
            : Promise.resolve(undefined),
          this.#zImageAssets
            ? this.#fetch("/comfy/models/diffusion_models", request)
            : Promise.resolve(undefined),
          this.#zImageAssets
            ? this.#fetch("/comfy/models/text_encoders", request)
            : Promise.resolve(undefined),
          this.#zImageAssets
            ? this.#fetch("/comfy/models/vae", request)
            : Promise.resolve(undefined),
        ]);
      if (
        !stats.ok ||
        (models && !models.ok) ||
        (controlNets && !controlNets.ok) ||
        (diffusionModels && !diffusionModels.ok) ||
        (textEncoders && !textEncoders.ok) ||
        (vaes && !vaes.ok)
      )
        throw new Error("Provider health failed.");
      const discovered = models ? ((await models.json()) as unknown) : [];
      if (!Array.isArray(discovered))
        return {
          state: "offline",
          approvedCheckpoints: [],
          message: "ComfyUI returned an invalid checkpoint inventory.",
        };
      const approved = discovered.filter(
        (value): value is string =>
          typeof value === "string" &&
          this.#approvedClassicCheckpoints.has(value),
      );
      const zInventories = await Promise.all(
        [diffusionModels, textEncoders, vaes].map(async (response) =>
          response ? ((await response.json()) as unknown) : [],
        ),
      );
      if (zInventories.some((inventory) => !Array.isArray(inventory)))
        throw new Error("ComfyUI returned an invalid Z-Image inventory.");
      const zReady =
        this.#zImageAssets !== undefined &&
        (zInventories[0] as unknown[]).includes(
          this.#zImageAssets.diffusionModel,
        ) &&
        (zInventories[1] as unknown[]).includes(
          this.#zImageAssets.textEncoder,
        ) &&
        (zInventories[2] as unknown[]).includes(this.#zImageAssets.vae);
      if (zReady) approved.push(this.#zImageAssets.diffusionModel);
      if (approved.length === 0)
        return {
          state: "misconfigured",
          approvedCheckpoints: [],
          message: "None of the allowlisted generation models are installed.",
        };
      const discoveredControlNets = controlNets
        ? ((await controlNets.json()) as unknown)
        : [];
      if (!Array.isArray(discoveredControlNets))
        throw new Error("ComfyUI returned an invalid ControlNet inventory.");
      const approvedControlNets = discoveredControlNets.filter(
        (value): value is string =>
          typeof value === "string" && this.#approvedControlNets.has(value),
      );
      if (
        this.#approvedControlNets.size > 0 &&
        approvedControlNets.length === 0
      )
        return {
          state: "misconfigured",
          approvedCheckpoints: approved,
          approvedControlNets: [],
          message: "None of the allowlisted ControlNet models are installed.",
        };
      return {
        state: "ready",
        approvedCheckpoints: approved,
        approvedControlNets,
        message: `Local ComfyUI is ready with ${approved.length} approved generation model${approved.length === 1 ? "" : "s"}${approvedControlNets.length ? " and experimental composition control" : ""}.`,
      };
    } catch (error) {
      if (signal?.aborted) throw abortError();
      return {
        state: "offline",
        approvedCheckpoints: [],
        message:
          error instanceof Error
            ? `Local ComfyUI is unavailable: ${error.message}`
            : "Local ComfyUI is unavailable.",
      };
    }
  }

  async #cancel(promptId?: string): Promise<void> {
    const calls: Promise<unknown>[] = [
      this.#fetch("/comfy/interrupt", { method: "POST" }).catch(
        () => undefined,
      ),
    ];
    if (promptId)
      calls.push(
        this.#fetch("/comfy/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delete: [promptId] }),
        }).catch(() => undefined),
      );
    await Promise.all(calls);
  }

  async #uploadCompositionControl(signal: AbortSignal): Promise<string> {
    const form = new FormData();
    form.append(
      "image",
      await this.#createCompositionControl(),
      `${compositionControlVersion}.png`,
    );
    form.append("type", "input");
    form.append("overwrite", "true");
    const response = await this.#fetch("/comfy/upload/image", {
      method: "POST",
      body: form,
      signal,
    });
    if (!response.ok)
      throw new Error("ComfyUI rejected the composition control image.");
    const uploaded = (await response.json()) as {
      name?: unknown;
      subfolder?: unknown;
      type?: unknown;
    };
    const name = boundedString(uploaded.name, "control image name");
    const subfolder = safeSubfolder(uploaded.subfolder);
    if (uploaded.type !== "input")
      throw new Error("ComfyUI returned an unexpected control image type.");
    return subfolder ? `${subfolder}/${name}` : name;
  }

  async generate(
    request: ConceptRequest,
    options: GenerationOptions,
  ): Promise<ConceptCandidate> {
    validateConceptRequest(request, this.#approvedCheckpoints);
    if (this.#active)
      throw new Error("Wait for the current generation job to finish.");
    if (options.signal.aborted) throw abortError();
    this.#active = true;
    let promptId: string | undefined;
    const cancel = (): void => {
      void this.#cancel(promptId);
    };
    options.signal.addEventListener("abort", cancel, { once: true });
    try {
      const isZImageTurbo = /z_image_turbo/iu.test(request.checkpoint);
      const controlNet = isZImageTurbo
        ? undefined
        : this.#approvedControlNets.values().next().value;
      const control = controlNet
        ? {
            controlNet,
            image: await this.#uploadCompositionControl(options.signal),
          }
        : undefined;
      options.onProgress?.({
        stage: "submitting",
        message: "Submitting the reviewed concept workflow…",
      });
      const response = await this.#fetch("/comfy/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createConceptWorkflow(request, control, this.#zImageAssets),
        }),
        signal: options.signal,
      });
      if (!response.ok)
        throw new Error(`ComfyUI rejected the workflow (${response.status}).`);
      const queued = (await response.json()) as { prompt_id?: unknown };
      promptId = boundedString(queued.prompt_id, "job id");
      options.onProgress?.({
        stage: "queued",
        message: "The concept job is queued locally…",
      });
      let image: HistoryImage | undefined;
      for (let attempt = 0; attempt < POLL_LIMIT; attempt += 1) {
        await this.#sleep(1000, options.signal);
        const history = await this.#fetch(
          `/comfy/history/${encodeURIComponent(promptId)}`,
          { signal: options.signal },
        );
        if (!history.ok) continue;
        image = firstHistoryImage(await history.json(), promptId);
        if (image) break;
        options.onProgress?.({
          stage: "running",
          message: "ComfyUI is generating the concept locally…",
        });
      }
      if (!image) {
        await this.#cancel(promptId);
        throw new Error("ComfyUI did not finish within 180 seconds.");
      }
      const filename = boundedString(image.filename, "output filename");
      const subfolder = safeSubfolder(image.subfolder);
      if (image.type !== undefined && image.type !== "output")
        throw new Error("ComfyUI returned an unexpected output type.");
      const query = new URLSearchParams({
        filename,
        subfolder,
        type: "output",
      });
      options.onProgress?.({
        stage: "validating",
        message: "Validating the generated candidate…",
      });
      const artifactResponse = await this.#fetch(`/comfy/view?${query}`, {
        signal: options.signal,
      });
      if (!artifactResponse.ok)
        throw new Error("ComfyUI could not return the generated image.");
      const imageBlob = await artifactResponse.blob();
      if (imageBlob.size === 0 || imageBlob.size > MAX_ARTIFACT_BYTES)
        throw new Error("The provider image exceeds the 4 MiB artifact limit.");
      const partCheckpoint = this.#approvedClassicCheckpoints
        .values()
        .next().value;
      return {
        image: imageBlob,
        provenance: {
          provider: "comfyui",
          templateId: isZImageTurbo
            ? zImageTurboConceptTemplateId
            : conceptTemplateId,
          checkpoint: request.checkpoint,
          ...(isZImageTurbo && typeof partCheckpoint === "string"
            ? { partCheckpoint }
            : {}),
          seed: request.seed,
          artifactSha256: await sha256(imageBlob),
          ...(controlNet
            ? {
                compositionControl: {
                  templateId: compositionControlVersion,
                  controlNet,
                },
              }
            : {}),
        },
      };
    } catch (error) {
      if (options.signal.aborted) throw abortError();
      throw error;
    } finally {
      options.signal.removeEventListener("abort", cancel);
      this.#active = false;
    }
  }
}

export class FakeGenerationProvider implements GenerationProvider {
  constructor(
    private readonly candidate: ConceptCandidate,
    private readonly checkpoints: readonly string[] = [
      "fake-approved.safetensors",
    ],
  ) {}

  health(): Promise<ProviderHealth> {
    return Promise.resolve({
      state: "ready",
      approvedCheckpoints: this.checkpoints,
      message: "Fake provider ready.",
    });
  }

  generate(
    request: ConceptRequest,
    options: GenerationOptions,
  ): Promise<ConceptCandidate> {
    validateConceptRequest(request, new Set(this.checkpoints));
    if (options.signal.aborted) throw abortError();
    options.onProgress?.({
      stage: "validating",
      message: "Fake provider candidate ready.",
    });
    return Promise.resolve(this.candidate);
  }
}

const decodeBrowserImage = async (blob: Blob): Promise<DecodedImage> => {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The generated image could not be decoded.");
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let hasAlpha = false;
    for (let offset = 3; offset < pixels.length; offset += 4)
      if ((pixels[offset] ?? 255) < 255) {
        hasAlpha = true;
        break;
      }
    return { width: bitmap.width, height: bitmap.height, hasAlpha };
  } finally {
    bitmap.close();
  }
};

const blobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not preserve the concept."));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not preserve the concept."));
    };
    reader.readAsDataURL(blob);
  });

const createTransparentPartsCanvas = async (): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = 896;
  canvas.height = 1152;
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the parts-first canvas."));
    }, "image/png"),
  );
};

export const mountPromptWorkspace = (
  host: HTMLElement,
  provider: GenerationProvider,
  options: Readonly<{
    automaticBuild?: "parts-first";
    referenceReviewStore?: ReferenceReviewStore;
  }> = {},
): void => {
  const prompt = host.querySelector<HTMLTextAreaElement>("#character-prompt");
  const style = host.querySelector<HTMLSelectElement>("#avatar-style");
  const checkpoint = host.querySelector<HTMLSelectElement>(
    "#concept-checkpoint",
  );
  const check = host.querySelector<HTMLButtonElement>("#check-generation");
  const generate = host.querySelector<HTMLButtonElement>("#generate-concept");
  const cancel = host.querySelector<HTMLButtonElement>("#cancel-generation");
  const status = host.querySelector<HTMLElement>("#generation-status");
  const output = host.querySelector<HTMLImageElement>("#concept-output");
  const provenance = host.querySelector<HTMLElement>("#concept-provenance");
  const accept = host.querySelector<HTMLButtonElement>("#accept-concept");
  const reject = host.querySelector<HTMLButtonElement>("#reject-concept");
  const rejectionReason = host.querySelector<HTMLInputElement>(
    "#reference-rejection-reason",
  );
  const variants = host.querySelector<HTMLElement>("#concept-variants");
  const promptPlan = host.querySelector<HTMLElement>("#concept-prompt-plan");
  if (
    !prompt ||
    !style ||
    !checkpoint ||
    !check ||
    !generate ||
    !cancel ||
    !status ||
    !output ||
    !provenance ||
    !accept ||
    !reject ||
    !rejectionReason ||
    !variants ||
    !promptPlan
  )
    return;

  let controller: AbortController | undefined;
  let providerReady = false;
  let providerCheckpoints: readonly string[] = [];
  const reviewStore =
    options.referenceReviewStore ?? new IndexedDbReferenceReviewStore();
  let reviewState: ReferenceReviewState = createReferenceReviewState();
  let saveQueue = Promise.resolve();
  type CandidateVariant = Readonly<{
    detail: AcceptedConceptDetail;
    url: string;
  }>;
  let candidates: CandidateVariant[] = [];
  let acceptedCandidate: CandidateVariant | undefined;

  const persistReview = (): Promise<void> => {
    const snapshot = reviewState;
    saveQueue = saveQueue
      .catch(() => undefined)
      .then(() => reviewStore.save(snapshot));
    return saveQueue;
  };

  const renderPromptPlan = (): void => {
    const plan = createConceptPromptPlan(
      prompt.value,
      checkpoint.value,
      style.value as AvatarStyleId,
    );
    const fields: ReadonlyArray<readonly [string, string]> = [
      ["Profile", plan.profile],
      ["Identity", plan.identity || "Enter a character description."],
      ["Art style", plan.style],
      ["Appearance", plan.appearance],
      ["Clothing", plan.clothing],
      ["Palette", plan.palette],
      ["Pose", plan.pose],
      ["Quality", plan.quality],
      ["Reject", plan.negative],
    ];
    promptPlan.replaceChildren(
      ...fields.map(([label, value]) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");
        term.textContent = label;
        detail.textContent = value;
        row.append(term, detail);
        return row;
      }),
    );
  };

  const selectCandidate = (variant: CandidateVariant): void => {
    acceptedCandidate = variant;
    const id = variant.detail.provenance.artifactSha256;
    if (reviewState.selectedId !== id) {
      const previous = reviewState;
      const previousCandidate = candidates.find(
        ({ detail }) =>
          detail.provenance.artifactSha256 === previous.selectedId,
      );
      reviewState = selectReferenceCandidate(reviewState, id, Date.now());
      void persistReview().catch((error: unknown) => {
        reviewState = previous;
        if (previousCandidate) {
          acceptedCandidate = previousCandidate;
          renderVariants();
        }
        status.textContent =
          error instanceof Error
            ? error.message
            : "Could not save the selected reference.";
      });
    }
    const decision = reviewState.candidates.find(
      (candidate) => candidate.id === id,
    )?.decision;
    output.src = variant.url;
    output.hidden = false;
    provenance.dataset.hash = id;
    provenance.textContent = `${variant.detail.width}×${variant.detail.height} · seed ${variant.detail.provenance.seed} · SHA-256 ${id.slice(0, 12)}… · ${decision ?? "pending"}`;
    accept.textContent = reviewState.acceptedId
      ? "Resume accepted reference"
      : "Accept neutral master";
    accept.disabled =
      decision === "rejected" ||
      (Boolean(reviewState.acceptedId) && reviewState.acceptedId !== id);
    reject.disabled = decision !== "pending" || Boolean(reviewState.acceptedId);
    rejectionReason.disabled = reject.disabled;
    variants
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((button) =>
        button.classList.toggle("selected", button.dataset.hash === id),
      );
  };

  const renderVariants = (): void => {
    variants.replaceChildren(
      ...candidates.map((variant, index) => {
        const id = variant.detail.provenance.artifactSha256;
        const decision = reviewState.candidates.find(
          (candidate) => candidate.id === id,
        )?.decision;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "concept-variant quiet";
        button.dataset.hash = id;
        button.dataset.decision = decision;
        button.title = `Candidate ${index + 1}, ${decision ?? "pending"}, seed ${variant.detail.provenance.seed}`;
        const image = document.createElement("img");
        image.src = variant.url;
        image.alt = `Neutral-master candidate ${index + 1}, ${decision ?? "pending"}`;
        button.append(image);
        button.addEventListener("click", () => selectCandidate(variant));
        return button;
      }),
    );
    const selected = candidates.find(
      ({ detail }) =>
        detail.provenance.artifactSha256 === reviewState.selectedId,
    );
    if (selected) selectCandidate(selected);
  };

  const setHealth = async (): Promise<void> => {
    check.disabled = true;
    generate.disabled = true;
    status.textContent = "Checking the local generation provider…";
    try {
      const health = await provider.health();
      providerReady = health.state === "ready";
      providerCheckpoints = health.approvedCheckpoints;
      checkpoint.replaceChildren(
        new Option(
          health.approvedCheckpoints.length
            ? "Select an approved checkpoint"
            : "No approved checkpoint available",
          "",
        ),
        ...health.approvedCheckpoints.map((name) => new Option(name, name)),
      );
      checkpoint.value = defaultApprovedCheckpoint(health.approvedCheckpoints);
      renderPromptPlan();
      status.textContent = checkpoint.value
        ? `${health.message} ${checkpoint.value} selected.`
        : health.message;
      generate.disabled =
        !providerReady || !checkpoint.value || Boolean(reviewState.acceptedId);
    } finally {
      check.disabled = false;
    }
  };

  check.addEventListener("click", () => void setHealth());
  prompt.addEventListener("input", renderPromptPlan);
  style.addEventListener("change", renderPromptPlan);
  checkpoint.addEventListener("change", () => {
    generate.disabled =
      !providerReady || !checkpoint.value || Boolean(reviewState.acceptedId);
    renderPromptPlan();
  });
  cancel.addEventListener("click", () => controller?.abort());
  accept.addEventListener("click", () => {
    if (!acceptedCandidate) return;
    accept.disabled = true;
    void (async () => {
      try {
        const detail = acceptedCandidate.detail;
        const id = detail.provenance.artifactSha256;
        if (!reviewState.acceptedId) {
          const previous = reviewState;
          reviewState = acceptReferenceCandidate(reviewState, id, Date.now());
          try {
            await persistReview();
          } catch (error) {
            reviewState = previous;
            throw error;
          }
        } else if (reviewState.acceptedId !== id) {
          throw new Error("The accepted neutral master is immutable.");
        }
        host.dispatchEvent(
          new CustomEvent<AcceptedConceptDetail>("avatarconceptaccepted", {
            detail,
          }),
        );
        status.textContent =
          "Neutral master accepted. Studio is building the avatar automatically.";
        prompt.disabled = true;
        style.disabled = true;
        checkpoint.disabled = true;
        check.disabled = true;
        generate.disabled = true;
        reject.disabled = true;
        rejectionReason.disabled = true;
        variants
          .querySelectorAll<HTMLButtonElement>("button")
          .forEach((button) => (button.disabled = true));
        renderVariants();
      } catch (error) {
        status.textContent =
          error instanceof Error ? error.message : "Could not accept concept.";
        accept.disabled = false;
      }
    })();
  });
  reject.addEventListener("click", () => {
    if (!acceptedCandidate) return;
    void (async () => {
      try {
        const id = acceptedCandidate.detail.provenance.artifactSha256;
        const previous = reviewState;
        reviewState = rejectReferenceCandidate(
          reviewState,
          id,
          rejectionReason.value,
          Date.now(),
        );
        try {
          await persistReview();
        } catch (error) {
          reviewState = previous;
          throw error;
        }
        rejectionReason.value = "";
        renderVariants();
        status.textContent =
          "Reference rejected and saved. Generate another reference or compare earlier candidates.";
        generate.textContent = "Regenerate reference";
      } catch (error) {
        status.textContent =
          error instanceof Error ? error.message : "Could not reject concept.";
      }
    })();
  });
  generate.addEventListener("click", () => {
    void (async () => {
      controller = new AbortController();
      generate.disabled = true;
      check.disabled = true;
      style.disabled = true;
      cancel.disabled = false;
      try {
        const submittedPrompt = prompt.value.trim();
        const selectedStyle = style.value as AvatarStyleId;
        const persistedPrompt = describeAvatarStyle(
          submittedPrompt,
          selectedStyle,
        );
        const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
        if (options.automaticBuild === "parts-first") {
          validateConceptRequest(
            {
              prompt: submittedPrompt,
              checkpoint: checkpoint.value,
              seed,
              style: selectedStyle,
            },
            new Set(providerCheckpoints),
          );
          const blank = await createTransparentPartsCanvas();
          const detail: AcceptedConceptDetail = {
            image: await blobAsDataUrl(blank),
            width: 896,
            height: 1152,
            prompt: persistedPrompt,
            provenance: {
              provider: "comfyui",
              templateId: partsFirstTemplateId,
              checkpoint: checkpoint.value,
              seed,
              artifactSha256: await sha256(blank),
            },
          };
          output.hidden = true;
          provenance.textContent =
            "Parts-first build: no complete portrait will be generated or cropped.";
          host.dataset.pipelineBusy = "true";
          status.textContent =
            "Part manifest ready. Generating independent transparent artwork…";
          host.dispatchEvent(
            new CustomEvent<AcceptedConceptDetail>("avatarconceptgenerated", {
              detail,
            }),
          );
          return;
        }
        const candidate = await provider.generate(
          {
            prompt: submittedPrompt,
            checkpoint: checkpoint.value,
            seed,
            style: selectedStyle,
          },
          {
            signal: controller.signal,
            onProgress: (progress) => {
              status.textContent = progress.message;
            },
          },
        );
        const decoded = await validateImageArtifact(
          candidate.image,
          decodeBrowserImage,
        );
        const detail: AcceptedConceptDetail = {
          image: await blobAsDataUrl(candidate.image),
          width: decoded.width,
          height: decoded.height,
          prompt: persistedPrompt,
          provenance: candidate.provenance,
        };
        const previous = reviewState;
        reviewState = addReferenceCandidate(reviewState, detail, Date.now());
        try {
          await persistReview();
        } catch (error) {
          reviewState = previous;
          throw error;
        }
        candidates = reviewState.candidates.map(({ concept }) => ({
          detail: concept,
          url: concept.image,
        }));
        acceptedCandidate = candidates.find(
          ({ detail: candidateDetail }) =>
            candidateDetail.provenance.artifactSha256 ===
            detail.provenance.artifactSha256,
        );
        renderVariants();
        generate.textContent = "Regenerate reference";
        status.textContent = `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} saved. Review the full body, face, hands, and shoes before accepting.`;
        output.focus();
      } catch (error) {
        status.textContent =
          error instanceof DOMException && error.name === "AbortError"
            ? "Generation cancelled. No project revision was created."
            : error instanceof Error
              ? error.message
              : "Generation failed.";
      } finally {
        controller = undefined;
        generate.disabled =
          !providerReady ||
          !checkpoint.value ||
          Boolean(reviewState.acceptedId) ||
          host.dataset.pipelineBusy === "true";
        check.disabled = false;
        style.disabled = Boolean(reviewState.acceptedId);
        cancel.disabled = true;
      }
    })();
  });

  const restoreReview = async (): Promise<void> => {
    try {
      const restored = await reviewStore.load();
      if (!restored) return;
      reviewState = restored;
      candidates = restored.candidates.map(({ concept }) => ({
        detail: concept,
        url: concept.image,
      }));
      const selected = restored.candidates.find(
        ({ id }) => id === restored.selectedId,
      );
      if (selected) {
        prompt.value = selected.concept.prompt;
        if (
          providerCheckpoints.includes(selected.concept.provenance.checkpoint)
        )
          checkpoint.value = selected.concept.provenance.checkpoint;
      }
      renderPromptPlan();
      renderVariants();
      if (restored.acceptedId) {
        prompt.disabled = true;
        style.disabled = true;
        checkpoint.disabled = true;
        generate.disabled = true;
        generate.textContent = "Reference accepted";
        status.textContent =
          "Accepted neutral master restored. Choose Resume accepted reference to continue; no generation restarted automatically.";
      } else {
        generate.textContent = candidates.length
          ? "Regenerate reference"
          : "Generate reference";
        status.textContent = `${candidates.length} saved reference candidate${candidates.length === 1 ? "" : "s"} restored for review.`;
      }
      host.dispatchEvent(
        new CustomEvent<ReferenceReviewState>("avatarreferencereviewrestored", {
          detail: restored,
        }),
      );
    } catch (error) {
      status.textContent =
        error instanceof Error
          ? `${error.message} Generate a new reference to recover.`
          : "Could not restore the reference review.";
    }
  };

  renderPromptPlan();
  void setHealth().then(restoreReview);
};
import {
  compositionControlVersion,
  createCompositionControlPng,
  type CompositionControlVersion,
} from "./composition-control.js";
