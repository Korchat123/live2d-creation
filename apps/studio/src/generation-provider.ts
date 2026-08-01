const MAX_PROMPT_BYTES = 16 * 1024;
const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
const MAX_ARTIFACT_EDGE = 1024;
const POLL_LIMIT = 180;

export const conceptTemplateId = "open-avatar-concept-v1";

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
] as const;

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
};

export type ConceptPromptPlan = {
  readonly profile: "animagine-xl-4" | "generic";
  readonly identity: string;
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
  readonly templateId: typeof conceptTemplateId;
  readonly checkpoint: string;
  readonly seed: number;
  readonly artifactSha256: string;
  readonly compositionControl?: Readonly<{
    templateId: typeof compositionControlVersion;
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
): string => (checkpoints.length === 1 ? (checkpoints[0] ?? "") : "");

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
  if (utf8Size(prompt) > MAX_PROMPT_BYTES)
    throw new Error("The character prompt is larger than 16 KiB.");
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
  if (/\b(?:girl|woman|female|1girl)\b/iu.test(description)) return "1girl";
  if (/\b(?:boy|man|male|1boy)\b/iu.test(description)) return "1boy";
  return "1other";
};

export const createConceptPromptPlan = (
  description: string,
  checkpoint: string,
): ConceptPromptPlan => {
  const identity = normalizePrompt(description);
  const animagine = /animagine-xl-4\.0/iu.test(checkpoint);
  const appearance = animagine
    ? `${subjectTag(identity)}, original character, solo, anime style, clean line art`
    : "original 2D avatar character, solo, clean silhouette, consistent lighting";
  const clothing = "clothing and accessories exactly as described";
  const palette = "consistent color palette";
  const pose =
    "looking at viewer, front view, full body, standing, zoomed out, centered composition, neutral pose, head fully inside frame, complete head, complete hair, generous margin above hair, visible neck, visible shoulders, isolated on a blank pure white background, no props";
  const quality = animagine
    ? "masterpiece, high score, great score, absurdres"
    : "high quality";
  const negative = animagine
    ? "lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, close-up, extreme close-up, head out of frame, hair out of frame, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, multiple people, duplicate face, side view, border, frame, halo, sunburst, rays, background object, colored background, gradient background, abstract background, scenery"
    : "cropped head, cropped hair, cropped shoulders, side view, text, watermark, signature, logo, extra limbs, duplicate face, photorealistic";
  return {
    profile: animagine ? "animagine-xl-4" : "generic",
    identity,
    appearance,
    clothing,
    palette,
    pose,
    quality,
    negative,
    positive: [appearance, identity, clothing, palette, pose, quality]
      .filter(Boolean)
      .join(", "),
  };
};

