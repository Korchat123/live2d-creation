import { createInpaintWorkflow, type ExportedProject } from "./authoring.js";
import type { AvatarKitPlan, AvatarSetKind } from "./avatar-kit-planner.js";

type Region = readonly [number, number, number, number];

export const catalogSetRegions: Readonly<Record<AvatarSetKind, Region>> = {
  body: [0.28, 0.35, 0.44, 0.42],
  face: [0.34, 0.1, 0.32, 0.3],
  eyes: [0.36, 0.19, 0.28, 0.1],
  mouth: [0.43, 0.28, 0.14, 0.09],
  hair: [0.22, 0.03, 0.56, 0.58],
  outfit: [0.18, 0.35, 0.64, 0.5],
  "animal-ears": [0.3, 0.01, 0.4, 0.18],
  tail: [0.58, 0.48, 0.3, 0.38],
  headwear: [0.22, 0.01, 0.56, 0.22],
  prop: [0.05, 0.32, 0.28, 0.58],
  accessory: [0.28, 0.25, 0.44, 0.34],
};

export const catalogSetLayer: Readonly<Record<AvatarSetKind, string>> = {
  body: "torso",
  face: "face base",
  eyes: "left eye white",
  mouth: "mouth closed lips",
  hair: "front hair",
  outfit: "outfit front",
  "animal-ears": "headwear",
  tail: "accessory",
  headwear: "headwear",
  prop: "held prop",
  accessory: "accessory",
};

export const selectCatalogCheckpoint = (
  checkpoints: readonly string[],
): string =>
  checkpoints.find((checkpoint) => !/z_image_turbo/iu.test(checkpoint)) ?? "";

export const createCatalogSetWorkflow = (
  checkpoint: string,
  sourceName: string,
  maskName: string,
  kind: AvatarSetKind,
  prompt: string,
  seed: number,
) => {
  const instruction =
    kind === "outfit"
      ? "create one complete outfit fitted exactly over the visible opaque base-suit body; include coordinated torso, skirt or trousers, and both sleeves; preserve the visible head, hair, hands, legs, pose, proportions, and attachment anchors"
      : `create only the ${kind} set inside the mask`;
  const workflow = createInpaintWorkflow(
    checkpoint,
    sourceName,
    maskName,
    [
      `same registered anime VTuber, ${instruction}`,
      prompt,
      "match the visible line weight, palette, front direction, anatomy anchors, and neighboring silhouettes",
      "draw clean garment pixels only inside the body-aligned garment mask, do not repaint pixels outside the mask, no complete character, no contact sheet, no text, no rectangle, no frame, no background fill",
    ].join(", "),
    seed,
  ) as Record<
    string,
    Readonly<{ class_type: string; inputs: Readonly<Record<string, unknown>> }>
  >;
  workflow["6"] = {
    class_type: "CLIPTextEncode",
    inputs: {
      text: "opaque rectangle, black box, gray background, background fill, frame, crop, blurry, distorted anatomy, duplicate object, complete character, text, watermark",
      clip: ["1", 1],
    },
  };
  workflow["7"] = {
    ...workflow["7"]!,
    inputs: { ...workflow["7"]!.inputs, denoise: 1 },
  };
  return workflow;
};

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not load avatar-kit artwork."));
    image.src = source;
  });

const upload = async (dataUrl: string, filename: string): Promise<string> => {
  const blob = await (await fetch(dataUrl)).blob();
  const body = new FormData();
  body.append("image", new File([blob], filename, { type: "image/png" }));
  body.append("overwrite", "true");
  const response = await fetch("/comfy/upload/image", { method: "POST", body });
  if (!response.ok)
    throw new Error("ComfyUI could not receive the catalog set.");
  const result = (await response.json()) as {
    name?: unknown;
    subfolder?: unknown;
  };
  if (typeof result.name !== "string")
    throw new Error("ComfyUI returned an invalid catalog upload.");
  return typeof result.subfolder === "string" && result.subfolder
    ? `${result.subfolder}/${result.name}`
    : result.name;
};

const waitForOutput = async (promptId: string): Promise<string> => {
  for (let attempt = 0; attempt < 900; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    const response = await fetch(
      `/comfy/history/${encodeURIComponent(promptId)}`,
    );
    if (!response.ok) continue;
    const history = (await response.json()) as Record<
      string,
      {
        outputs?: Record<
          string,
          {
            images?: Array<{
              filename?: unknown;
              subfolder?: unknown;
              type?: unknown;
            }>;
          }
        >;
      }
    >;
    const image = Object.values(history[promptId]?.outputs ?? {})
      .flatMap((output) => output.images ?? [])
      .find((candidate) => typeof candidate.filename === "string");
    if (!image || typeof image.filename !== "string") continue;
    const query = new URLSearchParams({
      filename: image.filename,
      subfolder: typeof image.subfolder === "string" ? image.subfolder : "",
      type: typeof image.type === "string" ? image.type : "output",
    });
    return `/comfy/view?${query.toString()}`;
  }
  throw new Error("ComfyUI did not finish the catalog set within 15 minutes.");
};

const compositeProject = async (
  project: ExportedProject,
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  canvas.width = 896;
  canvas.height = 1152;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not compose the avatar-kit context.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const order = [
    "back hair",
    "accessory",
    "left leg",
    "right leg",
    "left footwear",
    "right footwear",
    "torso",
    "outfit front",
    "left arm and hand",
    "right arm and hand",
    "neck",
    "face base",
    "left eye white",
    "right eye white",
    "left pupil iris",
    "right pupil iris",
    "left eye highlight",
    "right eye highlight",
    "left upper eyelid",
    "right upper eyelid",
    "left lower eyelid",
    "right lower eyelid",
    "left eyebrow",
    "right eyebrow",
    "mouth closed lips",
    "front hair",
    "headwear",
    "held prop",
  ];
  for (const name of order) {
    const source = project.generatedArtwork[name];
    if (source) context.drawImage(await loadImage(source), 0, 0);
  }
  return canvas;
};

const maskForKind = (kind: AvatarSetKind): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 896;
  canvas.height = 1152;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the catalog-set mask.");
  const [x, y, width, height] = catalogSetRegions[kind];
  context.fillStyle = "#ffffff";
  if (kind === "outfit") {
    const fillPolygon = (points: readonly (readonly [number, number])[]) => {
      context.beginPath();
      context.moveTo(points[0]![0], points[0]![1]);
      points
        .slice(1)
        .forEach(([pointX, pointY]) => context.lineTo(pointX, pointY));
      context.closePath();
      context.fill();
    };
    fillPolygon([
      [290, 410],
      [606, 410],
      [650, 850],
      [246, 850],
    ]);
    fillPolygon([
      [278, 425],
      [365, 452],
      [325, 716],
      [238, 690],
    ]);
    fillPolygon([
      [618, 425],
      [531, 452],
      [571, 716],
      [658, 690],
    ]);
    return canvas;
  }
  context.beginPath();
  context.roundRect(
    x * canvas.width,
    y * canvas.height,
    width * canvas.width,
    height * canvas.height,
    Math.min(width * canvas.width, height * canvas.height) * 0.18,
  );
  context.fill();
  return canvas;
};

export const validateCatalogSetCandidateMetrics = (
  kind: AvatarSetKind,
  coverage: number,
  occupancy: number,
  outsideCoverage: number,
): void => {
  if (outsideCoverage > 0.08)
    throw new Error(
      "ComfyUI repainted the character outside the fitted set mask.",
    );
  if (coverage < 0.002)
    throw new Error("ComfyUI did not draw a visible catalog-set candidate.");
  if (kind === "outfit" && coverage < 0.12)
    throw new Error(
      "ComfyUI did not draw enough fitted garment artwork to replace the neutral suit.",
    );
  if (
    kind !== "outfit" &&
    (coverage > 0.72 || (coverage > 0.35 && occupancy > 0.9))
  )
    throw new Error(
      "ComfyUI produced a background rectangle instead of an isolated catalog set.",
    );
  if (kind === "prop" && occupancy > 0.52)
    throw new Error(
      "ComfyUI changed a broad character region instead of creating an isolated prop.",
    );
};