export const createConceptWorkflow = (
  request: ConceptRequest,
  control?: Readonly<{ controlNet: string; image: string }>,
): Readonly<Record<string, ComfyNode>> => {
  const plan = createConceptPromptPlan(request.prompt, request.checkpoint);
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
        width: animagine ? 1024 : 768,
        height: animagine ? 1024 : 768,
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
    throw new Error("The provider image exceeds the 1024-pixel edge limit.");
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
  readonly #approvedControlNets: ReadonlySet<string>;
  readonly #fetch: Fetcher;
  readonly #sleep: Sleeper;
  readonly #createCompositionControl: () => Promise<Blob>;
  #active = false;

  constructor(
    approvedCheckpoints: readonly string[],
    fetcher: Fetcher = fetch,
    sleeper: Sleeper = defaultSleep,
    approvedControlNets: readonly string[] = [],
    createCompositionControl: () => Promise<Blob> = createCompositionControlPng,
  ) {
    this.#approvedCheckpoints = new Set(
      approvedCheckpoints.filter(
        (checkpoint) =>
          checkpoint.length > 0 &&
          checkpoint.length <= 256 &&
          !hasControlCharacter(checkpoint),
      ),
    );
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
      const [stats, models, controlNets] = await Promise.all([
        this.#fetch("/comfy/system_stats", request),
        this.#fetch("/comfy/models/checkpoints", request),
        this.#approvedControlNets.size
          ? this.#fetch("/comfy/models/controlnet", request)
          : Promise.resolve(undefined),
      ]);
      if (!stats.ok || !models.ok || (controlNets && !controlNets.ok))
        throw new Error("Provider health failed.");
      const discovered = (await models.json()) as unknown;
      if (!Array.isArray(discovered))
        return {
          state: "offline",
          approvedCheckpoints: [],
          message: "ComfyUI returned an invalid checkpoint inventory.",
        };
      const approved = discovered.filter(
        (value): value is string =>
          typeof value === "string" && this.#approvedCheckpoints.has(value),
      );
      if (approved.length === 0)
        return {
          state: "misconfigured",
          approvedCheckpoints: [],
          message: "None of the allowlisted checkpoints are installed.",
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
        message: `Local ComfyUI is ready with ${approved.length} approved checkpoint${approved.length === 1 ? "" : "s"}${approvedControlNets.length ? " and composition control" : ""}.`,
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
      const controlNet = this.#approvedControlNets.values().next().value;
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
          prompt: createConceptWorkflow(request, control),
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
      return {
        image: imageBlob,
        provenance: {
          provider: "comfyui",
          templateId: conceptTemplateId,
          checkpoint: request.checkpoint,
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

export const mountPromptWorkspace = (
  host: HTMLElement,
  provider: GenerationProvider,
  options: Readonly<{ automaticBuild?: boolean }> = {},
): void => {
  const prompt = host.querySelector<HTMLTextAreaElement>("#character-prompt");
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
  const variants = host.querySelector<HTMLElement>("#concept-variants");
  const promptPlan = host.querySelector<HTMLElement>("#concept-prompt-plan");
  if (
    !prompt ||
    !checkpoint ||
    !check ||
    !generate ||
    !cancel ||
    !status ||
    !output ||
    !provenance ||
    !accept ||
    !variants ||
    !promptPlan
  )
    return;

  let controller: AbortController | undefined;
  let providerReady = false;
  type CandidateVariant = Readonly<{
    candidate: ConceptCandidate;
    decoded: DecodedImage;
    prompt: string;
    url: string;
  }>;
  const candidates: CandidateVariant[] = [];
  let acceptedCandidate: CandidateVariant | undefined;

  const candidateDetail = async (
    variant: CandidateVariant,
  ): Promise<AcceptedConceptDetail> => ({
    image: await blobAsDataUrl(variant.candidate.image),
    width: variant.decoded.width,
    height: variant.decoded.height,
    prompt: variant.prompt,
    provenance: variant.candidate.provenance,
  });

  const renderPromptPlan = (): void => {
    const plan = createConceptPromptPlan(prompt.value, checkpoint.value);
    const fields: ReadonlyArray<readonly [string, string]> = [
      ["Profile", plan.profile],
      ["Identity", plan.identity || "Enter a character description."],
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
    output.src = variant.url;
    output.hidden = false;
    accept.disabled = false;
    provenance.textContent = `${variant.decoded.width}×${variant.decoded.height} · seed ${variant.candidate.provenance.seed} · SHA-256 ${variant.candidate.provenance.artifactSha256.slice(0, 12)}…`;
    variants
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((button) =>
        button.classList.toggle(
          "selected",
          button.dataset.hash === variant.candidate.provenance.artifactSha256,
        ),
      );
  };

  const renderVariants = (): void => {
    variants.replaceChildren(
      ...candidates.map((variant, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "concept-variant quiet";
        button.dataset.hash = variant.candidate.provenance.artifactSha256;
        button.title = `Candidate ${index + 1}, seed ${variant.candidate.provenance.seed}`;
        const image = document.createElement("img");
        image.src = variant.url;
        image.alt = `Concept candidate ${index + 1}`;
        button.append(image);
        button.addEventListener("click", () => selectCandidate(variant));
        return button;
      }),
    );
    if (acceptedCandidate) selectCandidate(acceptedCandidate);
  };

  const setHealth = async (): Promise<void> => {
    check.disabled = true;
    generate.disabled = true;
    status.textContent = "Checking the local generation provider…";
    try {
      const health = await provider.health();
      providerReady = health.state === "ready";
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
      generate.disabled = !providerReady || !checkpoint.value;
    } finally {
      check.disabled = false;
    }
  };

  check.addEventListener("click", () => void setHealth());
  prompt.addEventListener("input", renderPromptPlan);
  checkpoint.addEventListener("change", () => {
    generate.disabled = !providerReady || !checkpoint.value;
    renderPromptPlan();
  });
  cancel.addEventListener("click", () => controller?.abort());
  accept.addEventListener("click", () => {
    if (!acceptedCandidate) return;
    accept.disabled = true;
    void candidateDetail(acceptedCandidate)
      .then((detail) => {
        host.dispatchEvent(
          new CustomEvent<AcceptedConceptDetail>("avatarconceptaccepted", {
            detail,
          }),
        );
        status.textContent =
          "Design accepted as revision 1. Character-bible review is next.";
        prompt.disabled = true;
        checkpoint.disabled = true;
        check.disabled = true;
        generate.disabled = true;
        variants
          .querySelectorAll<HTMLButtonElement>("button")
          .forEach((button) => (button.disabled = true));
      })
      .catch((error: unknown) => {
        status.textContent =
          error instanceof Error ? error.message : "Could not accept concept.";
        accept.disabled = false;
      });
  });
  generate.addEventListener("click", () => {
    void (async () => {
      controller = new AbortController();
      generate.disabled = true;
      check.disabled = true;
      cancel.disabled = false;
      try {
        const submittedPrompt = prompt.value.trim();
        const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
        const candidate = await provider.generate(
          {
            prompt: submittedPrompt,
            checkpoint: checkpoint.value,
            seed,
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
        const variant = {
          candidate,
          decoded,
          prompt: submittedPrompt,
          url: URL.createObjectURL(candidate.image),
        };
        candidates.push(variant);
        if (candidates.length > 4) {
          const removed = candidates.shift();
          if (removed) URL.revokeObjectURL(removed.url);
        }
        acceptedCandidate = variant;
        renderVariants();
        if (options.automaticBuild) {
          const detail = await candidateDetail(variant);
          host.dataset.pipelineBusy = "true";
          status.textContent =
            "Character generated. Preparing transparent avatar parts…";
          host.dispatchEvent(
            new CustomEvent<AcceptedConceptDetail>("avatarconceptgenerated", {
              detail,
            }),
          );
        } else {
          status.textContent = `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} ready. Compare and accept one design.`;
        }
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
          host.dataset.pipelineBusy === "true";
        check.disabled = false;
        cancel.disabled = true;
      }
    })();
  });

  renderPromptPlan();
  void setHealth();
};
import {
  compositionControlVersion,
  createCompositionControlPng,
} from "./composition-control.js";