const extractChangedArtwork = async (
  source: string,
  baseline: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  kind: AvatarSetKind,
): Promise<Readonly<{ artwork: string; mask: string }>> => {
  const canvas = document.createElement("canvas");
  canvas.width = mask.width;
  canvas.height = mask.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not clip the catalog-set candidate.");
  context.drawImage(await loadImage(source), 0, 0, canvas.width, canvas.height);
  const generated = context.getImageData(0, 0, canvas.width, canvas.height);
  const baselineContext = baseline.getContext("2d", {
    willReadFrequently: true,
  });
  const maskContext = mask.getContext("2d", { willReadFrequently: true });
  if (!baselineContext || !maskContext)
    throw new Error("Could not inspect the generated catalog set.");
  const original = baselineContext.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  ).data;
  const allowed = maskContext.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  ).data;
  const extractedMask = document.createElement("canvas");
  extractedMask.width = canvas.width;
  extractedMask.height = canvas.height;
  const extractedContext = extractedMask.getContext("2d");
  if (!extractedContext)
    throw new Error("Could not create the generated catalog mask.");
  const maskPixels = extractedContext.createImageData(
    canvas.width,
    canvas.height,
  );
  let allowedPixels = 0;
  let changedPixels = 0;
  let outsidePixels = 0;
  let outsideChangedPixels = 0;
  let left = canvas.width;
  let top = canvas.height;
  let right = -1;
  let bottom = -1;
  for (let offset = 0; offset < generated.data.length; offset += 4) {
    const difference =
      Math.abs((generated.data[offset] ?? 0) - (original[offset] ?? 0)) +
      Math.abs(
        (generated.data[offset + 1] ?? 0) - (original[offset + 1] ?? 0),
      ) +
      Math.abs((generated.data[offset + 2] ?? 0) - (original[offset + 2] ?? 0));
    if ((allowed[offset + 3] ?? 0) === 0) {
      outsidePixels += 1;
      if (difference >= 48) outsideChangedPixels += 1;
      generated.data[offset + 3] = 0;
      continue;
    }
    allowedPixels += 1;
    if (difference < 48) {
      generated.data[offset + 3] = 0;
      continue;
    }
    const pixel = offset / 4;
    const x = pixel % canvas.width;
    const y = Math.floor(pixel / canvas.width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
    changedPixels += 1;
    maskPixels.data[offset] = 255;
    maskPixels.data[offset + 1] = 255;
    maskPixels.data[offset + 2] = 255;
    maskPixels.data[offset + 3] = 255;
  }
  const coverage = allowedPixels ? changedPixels / allowedPixels : 0;
  const outsideCoverage = outsidePixels
    ? outsideChangedPixels / outsidePixels
    : 0;
  const boundsArea =
    right >= left && bottom >= top
      ? (right - left + 1) * (bottom - top + 1)
      : 0;
  const occupancy = boundsArea ? changedPixels / boundsArea : 0;
  validateCatalogSetCandidateMetrics(
    kind,
    coverage,
    occupancy,
    outsideCoverage,
  );
  context.putImageData(generated, 0, 0);
  extractedContext.putImageData(maskPixels, 0, 0);
  return {
    artwork: canvas.toDataURL("image/png"),
    mask: extractedMask.toDataURL("image/png"),
  };
};

export const generateMissingCatalogSets = async (
  project: ExportedProject,
  plan: AvatarKitPlan,
  checkpoint: string,
): Promise<ExportedProject> => {
  if (!checkpoint)
    throw new Error("Choose an approved ComfyUI checkpoint first.");
  const pending = plan.sets.filter(({ source }) => source === "generate");
  let next = project;
  for (const [index, set] of pending.entries()) {
    const context = await compositeProject(next);
    const mask = maskForKind(set.kind);
    const slug = set.kind.replaceAll(" ", "-");
    const [sourceName, maskName] = await Promise.all([
      upload(
        context.toDataURL("image/png"),
        `open-avatar-kit-${slug}-context.png`,
      ),
      upload(mask.toDataURL("image/png"), `open-avatar-kit-${slug}-mask.png`),
    ]);
    const response = await fetch("/comfy/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: createCatalogSetWorkflow(
          checkpoint,
          sourceName,
          maskName,
          set.kind,
          [
            set.generationPrompt ?? set.requestedFeatures.join(", "),
            ...Object.entries(set.colorOverrides).map(
              ([channel, color]) => `${channel} color ${color}`,
            ),
          ].join(", "),
          (plan.seed + index + 1) >>> 0,
        ),
      }),
    });
    if (!response.ok)
      throw new Error(`ComfyUI rejected the ${set.kind} set job.`);
    const queued = (await response.json()) as { prompt_id?: unknown };
    if (typeof queued.prompt_id !== "string")
      throw new Error("ComfyUI did not return a catalog-set job id.");
    const outputUrl = await waitForOutput(queued.prompt_id);
    const outputBlob = await (await fetch(outputUrl)).blob();
    const outputData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Invalid ComfyUI catalog-set output."));
      reader.onerror = () =>
        reject(new Error("Could not read catalog-set output."));
      reader.readAsDataURL(outputBlob);
    });
    const extracted = await extractChangedArtwork(
      outputData,
      context,
      mask,
      set.kind,
    );
    const layer = catalogSetLayer[set.kind];
    next = {
      ...next,
      updatedAt: Date.now(),
      layers: { ...next.layers, [layer]: extracted.mask },
      generatedArtwork: {
        ...next.generatedArtwork,
        [layer]: extracted.artwork,
      },
      limitations: [
        ...next.limitations.filter(
          (note) => !note.includes(`No reviewed ${set.kind}`),
        ),
        `The generated ${set.kind} candidate is project-local and has not been admitted to the reusable catalog.`,
      ],
    };
  }
  return next;
};
