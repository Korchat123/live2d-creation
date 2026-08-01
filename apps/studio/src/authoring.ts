import { partDefinitions } from "./authoring-project.js";
import type { PartGenerationJob } from "./part-generation.js";

export type CropBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type EyeGuide = {
  readonly outer: Readonly<{ x: number; y: number }>;
  readonly inner: Readonly<{ x: number; y: number }>;
  readonly top: Readonly<{ x: number; y: number }>;
  readonly bottom: Readonly<{ x: number; y: number }>;
};

type ComfyNode = {
  readonly class_type: string;
  readonly inputs: Readonly<Record<string, unknown>>;
};

export const createInpaintWorkflow = (
  checkpoint: string,
  sourceName: string,
  maskName: string,
  prompt: string,
  seed: number,
): Readonly<Record<string, ComfyNode>> => ({
  "1": {
    class_type: "CheckpointLoaderSimple",
    inputs: { ckpt_name: checkpoint },
  },
  "2": { class_type: "LoadImage", inputs: { image: sourceName } },
  "3": {
    class_type: "LoadImageMask",
    inputs: { image: maskName, channel: "alpha" },
  },
  "4": {
    class_type: "VAEEncodeForInpaint",
    inputs: {
      pixels: ["2", 0],
      vae: ["1", 2],
      mask: ["3", 0],
      grow_mask_by: 6,
    },
  },
  "5": {
    class_type: "CLIPTextEncode",
    inputs: { text: prompt, clip: ["1", 1] },
  },
  "6": {
    class_type: "CLIPTextEncode",
    inputs: {
      text: "blurry, distorted face, extra eyes, duplicate pupils, text, watermark",
      clip: ["1", 1],
    },
  },
  "7": {
    class_type: "KSampler",
    inputs: {
      seed,
      steps: 22,
      cfg: 6,
      sampler_name: "euler",
      scheduler: "normal",
      denoise: 0.72,
      model: ["1", 0],
      positive: ["5", 0],
      negative: ["6", 0],
      latent_image: ["4", 0],
    },
  },
  "8": {
    class_type: "VAEDecode",
    inputs: { samples: ["7", 0], vae: ["1", 2] },
  },
  "9": {
    class_type: "SaveImage",
    inputs: { filename_prefix: "open-avatar-repair", images: ["8", 0] },
  },
});

export const createSegmentWorkflow = (
  checkpoint: string,
  sourceName: string,
  prompt: string,
): Readonly<Record<string, ComfyNode>> => ({
  "1": { class_type: "LoadImage", inputs: { image: sourceName } },
  "2": {
    class_type: "CheckpointLoaderSimple",
    inputs: { ckpt_name: checkpoint },
  },
  "3": {
    class_type: "CLIPTextEncode",
    inputs: { text: prompt, clip: ["2", 1] },
  },
  "4": {
    class_type: "SAM3_Detect",
    inputs: {
      threshold: 0.5,
      refine_iterations: 2,
      individual_masks: false,
      model: ["2", 0],
      image: ["1", 0],
      conditioning: ["3", 0],
    },
  },
  "5": { class_type: "MaskToImage", inputs: { mask: ["4", 0] } },
  "6": {
    class_type: "SaveImage",
    inputs: { filename_prefix: "open-avatar-segment", images: ["5", 0] },
  },
});

type Region = [number, number, number, number];

export const eyeRegionsFromGuide = (
  guide: EyeGuide,
  canvasWidth: number,
  canvasHeight: number,
): Readonly<
  Record<"white" | "pupil" | "highlight" | "upperLid" | "lowerLid", Region>
> => {
  const left = Math.min(guide.outer.x, guide.inner.x) / canvasWidth;
  const right = Math.max(guide.outer.x, guide.inner.x) / canvasWidth;
  const top = Math.min(guide.top.y, guide.bottom.y) / canvasHeight;
  const bottom = Math.max(guide.top.y, guide.bottom.y) / canvasHeight;
  const width = Math.max(0.002, right - left);
  const height = Math.max(0.002, bottom - top);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  return {
    white: [left, top, width, height],
    pupil: [
      centerX - width * 0.22,
      centerY - height * 0.42,
      width * 0.44,
      height * 0.84,
    ],
    highlight: [
      centerX - width * 0.08,
      centerY - height * 0.28,
      width * 0.18,
      height * 0.22,
    ],
    upperLid: [left, top - height * 0.12, width, height * 0.38],
    lowerLid: [left, bottom - height * 0.22, width, height * 0.34],
  };
};

export type ExportedProject = {
  readonly version: 1;
  readonly updatedAt: number;
  readonly source: string;
  readonly layers: Readonly<Record<string, string>>;
  readonly generatedArtwork: Readonly<Record<string, string>>;
  /** Full-frame ComfyUI variants, composited through the matching part masks. */
  readonly expressionArtwork: Readonly<Partial<Record<ExpressionName, string>>>;
  readonly missingArtwork: readonly string[];
  readonly limitations: readonly string[];
};

export type ExpressionName =
  | "open mouth"
  | "blink"
  | "left wink"
  | "right wink";

export const expressionLayers: Readonly<
  Record<ExpressionName, readonly string[]>
> = {
  "open mouth": ["mouth closed lips", "mouth interior", "teeth", "tongue"],
  blink: [
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
  ],
  "left wink": [
    "left eye white",
    "left pupil iris",
    "left eye highlight",
    "left upper eyelid",
    "left lower eyelid",
  ],
  "right wink": [
    "right eye white",
    "right pupil iris",
    "right eye highlight",
    "right upper eyelid",
    "right lower eyelid",
  ],
};

/** Back-to-front artwork order used while opening the mouth in Motion Lab. */
export const motionMouthLayerOrder = [
  "mouth interior",
  "tongue",
  "teeth",
  "mouth closed lips",
] as const;

export const requiredMotionLayers = [
  "face base",
  "left eye white",
  "right eye white",
  "left pupil iris",
  "right pupil iris",
  "left upper eyelid",
  "right upper eyelid",
  "left lower eyelid",
  "right lower eyelid",
  "mouth closed lips",
  "mouth interior",
  "torso",
] as const;
const layerNames = partDefinitions.map(({ id }) => id);

export const automaticLayerRegions: Readonly<
  Record<string, readonly [number, number, number, number]>
> = {
  "face base": [0.28, 0.08, 0.44, 0.5],
  "left eye white": [0.39, 0.17, 0.12, 0.06],
  "right eye white": [0.5, 0.17, 0.12, 0.06],
  "left pupil iris": [0.425, 0.172, 0.045, 0.055],
  "right pupil iris": [0.535, 0.172, 0.045, 0.055],
  "left eye highlight": [0.435, 0.178, 0.018, 0.018],
  "right eye highlight": [0.545, 0.178, 0.018, 0.018],
  "left upper eyelid": [0.385, 0.157, 0.13, 0.025],
  "right upper eyelid": [0.495, 0.157, 0.13, 0.025],
  "left lower eyelid": [0.39, 0.22, 0.12, 0.018],
  "right lower eyelid": [0.5, 0.22, 0.12, 0.018],
  "left eyebrow": [0.385, 0.125, 0.12, 0.025],
  "right eyebrow": [0.5, 0.125, 0.12, 0.025],
  "mouth closed lips": [0.44, 0.27, 0.12, 0.028],
  "mouth interior": [0.445, 0.275, 0.11, 0.055],
  teeth: [0.455, 0.278, 0.09, 0.02],
  tongue: [0.46, 0.305, 0.08, 0.02],
  neck: [0.43, 0.4, 0.14, 0.15],
  torso: [0.25, 0.48, 0.5, 0.4],
  "front hair": [0.2, 0.04, 0.6, 0.25],
  "left side hair": [0.2, 0.16, 0.25, 0.42],
  "right side hair": [0.55, 0.16, 0.25, 0.42],
  "back hair": [0.15, 0.04, 0.7, 0.52],
  "coat tails": [0.18, 0.42, 0.64, 0.48],
  "left sleeve": [0.14, 0.34, 0.27, 0.38],
  "right sleeve": [0.59, 0.34, 0.27, 0.38],
  corset: [0.39, 0.4, 0.22, 0.24],
  "skirt layers": [0.28, 0.5, 0.44, 0.33],
  "left leg": [0.34, 0.62, 0.17, 0.3],
  "right leg": [0.49, 0.62, 0.17, 0.3],
  "left footwear": [0.33, 0.85, 0.18, 0.13],
  "right footwear": [0.49, 0.85, 0.18, 0.13],
  headwear: [0.17, 0.01, 0.66, 0.24],
  "held prop": [0.08, 0.3, 0.28, 0.65],
  accessory: [0.7, 0.12, 0.1, 0.13],
  "left arm and hand": [0.15, 0.45, 0.18, 0.4],
  "right arm and hand": [0.67, 0.45, 0.18, 0.4],
  "outfit front": [0.25, 0.48, 0.5, 0.4],
};

const canonicalLayerName = (name: string): string => {
  if (name === "left hand arm") return "left arm and hand";
  if (name === "right hand arm") return "right arm and hand";
  return name;
};

export const automaticallySuggestedLayers = [
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
] as const;

export const cropBoundsFromAlpha = (
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
): CropBounds | undefined => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      if ((alpha[(y * width + x) * 4 + 3] ?? 0) === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  if (right < left || bottom < top) return undefined;
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
};

export const isProjectReady = (
  layers: Readonly<Record<string, string>>,
): boolean => findMissingRequiredMotionLayers(layers).length === 0;

export const findMissingRequiredMotionLayers = (
  layers: Readonly<Record<string, string>>,
): readonly string[] => requiredMotionLayers.filter((layer) => !layers[layer]);

export const findMissingArtwork = (
  layers: Readonly<Record<string, string>>,
): readonly string[] => layerNames.filter((layer) => !layers[layer]);

const asDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read this image."));
    };
    reader.readAsDataURL(file);
  });

const download = (name: string, contents: string): void => {
  const link = document.createElement("a");
  link.download = name;
  link.href = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  link.click();
  URL.revokeObjectURL(link.href);
};

export type LayerLabController = Readonly<{
  loadSource(source: string): Promise<void>;
  buildAutomatically(
    jobs?: readonly PartGenerationJob[],
  ): Promise<ExportedProject>;
  loadProject(project: ExportedProject): Promise<void>;
}>;

export const mountLayerLab = (
  host: HTMLElement,
  exampleSource: string,
): LayerLabController => {
  const input = host.querySelector<HTMLInputElement>("#source-image");
  const canvas = host.querySelector<HTMLCanvasElement>("#layer-canvas");
  const size = host.querySelector<HTMLInputElement>("#brush-size");
  const layerName = host.querySelector<HTMLElement>("#active-layer");
  const layersOutput = host.querySelector<HTMLElement>("#layer-output");
  const partCanvas = host.querySelector<HTMLCanvasElement>("#part-canvas");
  const partEditorName = host.querySelector<HTMLElement>("#part-editor-name");
  const clear = host.querySelector<HTMLButtonElement>("#clear-selection");
  const undo = host.querySelector<HTMLButtonElement>("#undo-selection");
  const redo = host.querySelector<HTMLButtonElement>("#redo-selection");
  const add = host.querySelector<HTMLButtonElement>("#brush-add");
  const erase = host.querySelector<HTMLButtonElement>("#brush-erase");
  const value = host.querySelector<HTMLOutputElement>("#brush-value");
  const suggest = host.querySelector<HTMLButtonElement>("#suggest-layers");
  const suggestAll = host.querySelector<HTMLButtonElement>(
    "#suggest-all-layers",
  );
  const compare = host.querySelector<HTMLButtonElement>("#show-source");
  const guideLeft = host.querySelector<HTMLButtonElement>("#guide-left-eye");
  const guideRight = host.querySelector<HTMLButtonElement>("#guide-right-eye");
  const createGuidedEyes = host.querySelector<HTMLButtonElement>(
    "#create-guided-eyes",
  );
  const clearGuides =
    host.querySelector<HTMLButtonElement>("#clear-eye-guides");
  const guideStatus = host.querySelector<HTMLElement>("#eye-guide-status");
  const repair = host.querySelector<HTMLButtonElement>("#generate-repair");
  const repairPrompt =
    host.querySelector<HTMLTextAreaElement>("#repair-prompt");
  const repairStatus = host.querySelector<HTMLElement>("#repair-status");
  const repairOutput = host.querySelector<HTMLImageElement>("#repair-output");
  const applyRepair = host.querySelector<HTMLButtonElement>("#apply-repair");
  const completeAll = host.querySelector<HTMLButtonElement>("#complete-all");
  const makeMotionReady =
    host.querySelector<HTMLButtonElement>("#make-motion-ready");
  const expressionStatus =
    host.querySelector<HTMLElement>("#expression-status");
  const expressionButtons = new Map<ExpressionName, HTMLButtonElement>([
    [
      "open mouth",
      host.querySelector<HTMLButtonElement>("#expression-open-mouth")!,
    ],
    ["blink", host.querySelector<HTMLButtonElement>("#expression-blink")!],
    [
      "left wink",
      host.querySelector<HTMLButtonElement>("#expression-left-wink")!,
    ],
    [
      "right wink",
      host.querySelector<HTMLButtonElement>("#expression-right-wink")!,
    ],
  ]);
  const artColor = host.querySelector<HTMLInputElement>("#art-color");
  const paintArt = host.querySelector<HTMLButtonElement>("#paint-art");
  const paintMask = host.querySelector<HTMLButtonElement>("#paint-mask");
  const fillArt = host.querySelector<HTMLButtonElement>("#fill-art");
  const clearArt = host.querySelector<HTMLButtonElement>("#clear-art");
  const validate = host.querySelector<HTMLButtonElement>("#validate-project");
  const exportProject =
    host.querySelector<HTMLButtonElement>("#export-project");
  const openMotion = host.querySelector<HTMLButtonElement>("#open-motion");
  const status = host.querySelector<HTMLElement>("#builder-status");
  if (
    !input ||
    !canvas ||
    !size ||
    !layerName ||
    !layersOutput ||
    !partCanvas ||
    !partEditorName ||
    !clear ||
    !undo ||
    !redo ||
    !add ||
    !erase ||
    !value ||
    !suggest ||
    !suggestAll ||
    !compare ||
    !guideLeft ||
    !guideRight ||
    !createGuidedEyes ||
    !clearGuides ||
    !guideStatus ||
    !repair ||
    !repairPrompt ||
    !repairStatus ||
    !repairOutput ||
    !applyRepair ||
    !completeAll ||
    !makeMotionReady ||
    !expressionStatus ||
    [...expressionButtons.values()].some((button) => !button) ||
    !artColor ||
    !paintArt ||
    !paintMask ||
    !fillArt ||
    !clearArt ||
    !validate ||
    !exportProject ||
    !openMotion ||
    !status
  )
    throw new Error("Missing layer-lab controls.");

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not initialize the layer canvas.");
  const masks = new Map<string, HTMLCanvasElement>();
  const artworkCanvases = new Map<string, HTMLCanvasElement>();
  const generatedArtwork = new Map<string, string>();
  const expressionArtwork = new Map<ExpressionName, string>();
  const history = new Map<string, string[]>();
  const future = new Map<string, string[]>();
  let image: HTMLImageElement | undefined;
  let source = exampleSource;
  let loadGeneration = 0;
  let selectedLayer = "face base";
  let drawing = false;
  let mode: "add" | "erase" = "add";
  let editing: "mask" | "art" = "mask";
  let showingSource = false;
  let zoom = 1;
  const eyeGuides = new Map<"left" | "right", EyeGuide>();
  let guidingEye: "left" | "right" | undefined;
  let guidePoints: Array<{ x: number; y: number }> = [];

  const announce = (message: string) => {
    status.textContent = message;
    document.querySelector<HTMLElement>("#announce")!.textContent = message;
  };
  const getMask = (name = selectedLayer): HTMLCanvasElement => {
    let mask = masks.get(name);
    if (!mask) {
      mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      masks.set(name, mask);
    }
    return mask;
  };
  const getArtwork = (name = selectedLayer): HTMLCanvasElement => {
    let artwork = artworkCanvases.get(name);
    if (!artwork) {
      artwork = document.createElement("canvas");
      artwork.width = canvas.width;
      artwork.height = canvas.height;
      const artworkContext = artwork.getContext("2d");
      if (artworkContext && image) {
        artworkContext.drawImage(image, 0, 0);
        artworkContext.globalCompositeOperation = "destination-in";
        artworkContext.drawImage(getMask(name), 0, 0);
        artworkContext.globalCompositeOperation = "source-over";
      }
      artworkCanvases.set(name, artwork);
    }
    return artwork;
  };
  const selectedBounds = (): CropBounds | undefined => {
    const mask = masks.get(selectedLayer);
    const maskContext = mask?.getContext("2d");
    if (!mask || !maskContext) return undefined;
    return cropBoundsFromAlpha(
      maskContext.getImageData(0, 0, mask.width, mask.height).data,
      mask.width,
      mask.height,
    );
  };
  const renderPartEditor = () => {
    if (!image) return;
    partEditorName.textContent = `Editing: ${selectedLayer}`;
    const bounds = selectedBounds();
    const editor = partCanvas.getContext("2d");
    if (!bounds || !editor) return;
    partCanvas.width = bounds.width;
    partCanvas.height = bounds.height;
    editor.drawImage(
      artworkCanvases.get(selectedLayer) ?? image,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
    const overlay = document.createElement("canvas");
    overlay.width = bounds.width;
    overlay.height = bounds.height;
    const overlayContext = overlay.getContext("2d");
    if (!overlayContext) return;
    overlayContext.fillStyle = "#ff315f";
    overlayContext.fillRect(0, 0, bounds.width, bounds.height);
    overlayContext.globalCompositeOperation = "destination-in";
    overlayContext.drawImage(
      getMask(),
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
    editor.globalAlpha = 0.38;
    editor.drawImage(overlay, 0, 0);
    editor.globalAlpha = 1;
  };
  const draw = () => {
    if (!image) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (showingSource) return;
    const maskOverlay = document.createElement("canvas");
    maskOverlay.width = canvas.width;
    maskOverlay.height = canvas.height;
    const maskOverlayContext = maskOverlay.getContext("2d");
    if (maskOverlayContext) {
      maskOverlayContext.fillStyle = "#ff315f";
      maskOverlayContext.fillRect(0, 0, canvas.width, canvas.height);
      maskOverlayContext.globalCompositeOperation = "destination-in";
      maskOverlayContext.drawImage(getMask(), 0, 0);
      context.save();
      context.globalAlpha = 0.38;
      context.drawImage(maskOverlay, 0, 0);
      context.restore();
    }
    const artwork = artworkCanvases.get(selectedLayer);
    if (artwork) context.drawImage(artwork, 0, 0);
    const drawGuide = (guide: EyeGuide, color: string) => {
      context.save();
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = Math.max(2, canvas.width * 0.002);
      context.beginPath();
      context.moveTo(guide.outer.x, guide.outer.y);
      context.quadraticCurveTo(
        guide.top.x,
        guide.top.y,
        guide.inner.x,
        guide.inner.y,
      );
      context.quadraticCurveTo(
        guide.bottom.x,
        guide.bottom.y,
        guide.outer.x,
        guide.outer.y,
      );
      context.stroke();
      [guide.outer, guide.inner, guide.top, guide.bottom].forEach((point) => {
        context.beginPath();
        context.arc(
          point.x,
          point.y,
          Math.max(3, canvas.width * 0.005),
          0,
          Math.PI * 2,
        );
        context.fill();
      });
      context.restore();
    };
    eyeGuides.forEach((guide, side) =>
      drawGuide(guide, side === "left" ? "#72e6c1" : "#ffd479"),
    );
    if (guidingEye && guidePoints.length) {
      context.save();
      context.fillStyle = "#ffffff";
      guidePoints.forEach((guidePoint) => {
        context.beginPath();
        context.arc(
          guidePoint.x,
          guidePoint.y,
          Math.max(3, canvas.width * 0.005),
          0,
          Math.PI * 2,
        );
        context.fill();
      });
      context.restore();
    }
    renderPartEditor();
  };
  const saveSnapshot = () => {
    const snapshots = history.get(selectedLayer) ?? [];
    snapshots.push(getMask().toDataURL());
    if (snapshots.length > 20) snapshots.shift();
    history.set(selectedLayer, snapshots);
    future.set(selectedLayer, []);
    undo.disabled = false;
    redo.disabled = true;
  };
  const restore = (snapshot: string) => {
    const restored = new Image();
    restored.onload = () => {
      const mask = getMask();
      const maskContext = mask.getContext("2d");
      if (!maskContext) return;
      maskContext.clearRect(0, 0, mask.width, mask.height);
      maskContext.drawImage(restored, 0, 0);
      renderLayers();
      draw();
    };
    restored.src = snapshot;
  };
  const point = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };
  const brush = (event: PointerEvent) => {
    const target = editing === "art" ? getArtwork() : getMask();
    const targetContext = target.getContext("2d");
    if (!targetContext || !image) return;
    const { x, y } = point(event);
    const erasing =
      mode === "erase" || event.button === 2 || (event.buttons & 2) === 2;
    targetContext.globalCompositeOperation = erasing
      ? "destination-out"
      : "source-over";
    targetContext.fillStyle = editing === "art" ? artColor.value : "#ffffff";
    targetContext.beginPath();
    targetContext.arc(x, y, Number(size.value), 0, Math.PI * 2);
    targetContext.fill();
    targetContext.globalCompositeOperation = "source-over";
    if (editing === "art") {
      targetContext.globalCompositeOperation = "destination-in";
      targetContext.drawImage(getMask(), 0, 0);
      targetContext.globalCompositeOperation = "source-over";
      generatedArtwork.set(selectedLayer, target.toDataURL("image/png"));
    }
    draw();
  };
  const renderLayers = () => {
    layersOutput.replaceChildren();
    layerNames.forEach((name) => {
      const item = document.createElement("div");
      const bounds =
        masks.has(name) &&
        cropBoundsFromAlpha(
          getMask(name)
            .getContext("2d")!
            .getImageData(0, 0, canvas.width, canvas.height).data,
          canvas.width,
          canvas.height,
        );
      item.className = "layer-row";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Edit ${name}`);
      item.innerHTML = `<span>${name}</span><strong>${bounds ? "masked" : "empty"}</strong>`;
      const selectPart = () => {
        selectedLayer = name;
        layerName.textContent = name;
        host
          .querySelectorAll("[data-layer]")
          .forEach((button) =>
            button.classList.toggle(
              "selected",
              (button as HTMLElement).dataset.layer === name,
            ),
          );
        draw();
      };
      item.addEventListener("click", selectPart);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectPart();
        }
      });
      if (bounds && image) {
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = bounds.width;
        previewCanvas.height = bounds.height;
        const previewContext = previewCanvas.getContext("2d");
        if (previewContext) {
          const paintedArtwork = artworkCanvases.get(name);
          previewContext.drawImage(
            paintedArtwork ?? image,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            0,
            0,
            bounds.width,
            bounds.height,
          );
          previewContext.globalCompositeOperation = "destination-in";
          previewContext.drawImage(
            getMask(name),
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            0,
            0,
            bounds.width,
            bounds.height,
          );
          const preview = new Image();
          preview.src = previewCanvas.toDataURL("image/png");
          preview.alt = `${name} result`;
          preview.className = "layer-preview";
          item.prepend(preview);
        }
      }
      layersOutput.append(item);
    });
    saveDraft();
  };
  const load = (nextSource: string, draft?: ExportedProject): Promise<void> =>
    new Promise((resolve, reject) => {
      const generation = ++loadGeneration;
      const next = new Image();
      next.onerror = () =>
        reject(new Error("Could not load the avatar image."));
      next.onload = async () => {
        try {
          if (generation !== loadGeneration) {
            resolve();
            return;
          }
          image = next;
          source = nextSource;
          canvas.width = next.naturalWidth;
          canvas.height = next.naturalHeight;
          masks.clear();
          artworkCanvases.clear();
          generatedArtwork.clear();
          expressionArtwork.clear();
          history.clear();
          future.clear();
          if (draft) {
            await Promise.all(
              Object.entries(draft.layers).map(
                ([legacyName, maskSource]) =>
                  new Promise<void>((resolve) => {
                    const name = canonicalLayerName(legacyName);
                    const restored = new Image();
                    restored.onload = () => {
                      getMask(name).getContext("2d")?.drawImage(restored, 0, 0);
                      resolve();
                    };
                    restored.onerror = () => resolve();
                    restored.src = maskSource;
                  }),
              ),
            );
            await Promise.all(
              Object.entries(draft.generatedArtwork).map(
                ([legacyName, artwork]) =>
                  new Promise<void>((resolve) => {
                    const name = canonicalLayerName(legacyName);
                    generatedArtwork.set(name, artwork);
                    const restored = new Image();
                    restored.onload = () => {
                      const target = getArtwork(name);
                      const targetContext = target.getContext("2d");
                      targetContext?.clearRect(
                        0,
                        0,
                        target.width,
                        target.height,
                      );
                      targetContext?.drawImage(
                        restored,
                        0,
                        0,
                        target.width,
                        target.height,
                      );
                      resolve();
                    };
                    restored.onerror = () => resolve();
                    restored.src = artwork;
                  }),
              ),
            );
            Object.entries(draft.expressionArtwork).forEach(
              ([name, artwork]) => {
                if (name in expressionLayers)
                  expressionArtwork.set(name as ExpressionName, artwork);
              },
            );
          }
          eyeGuides.clear();
          guidingEye = undefined;
          guidePoints = [];
          detectEyeSuggestions();
          undo.disabled = true;
          redo.disabled = true;
          openMotion.disabled = true;
          exportProject.disabled = true;
          renderLayers();
          draw();
          announce(
            draft
              ? "Restored your saved local draft."
              : "Portrait loaded locally. Select a layer and paint its mask.",
          );
          resolve();
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error("Could not restore the avatar layers."),
          );
        }
      };
      next.src = nextSource;
    });
  const suggestedRegions: Record<string, [number, number, number, number]> =
    Object.fromEntries(
      Object.entries(automaticLayerRegions).map(([name, region]) => [
        name,
        [...region],
      ]),
    );
  const applyEyeGuide = (side: "left" | "right", guide: EyeGuide) => {
    const regions = eyeRegionsFromGuide(guide, canvas.width, canvas.height);
    suggestedRegions[`${side} eye white`] = regions.white;
    suggestedRegions[`${side} pupil iris`] = regions.pupil;
    suggestedRegions[`${side} eye highlight`] = regions.highlight;
    suggestedRegions[`${side} upper eyelid`] = regions.upperLid;
    suggestedRegions[`${side} lower eyelid`] = regions.lowerLid;
  };
  const detectEyeSuggestions = () => {
    if (!image) return;
    const analysis = document.createElement("canvas");
    analysis.width = canvas.width;
    analysis.height = canvas.height;
    const context = analysis.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let skinX = 0;
    let skinY = 0;
    let skinCount = 0;
    for (
      let y = Math.floor(canvas.height * 0.08);
      y < canvas.height * 0.28;
      y += 3
    )
      for (
        let x = Math.floor(canvas.width * 0.3);
        x < canvas.width * 0.7;
        x += 3
      ) {
        const offset = (y * canvas.width + x) * 4;
        const red = data[offset] ?? 0;
        const green = data[offset + 1] ?? 0;
        const blue = data[offset + 2] ?? 0;
        const skinTone =
          red > 165 &&
          green > 95 &&
          blue > 65 &&
          red > blue * 1.18 &&
          green > blue * 1.08 &&
          red - green < 110;
        if (skinTone) {
          skinX += x;
          skinY += y;
          skinCount += 1;
        }
      }
    if (skinCount > 20) {
      const centerX = skinX / skinCount / canvas.width;
      const centerY = skinY / skinCount / canvas.height;
      suggestedRegions["face base"] = [
        centerX - 0.105,
        centerY - 0.085,
        0.21,
        0.17,
      ];
    }
    const find = (start: number, end: number) => {
      let xSum = 0;
      let ySum = 0;
      let count = 0;
      for (
        let y = Math.floor(canvas.height * 0.1);
        y < canvas.height * 0.3;
        y += 2
      )
        for (let x = start; x < end; x += 2) {
          const offset = (y * canvas.width + x) * 4;
          const red = data[offset] ?? 0;
          const green = data[offset + 1] ?? 0;
          const blue = data[offset + 2] ?? 0;
          const amberIris =
            red > 135 &&
            green > 75 &&
            green < red &&
            blue < green * 0.7 &&
            red - blue > 100;
          if (amberIris) {
            xSum += x;
            ySum += y;
            count += 1;
          }
        }
      return count > 8
        ? { x: xSum / count / canvas.width, y: ySum / count / canvas.height }
        : undefined;
    };
    const apply = (side: "left" | "right", found: { x: number; y: number }) => {
      suggestedRegions[`${side} eye white`] = [
        found.x - 0.03,
        found.y - 0.014,
        0.06,
        0.028,
      ];
      suggestedRegions[`${side} pupil iris`] = [
        found.x - 0.013,
        found.y - 0.018,
        0.026,
        0.036,
      ];
      suggestedRegions[`${side} eye highlight`] = [
        found.x - 0.007,
        found.y - 0.012,
        0.012,
        0.012,
      ];
      suggestedRegions[`${side} upper eyelid`] = [
        found.x - 0.03,
        found.y - 0.022,
        0.06,
        0.012,
      ];
      suggestedRegions[`${side} lower eyelid`] = [
        found.x - 0.03,
        found.y + 0.01,
        0.06,
        0.01,
      ];
    };
    const left = find(0, Math.floor(canvas.width / 2));
    const right = find(Math.floor(canvas.width / 2), canvas.width);
    if (left) apply("left", left);
    if (right) apply("right", right);
  };
  const paintSuggestion = (name: string) => {
    const region = suggestedRegions[name];
    const maskContext = getMask(name).getContext("2d");
    if (!region || !maskContext) return;
    const [x, y, width, height] = region;
    maskContext.fillStyle = "#ffffff";
    const source = document.createElement("canvas");
    source.width = canvas.width;
    source.height = canvas.height;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    if (!sourceContext || !image) return;
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data;
    const left = Math.max(0, Math.floor(x * canvas.width));
    const top = Math.max(0, Math.floor(y * canvas.height));
    const right = Math.min(canvas.width, Math.ceil((x + width) * canvas.width));
    const bottom = Math.min(
      canvas.height,
      Math.ceil((y + height) * canvas.height),
    );
    const paintPixels = (
      matches: (
        red: number,
        green: number,
        blue: number,
        pixelX: number,
        pixelY: number,
      ) => boolean,
    ) => {
      for (let pixelY = top; pixelY < bottom; pixelY += 1)
        for (let pixelX = left; pixelX < right; pixelX += 1) {
          const offset = (pixelY * canvas.width + pixelX) * 4;
          const red = pixels[offset] ?? 0;
          const green = pixels[offset + 1] ?? 0;
          const blue = pixels[offset + 2] ?? 0;
          if (matches(red, green, blue, pixelX, pixelY))
            maskContext.fillRect(pixelX, pixelY, 1, 1);
        }
    };
    if (name.includes("eye white")) {
      const pupil = suggestedRegions[name.replace("eye white", "pupil iris")];
      if (!pupil) return;
      const [pupilX, pupilY, pupilWidth, pupilHeight] = pupil;
      const centerX = (x + width / 2) * canvas.width;
      const centerY = (y + height / 2) * canvas.height;
      const leftEdge = x * canvas.width;
      const rightEdge = (x + width) * canvas.width;
      const topEdge = y * canvas.height;
      const bottomEdge = (y + height) * canvas.height;
      maskContext.beginPath();
      maskContext.moveTo(leftEdge, centerY);
      maskContext.quadraticCurveTo(centerX, topEdge, rightEdge, centerY);
      maskContext.quadraticCurveTo(centerX, bottomEdge, leftEdge, centerY);
      maskContext.closePath();
      maskContext.fill();
      const faceMask = masks.get("face base");
      const faceContext = faceMask?.getContext("2d");
      if (faceMask && faceContext) {
        faceContext.save();
        faceContext.globalCompositeOperation = "destination-out";
        // The face must have one complete eye opening. Subtract it before the
        // white layer removes its pupil hole, otherwise face pixels remain
        // behind the moving iris.
        faceContext.drawImage(getMask(name), 0, 0);
        faceContext.restore();
      }
      maskContext.save();
      maskContext.globalCompositeOperation = "destination-out";
      maskContext.beginPath();
      maskContext.ellipse(
        (pupilX + pupilWidth / 2) * canvas.width,
        (pupilY + pupilHeight / 2) * canvas.height,
        (pupilWidth / 2) * canvas.width,
        (pupilHeight / 2) * canvas.height,
        0,
        0,
        Math.PI * 2,
      );
      maskContext.fill();
      maskContext.restore();
      return;
    }
    if (name.includes("pupil iris")) {
      paintPixels(
        (red, green, blue) =>
          (red > 125 && green > 70 && blue < 125 && red - blue > 90) ||
          Math.max(red, green, blue) < 120,
      );
      return;
    }
    if (name.includes("highlight")) {
      paintPixels(
        (red, green, blue) =>
          red > 205 &&
          green > 190 &&
          blue > 170 &&
          Math.max(red, green, blue) - Math.min(red, green, blue) < 75,
      );
      return;
    }
    if (name.includes("eyelid")) {
      const upper = name.includes("upper");
      const centerX = (x + width / 2) * canvas.width;
      const centerY = (y + height / 2) * canvas.height;
      const radiusX = (width / 2) * canvas.width;
      paintPixels((red, green, blue, pixelX, pixelY) => {
        const curveY =
          centerY +
          (upper ? -1 : 1) *
            ((pixelX - centerX) / radiusX) ** 2 *
            canvas.height *
            0.012;
        return (
          Math.max(red, green, blue) < 120 &&
          Math.max(red, green, blue) - Math.min(red, green, blue) < 65 &&
          (upper ? pixelY <= curveY : pixelY >= curveY)
        );
      });
      return;
    }
    const curvedPart =
      name === "face base" ||
      name.includes("eye white") ||
      name.includes("pupil iris") ||
      name.includes("highlight") ||
      name === "mouth interior";
    if (curvedPart) {
      maskContext.beginPath();
      maskContext.ellipse(
        (x + width / 2) * canvas.width,
        (y + height / 2) * canvas.height,
        (width / 2) * canvas.width,
        (height / 2) * canvas.height,
        0,
        0,
        Math.PI * 2,
      );
      maskContext.fill();
    } else {
      maskContext.fillRect(
        x * canvas.width,
        y * canvas.height,
        width * canvas.width,
        height * canvas.height,
      );
    }
  };
  const maskBounds = (name: string): CropBounds | undefined => {
    const mask = masks.get(name);
    const maskContext = mask?.getContext("2d");
    if (!mask || !maskContext) return undefined;
    return cropBoundsFromAlpha(
      maskContext.getImageData(0, 0, mask.width, mask.height).data,
      mask.width,
      mask.height,
    );
  };
  const paintBoundedFallback = (name: string): boolean => {
    const region = suggestedRegions[name];
    const maskContext = getMask(name).getContext("2d");
    if (!region || !maskContext) return false;
    const [x, y, width, height] = region;
    const left = Math.max(0, x * canvas.width);
    const top = Math.max(0, y * canvas.height);
    const regionWidth = Math.max(
      1,
      Math.min(canvas.width - left, width * canvas.width),
    );
    const regionHeight = Math.max(
      1,
      Math.min(canvas.height - top, height * canvas.height),
    );
    maskContext.save();
    maskContext.fillStyle = "#ffffff";
    maskContext.beginPath();
    if (
      name === "face base" ||
      name.includes("eye white") ||
      name.includes("pupil iris") ||
      name.includes("highlight") ||
      name === "mouth interior"
    )
      maskContext.ellipse(
        left + regionWidth / 2,
        top + regionHeight / 2,
        regionWidth / 2,
        regionHeight / 2,
        0,
        0,
        Math.PI * 2,
      );
    else
      maskContext.roundRect(
        left,
        top,
        regionWidth,
        regionHeight,
        Math.min(regionWidth, regionHeight) * 0.35,
      );
    maskContext.fill();
    maskContext.restore();
    return Boolean(maskBounds(name));
  };
  const clearMask = (name: string) => {
    const mask = getMask(name);
    mask.getContext("2d")?.clearRect(0, 0, mask.width, mask.height);
  };
  const createEyeLayersFromGuides = () => {
    if (!eyeGuides.has("left") || !eyeGuides.has("right")) {
      announce(
        "Set both eye guides first: outer corner, inner corner, top lid, then lower lid.",
      );
      return;
    }
    const eyeLayers = [
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
    ];
    eyeLayers.forEach(clearMask);
    paintSuggestion("face base");
    eyeLayers.forEach(paintSuggestion);
    renderLayers();
    draw();
    announce(
      "Created eye layers from your portrait guides. Inspect each thumbnail, then use the brush for any final edge correction.",
    );
  };
  const buildProject = (
    expectedLayers: readonly string[] = layerNames,
  ): ExportedProject => {
    const exported: Record<string, string> = {};
    masks.forEach((mask, name) => {
      const bounds = cropBoundsFromAlpha(
        mask.getContext("2d")!.getImageData(0, 0, mask.width, mask.height).data,
        mask.width,
        mask.height,
      );
      if (bounds) exported[name] = mask.toDataURL("image/png");
    });
    const everyVisibleLayerGenerated = Object.keys(exported).every((name) =>
      generatedArtwork.has(name),
    );
    const projectSource = everyVisibleLayerGenerated
      ? (() => {
          const transparent = document.createElement("canvas");
          transparent.width = canvas.width;
          transparent.height = canvas.height;
          return transparent.toDataURL("image/png");
        })()
      : source;
    return {
      version: 1,
      updatedAt: Date.now(),
      source: projectSource,
      layers: exported,
      generatedArtwork: Object.fromEntries(generatedArtwork),
      expressionArtwork: Object.fromEntries(expressionArtwork) as Partial<
        Record<ExpressionName, string>
      >,
      missingArtwork: expectedLayers.filter((name) => !exported[name]),
      limitations: everyVisibleLayerGenerated
        ? [
            "Automatic segmentation and generated hidden artwork still require visual review at motion extremes.",
            "Large head turns and complex hand motion remain outside the conservative automatic rig.",
          ]
        : [
            "A flat portrait cannot create hidden pixels for large head turns or hands.",
            "Starter masks are crops, not newly created hidden artwork. Generate or repair every visible layer before production rigging.",
          ],
    };
  };
  const saveDraft = (): void => {
    if (!image) return;
    try {
      sessionStorage.setItem(
        "open-avatar-project",
        JSON.stringify(buildProject()),
      );
    } catch {
      // A very large local upload may exceed browser session storage. The
      // validated export remains available even when transient autosave cannot.
    }
  };
  const uploadToComfy = async (data: string, name: string): Promise<string> => {
    const blob = await (await fetch(data)).blob();
    const body = new FormData();
    body.append("image", new File([blob], name, { type: "image/png" }));
    body.append("overwrite", "true");
    const response = await fetch("/comfy/upload/image", {
      method: "POST",
      body,
    });
    if (!response.ok) throw new Error("ComfyUI could not receive the image.");
    const uploaded = (await response.json()) as {
      name?: unknown;
      subfolder?: unknown;
    };
    if (typeof uploaded.name !== "string")
      throw new Error("ComfyUI returned an invalid upload.");
    return typeof uploaded.subfolder === "string" && uploaded.subfolder
      ? `${uploaded.subfolder}/${uploaded.name}`
      : uploaded.name;
  };
  const loadImage = (imageSource: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const result = new Image();
      result.onload = () => resolve(result);
      result.onerror = () =>
        reject(new Error("Could not load the ComfyUI result."));
      result.src = imageSource;
    });
  const toDataUrl = async (url: string): Promise<string> => {
    const blob = await (await fetch(url)).blob();
    return asDataUrl(
      new File([blob], "generated-art.png", { type: "image/png" }),
    );
  };
  const transparentPartArtwork = async (
    artworkSource: string,
    name: string,
  ): Promise<string> => {
    const generated = await loadImage(artworkSource);
    const target = document.createElement("canvas");
    target.width = canvas.width;
    target.height = canvas.height;
    const targetContext = target.getContext("2d");
    if (!targetContext)
      throw new Error("Could not create transparent part artwork.");
    targetContext.drawImage(generated, 0, 0, target.width, target.height);
    targetContext.globalCompositeOperation = "destination-in";
    targetContext.drawImage(getMask(name), 0, 0, target.width, target.height);
    targetContext.globalCompositeOperation = "source-over";
    artworkCanvases.set(name, target);
    return target.toDataURL("image/png");
  };
  const waitForComfyOutput = async (promptId: string): Promise<string> => {
    for (let attempt = 0; attempt < 90; attempt += 1) {
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
      const images = Object.values(history[promptId]?.outputs ?? {}).flatMap(
        (output) => output.images ?? [],
      );
      const image = images[0];
      if (!image || typeof image.filename !== "string") continue;
      const query = new URLSearchParams({
        filename: image.filename,
        subfolder: typeof image.subfolder === "string" ? image.subfolder : "",
        type: typeof image.type === "string" ? image.type : "output",
      });
      return `/comfy/view?${query.toString()}`;
    }
    throw new Error("ComfyUI did not finish within 90 seconds.");
  };
  const segmentMaskCanvas = async (
    maskUrl: string,
  ): Promise<HTMLCanvasElement> => {
    const result = await loadImage(maskUrl);
    const temporary = document.createElement("canvas");
    temporary.width = canvas.width;
    temporary.height = canvas.height;
    const temporaryContext = temporary.getContext("2d", {
      willReadFrequently: true,
    });
    if (!temporaryContext) throw new Error("Could not read the SAM3 mask.");
    temporaryContext.drawImage(result, 0, 0, temporary.width, temporary.height);
    const pixels = temporaryContext.getImageData(
      0,
      0,
      temporary.width,
      temporary.height,
    );
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const luminance =
        ((pixels.data[offset] ?? 0) +
          (pixels.data[offset + 1] ?? 0) +
          (pixels.data[offset + 2] ?? 0)) /
        3;
      pixels.data[offset] = 255;
      pixels.data[offset + 1] = 255;
      pixels.data[offset + 2] = 255;
      pixels.data[offset + 3] = luminance > 127 ? 255 : 0;
    }
    temporaryContext.putImageData(pixels, 0, 0);
    return temporary;
  };
  const applySegmentMask = async (maskUrl: string): Promise<void> => {
    const segmented = await segmentMaskCanvas(maskUrl);
    const target = getMask().getContext("2d");
    if (!target) throw new Error("Could not apply the SAM3 mask.");
    target.clearRect(0, 0, canvas.width, canvas.height);
    target.drawImage(segmented, 0, 0);
  };
  const segmentPromptForLayer = (name: string): string => {
    if (
      name.includes("pupil") ||
      name.includes("highlight") ||
      name.includes("eyelid") ||
      name.includes("eye white")
    )
      return name
        .replace(" pupil iris", " iris")
        .replace(" eye white", " eye")
        .replace(" eyelid", " eye")
        .replace(" highlight", " eye highlight");
    return name;
  };
  const segmentGeneratedPart = async (
    artworkSource: string,
    targetLayer: string,
  ): Promise<boolean> => {
    const modelsResponse = await fetch("/comfy/models/checkpoints");
    const models = (await modelsResponse.json()) as unknown;
    const sam3 = Array.isArray(models)
      ? models.find(
          (model): model is string =>
            typeof model === "string" && model.startsWith("sam3"),
        )
      : undefined;
    if (!sam3)
      throw new Error("SAM3 is required to extract generated mouth parts.");
    const sourceName = await uploadToComfy(
      artworkSource,
      `open-avatar-generated-${targetLayer.replaceAll(" ", "-")}.png`,
    );
    const response = await fetch("/comfy/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: createSegmentWorkflow(sam3, sourceName, targetLayer),
      }),
    });
    if (!response.ok)
      throw new Error(`ComfyUI could not segment generated ${targetLayer}.`);
    const queued = (await response.json()) as { prompt_id?: unknown };
    if (typeof queued.prompt_id !== "string")
      throw new Error("ComfyUI did not return a SAM3 extraction job id.");
    const segmented = await segmentMaskCanvas(
      await waitForComfyOutput(queued.prompt_id),
    );
    const segmentedContext = segmented.getContext("2d");
    const hasPixels =
      segmentedContext &&
      cropBoundsFromAlpha(
        segmentedContext.getImageData(0, 0, canvas.width, canvas.height).data,
        canvas.width,
        canvas.height,
      );
    if (!hasPixels) return false;
    const target = getMask(targetLayer);
    const targetContext = target.getContext("2d");
    if (!targetContext) return false;
    targetContext.clearRect(0, 0, target.width, target.height);
    targetContext.drawImage(segmented, 0, 0);
    generatedArtwork.set(
      targetLayer,
      await transparentPartArtwork(artworkSource, targetLayer),
    );
    return true;
  };
  const suggestSelectedPart = async (): Promise<void> => {
    if (!image) return;
    suggest.disabled = true;
    announce(`Checking local SAM3 for ${selectedLayer}…`);
    try {
      if (
        selectedLayer.includes("pupil iris") ||
        selectedLayer.includes("highlight") ||
        selectedLayer.includes("eyelid")
      ) {
        paintSuggestion(selectedLayer);
        renderLayers();
        draw();
        announce(
          `Used pixel-aware ${selectedLayer} detection. Refine its edge with the manual tools.`,
        );
        return;
      }
      const modelsResponse = await fetch("/comfy/models/checkpoints");
      const models = (await modelsResponse.json()) as unknown;
      const sam3 = Array.isArray(models)
        ? models.find(
            (model): model is string =>
              typeof model === "string" && model.startsWith("sam3"),
          )
        : undefined;
      if (!sam3) {
        paintSuggestion(selectedLayer);
        renderLayers();
        draw();
        announce(
          "SAM3 is not available. Used the local pixel suggestion; refine it with the brush.",
        );
        return;
      }
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = canvas.width;
      sourceCanvas.height = canvas.height;
      sourceCanvas.getContext("2d")?.drawImage(image, 0, 0);
      const sourceName = await uploadToComfy(
        sourceCanvas.toDataURL("image/png"),
        "open-avatar-segment-source.png",
      );
      const response = await fetch("/comfy/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createSegmentWorkflow(
            sam3,
            sourceName,
            segmentPromptForLayer(selectedLayer),
          ),
        }),
      });
      if (!response.ok)
        throw new Error("ComfyUI rejected the SAM3 segmentation workflow.");
      const queued = (await response.json()) as { prompt_id?: unknown };
      if (typeof queued.prompt_id !== "string")
        throw new Error("ComfyUI did not return a SAM3 job id.");
      announce(`SAM3 is segmenting ${selectedLayer} locally…`);
      await applySegmentMask(await waitForComfyOutput(queued.prompt_id));
      renderLayers();
      draw();
      announce(
        `SAM3 suggested ${selectedLayer}. Review it, then refine its edge with the manual tools.`,
      );
    } catch (error) {
      announce(
        error instanceof Error ? error.message : "SAM3 part suggestion failed.",
      );
    } finally {
      suggest.disabled = false;
    }
  };
  const generateRepair = async (): Promise<string | undefined> => {
    if (!image) return undefined;
    const currentMask = getMask();
    const bounds = cropBoundsFromAlpha(
      currentMask
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
    );
    if (!bounds) {
      repairStatus.textContent =
        "Paint or create a mask for the selected part before generating.";
      return undefined;
    }
    repair.disabled = true;
    repairOutput.removeAttribute("src");
    repairOutput.hidden = true;
    applyRepair.disabled = true;
    repairStatus.textContent =
      "Uploading the local portrait and mask to ComfyUI…";
    try {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = canvas.width;
      sourceCanvas.height = canvas.height;
      sourceCanvas.getContext("2d")?.drawImage(image, 0, 0);
      const sourceName = await uploadToComfy(
        sourceCanvas.toDataURL("image/png"),
        "open-avatar-source.png",
      );
      const maskName = await uploadToComfy(
        currentMask.toDataURL("image/png"),
        "open-avatar-mask.png",
      );
      const modelResponse = await fetch("/comfy/models/checkpoints");
      const checkpoints = (await modelResponse.json()) as unknown;
      const checkpoint = Array.isArray(checkpoints)
        ? checkpoints.find(
            (item): item is string =>
              typeof item === "string" && !item.startsWith("sam"),
          )
        : undefined;
      if (!checkpoint) throw new Error("No ComfyUI checkpoint is available.");
      repairStatus.textContent =
        "Generating missing artwork locally with SD 1.5…";
      const prompt = `anime VTuber portrait, preserve the original character, ${repairPrompt.value.trim() || `repair the ${selectedLayer} artwork naturally`}, clean line art, matching colors`;
      const response = await fetch("/comfy/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createInpaintWorkflow(
            checkpoint,
            sourceName,
            maskName,
            prompt,
            Math.floor(Math.random() * 2_000_000_000),
          ),
        }),
      });
      if (!response.ok)
        throw new Error("ComfyUI rejected the inpainting workflow.");
      const queued = (await response.json()) as { prompt_id?: unknown };
      if (typeof queued.prompt_id !== "string")
        throw new Error("ComfyUI did not return a job id.");
      const generated = await toDataUrl(
        await waitForComfyOutput(queued.prompt_id),
      );
      repairOutput.src = generated;
      repairOutput.hidden = false;
      applyRepair.disabled = false;
      repairStatus.textContent =
        "Draft repair complete. Compare it with the portrait before using it as artwork.";
      return generated;
    } catch (error) {
      repairStatus.textContent =
        error instanceof Error ? error.message : "Local repair failed.";
      return undefined;
    } finally {
      repair.disabled = false;
    }
  };
  const expressionPrompt = (name: ExpressionName): string => {
    const common =
      "same anime VTuber portrait, preserve the exact character, face shape, hair, pose, line art, lighting, and colors; edit only the masked region";
    switch (name) {
      case "open mouth":
        return `${common}, naturally open mouth, visible dark mouth interior, tongue and a small amount of teeth, clean separated Live2D mouth artwork`;
      case "blink":
        return `${common}, both eyes naturally closed in a relaxed blink, clean eyelid line art`;
      case "left wink":
        return `${common}, character's left eye naturally closed in a wink, other eye unchanged, clean eyelid line art`;
      case "right wink":
        return `${common}, character's right eye naturally closed in a wink, other eye unchanged, clean eyelid line art`;
    }
  };
  const combinedExpressionMask = (
    name: ExpressionName,
  ): HTMLCanvasElement | undefined => {
    const result = document.createElement("canvas");
    result.width = canvas.width;
    result.height = canvas.height;
    const resultContext = result.getContext("2d");
    if (!resultContext) return undefined;
    let hasPixels = false;
    expressionLayers[name].forEach((layer) => {
      const mask = masks.get(layer);
      if (!mask) return;
      const maskContext = mask.getContext("2d");
      if (!maskContext) return;
      const bounds = cropBoundsFromAlpha(
        maskContext.getImageData(0, 0, mask.width, mask.height).data,
        mask.width,
        mask.height,
      );
      if (!bounds) return;
      hasPixels = true;
      resultContext.drawImage(mask, 0, 0);
    });
    if (hasPixels && name === "open mouth") {
      const pixels = resultContext.getImageData(
        0,
        0,
        result.width,
        result.height,
      ).data;
      const bounds = cropBoundsFromAlpha(pixels, result.width, result.height);
      if (bounds) {
        const paddingX = Math.max(8, bounds.width * 0.25);
        const paddingTop = Math.max(4, bounds.height * 0.4);
        const paddingBottom = Math.max(16, bounds.height * 2.2);
        const x = Math.max(0, bounds.x - paddingX);
        const y = Math.max(0, bounds.y - paddingTop);
        const width = Math.min(result.width - x, bounds.width + paddingX * 2);
        const height = Math.min(
          result.height - y,
          bounds.height + paddingTop + paddingBottom,
        );
        resultContext.fillStyle = "#ffffff";
        resultContext.beginPath();
        resultContext.roundRect(
          x,
          y,
          width,
          height,
          Math.min(width, height) * 0.25,
        );
        resultContext.fill();
      }
    }
    return hasPixels ? result : undefined;
  };
  const generateExpression = async (name: ExpressionName): Promise<void> => {
    if (!image) return;
    const expressionMask = combinedExpressionMask(name);
    if (!expressionMask) {
      expressionStatus.textContent = `Create the ${expressionLayers[name].join(", ")} masks before generating ${name}.`;
      return;
    }
    const button = expressionButtons.get(name);
    expressionButtons.forEach((item) => (item.disabled = true));
    expressionStatus.textContent = `Uploading the portrait and ${name} mask to local ComfyUI…`;
    try {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = canvas.width;
      sourceCanvas.height = canvas.height;
      sourceCanvas.getContext("2d")?.drawImage(image, 0, 0);
      const [sourceName, maskName, checkpoints] = await Promise.all([
        uploadToComfy(
          sourceCanvas.toDataURL("image/png"),
          "open-avatar-expression-source.png",
        ),
        uploadToComfy(
          expressionMask.toDataURL("image/png"),
          `open-avatar-${name.replaceAll(" ", "-")}-mask.png`,
        ),
        fetch("/comfy/models/checkpoints").then(
          (response) => response.json() as Promise<unknown>,
        ),
      ]);
      const checkpoint = Array.isArray(checkpoints)
        ? checkpoints.find(
            (item): item is string =>
              typeof item === "string" && !item.startsWith("sam"),
          )
        : undefined;
      if (!checkpoint)
        throw new Error("No SD inpainting checkpoint is available in ComfyUI.");
      expressionStatus.textContent = `ComfyUI is creating the ${name} comparison state locally…`;
      const response = await fetch("/comfy/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createInpaintWorkflow(
            checkpoint,
            sourceName,
            maskName,
            expressionPrompt(name),
            Math.floor(Math.random() * 2_000_000_000),
          ),
        }),
      });
      if (!response.ok)
        throw new Error("ComfyUI rejected the expression workflow.");
      const queued = (await response.json()) as { prompt_id?: unknown };
      if (typeof queued.prompt_id !== "string")
        throw new Error("ComfyUI did not return an expression job id.");
      const generated = await toDataUrl(
        await waitForComfyOutput(queued.prompt_id),
      );
      expressionArtwork.set(name, generated);
      if (name === "open mouth") {
        expressionStatus.textContent =
          "Open mouth created. SAM3 is extracting mouth interior, tongue, and teeth…";
        for (const target of ["mouth interior", "tongue", "teeth"]) {
          await segmentGeneratedPart(generated, target);
        }
        renderLayers();
      }
      saveDraft();
      expressionStatus.textContent = `${name} is ready. Open Motion Lab and choose it as a comparison state.`;
      button?.classList.remove("quiet");
    } catch (error) {
      expressionStatus.textContent =
        error instanceof Error
          ? error.message
          : "Expression generation failed.";
    } finally {
      expressionButtons.forEach((item) => (item.disabled = false));
    }
  };
  const makeAvatarMotionReady = async (): Promise<void> => {
    if (!image) return;
    makeMotionReady.disabled = true;
    completeAll.disabled = true;
    const motionParts = [
      "face base",
      "left eye white",
      "right eye white",
      "left pupil iris",
      "right pupil iris",
      "left upper eyelid",
      "right upper eyelid",
      "left lower eyelid",
      "right lower eyelid",
      "mouth closed lips",
      "torso",
    ];
    try {
      for (const [index, name] of motionParts.entries()) {
        const mask = masks.get(name);
        const maskContext = mask?.getContext("2d");
        const hasMask =
          mask &&
          maskContext &&
          cropBoundsFromAlpha(
            maskContext.getImageData(0, 0, mask.width, mask.height).data,
            mask.width,
            mask.height,
          );
        if (hasMask) continue;
        selectedLayer = name;
        layerName.textContent = name;
        announce(
          `Preparing motion part ${index + 1} of ${motionParts.length}: ${name}…`,
        );
        await suggestSelectedPart();
        if (!maskBounds(name) && paintBoundedFallback(name))
          announce(`Added a bounded motion fallback for ${name}.`);
      }
      for (const name of ["left eye white", "right eye white"]) {
        const mask = masks.get(name);
        if (!mask) continue;
        const target = getArtwork(name);
        const targetContext = target.getContext("2d");
        if (!targetContext) continue;
        targetContext.clearRect(0, 0, target.width, target.height);
        targetContext.fillStyle = "#fff9ed";
        targetContext.fillRect(0, 0, target.width, target.height);
        targetContext.globalCompositeOperation = "destination-in";
        targetContext.drawImage(mask, 0, 0);
        targetContext.globalCompositeOperation = "source-over";
        generatedArtwork.set(name, target.toDataURL("image/png"));
      }
      for (const name of [
        "open mouth",
        "blink",
        "left wink",
        "right wink",
      ] as const) {
        if (expressionArtwork.has(name)) continue;
        announce(`Generating ${name} for Motion Lab…`);
        for (
          let attempt = 1;
          attempt <= 2 && !expressionArtwork.has(name);
          attempt += 1
        ) {
          if (attempt > 1)
            announce(`Retrying ${name} expression (attempt 2/2).`);
          await generateExpression(name);
        }
      }
      renderLayers();
      saveDraft();
      announce(
        "Motion-ready draft completed. Eye whites were filled and generated mouth, blink, and wink states were saved for Motion Lab.",
      );
    } catch (error) {
      announce(
        error instanceof Error
          ? error.message
          : "Could not complete the motion-ready avatar.",
      );
    } finally {
      makeMotionReady.disabled = false;
      completeAll.disabled = false;
    }
  };
  const completeAllMissing = async (
    jobs?: readonly PartGenerationJob[],
  ): Promise<void> => {
    const orderedNames = jobs?.map(({ partId }) => partId) ?? layerNames;
    const prompts = new Map(jobs?.map((job) => [job.partId, job.prompt]));
    const missing = orderedNames.filter((name) => {
      const mask = masks.get(name);
      if (!mask) return true;
      const context = mask.getContext("2d");
      return (
        !context ||
        !cropBoundsFromAlpha(
          context.getImageData(0, 0, mask.width, mask.height).data,
          mask.width,
          mask.height,
        )
      );
    });
    if (!missing.length) {
      announce(
        "Every listed part already has a mask. Review the results before export.",
      );
      return;
    }
    completeAll.disabled = true;
    repair.disabled = true;
    try {
      for (const [index, name] of missing.entries()) {
        selectedLayer = name;
        layerName.textContent = name;
        announce(`Completing ${index + 1} of ${missing.length}: ${name}…`);
        await suggestSelectedPart();
        const mask = getMask(name);
        const context = mask.getContext("2d");
        let hasMask =
          context &&
          cropBoundsFromAlpha(
            context.getImageData(0, 0, mask.width, mask.height).data,
            mask.width,
            mask.height,
          );
        if (!hasMask && context) {
          paintSuggestion(name);
          hasMask = cropBoundsFromAlpha(
            context.getImageData(0, 0, mask.width, mask.height).data,
            mask.width,
            mask.height,
          );
          if (hasMask)
            announce(
              `SAM3 returned no ${name} pixels. Using the bounded automatic fallback region…`,
            );
        }
        if (!hasMask && paintBoundedFallback(name)) {
          hasMask = maskBounds(name);
          announce(`Added a deterministic bounded fallback for ${name}.`);
        }
        if (!hasMask) continue;
        repairPrompt.value =
          prompts.get(name) ?? `Generate complete ${name} artwork.`;
        let generated: string | undefined;
        for (let attempt = 1; attempt <= 2 && !generated; attempt += 1) {
          if (attempt > 1)
            announce(`Retrying transparent ${name} artwork (attempt 2/2).`);
          generated = await generateRepair();
        }
        if (generated)
          generatedArtwork.set(
            name,
            await transparentPartArtwork(generated, name),
          );
        saveDraft();
      }
      announce(
        "Completed the missing-part queue. Review every generated layer before Motion Lab.",
      );
    } finally {
      completeAll.disabled = false;
      repair.disabled = false;
      renderLayers();
    }
  };
  const suggestAllParts = async (): Promise<void> => {
    suggestAll.disabled = true;
    try {
      for (const [index, name] of layerNames.entries()) {
        selectedLayer = name;
        layerName.textContent = name;
        announce(`Suggesting ${index + 1} of ${layerNames.length}: ${name}…`);
        await suggestSelectedPart();
      }
      renderLayers();
      announce(
        "Suggested all parts locally. Review each horizontal layer card before painting or generating missing art.",
      );
    } finally {
      suggestAll.disabled = false;
    }
  };

  input.addEventListener("change", () => {
    void (async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        announce("Choose a PNG, JPEG, or WebP image.");
        return;
      }
      await load(await asDataUrl(file));
    })();
  });
  host.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((button) =>
    button.addEventListener("click", () => {
      selectedLayer = button.dataset.layer ?? "face base";
      layerName.textContent = selectedLayer;
      host
        .querySelectorAll("[data-layer]")
        .forEach((item) => item.classList.toggle("selected", item === button));
      draw();
    }),
  );
  canvas.addEventListener("pointerdown", (event) => {
    if (guidingEye) {
      const nextPoint = point(event);
      guidePoints.push(nextPoint);
      const pointNames = [
        "outer corner",
        "inner corner",
        "top lid",
        "lower lid",
      ];
      if (guidePoints.length === 4) {
        const [outer, inner, top, bottom] = guidePoints;
        if (!outer || !inner || !top || !bottom) return;
        const guide = { outer, inner, top, bottom };
        eyeGuides.set(guidingEye, guide);
        applyEyeGuide(guidingEye, guide);
        guideStatus.textContent = `${guidingEye === "left" ? "Left" : "Right"} eye guide ready.`;
        guidingEye = undefined;
        guidePoints = [];
        draw();
        announce(
          "Eye guide saved. Set the other eye, then create guided eye layers.",
        );
      } else {
        guideStatus.textContent = `${guidingEye === "left" ? "Left" : "Right"} eye: click ${pointNames[guidePoints.length]}.`;
        draw();
      }
      return;
    }
    drawing = true;
    saveSnapshot();
    canvas.setPointerCapture(event.pointerId);
    brush(event);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drawing) brush(event);
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
    renderLayers();
  });
  const paintPartCanvas = (event: PointerEvent) => {
    const bounds = selectedBounds();
    if (!bounds) return;
    const partBounds = partCanvas.getBoundingClientRect();
    const mainBounds = canvas.getBoundingClientRect();
    const x =
      bounds.x +
      ((event.clientX - partBounds.left) / partBounds.width) * bounds.width;
    const y =
      bounds.y +
      ((event.clientY - partBounds.top) / partBounds.height) * bounds.height;
    brush(
      new PointerEvent("pointermove", {
        clientX: mainBounds.left + (x / canvas.width) * mainBounds.width,
        clientY: mainBounds.top + (y / canvas.height) * mainBounds.height,
        button: event.button,
        buttons: event.buttons,
      }),
    );
  };
  partCanvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    saveSnapshot();
    partCanvas.setPointerCapture(event.pointerId);
    paintPartCanvas(event);
  });
  partCanvas.addEventListener("pointermove", (event) => {
    if (drawing) paintPartCanvas(event);
  });
  partCanvas.addEventListener("pointerup", () => {
    drawing = false;
    renderLayers();
  });
  partCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoom = Math.min(
        5,
        Math.max(0.5, zoom + (event.deltaY < 0 ? 0.15 : -0.15)),
      );
      canvas.style.width = `${zoom * 100}%`;
      canvas.style.maxWidth = "none";
      announce(
        `Canvas zoom ${Math.round(zoom * 100)}%. Ctrl/Cmd + wheel zooms; right-click erases.`,
      );
    },
    { passive: false },
  );
  size.addEventListener("input", () => (value.value = `${size.value} px`));
  const setMode = (next: "add" | "erase") => {
    mode = next;
    add.classList.toggle("selected", next === "add");
    erase.classList.toggle("selected", next === "erase");
  };
  add.addEventListener("click", () => setMode("add"));
  erase.addEventListener("click", () => setMode("erase"));
  suggest.addEventListener("click", () => {
    saveSnapshot();
    void suggestSelectedPart();
  });
  suggestAll.addEventListener("click", () => {
    void suggestAllParts();
  });
  compare.addEventListener("click", () => {
    showingSource = !showingSource;
    compare.textContent = showingSource ? "Show mask" : "Compare source";
    draw();
  });
  const startGuide = (side: "left" | "right") => {
    guidingEye = side;
    guidePoints = [];
    guideStatus.textContent = `${side === "left" ? "Left" : "Right"} eye: click outer corner.`;
    announce(
      "Eye guide mode: click outer corner, inner corner, top lid, then lower lid. The marks follow the real portrait.",
    );
    draw();
  };
  guideLeft.addEventListener("click", () => startGuide("left"));
  guideRight.addEventListener("click", () => startGuide("right"));
  createGuidedEyes.addEventListener("click", createEyeLayersFromGuides);
  clearGuides.addEventListener("click", () => {
    eyeGuides.clear();
    guidingEye = undefined;
    guidePoints = [];
    guideStatus.textContent = "No eye guides set.";
    draw();
  });
  repair.addEventListener("click", () => void generateRepair());
  applyRepair.addEventListener("click", () => {
    void (async () => {
      if (!repairOutput.src) return;
      generatedArtwork.set(
        selectedLayer,
        await transparentPartArtwork(repairOutput.src, selectedLayer),
      );
      applyRepair.disabled = true;
      repairStatus.textContent = `Applied the local repair to ${selectedLayer}. It will be included in Motion Lab and export.`;
      saveDraft();
    })();
  });
  completeAll.addEventListener("click", () => void completeAllMissing());
  makeMotionReady.addEventListener("click", () => void makeAvatarMotionReady());
  expressionButtons.forEach((button, name) =>
    button.addEventListener("click", () => void generateExpression(name)),
  );
  const setEditing = (next: "mask" | "art") => {
    editing = next;
    paintArt.classList.toggle("selected", next === "art");
    paintMask.classList.toggle("selected", next === "mask");
    announce(
      next === "art"
        ? "Painting artwork inside the selected mask."
        : "Editing the selected mask.",
    );
  };
  paintArt.addEventListener("click", () => setEditing("art"));
  paintMask.addEventListener("click", () => setEditing("mask"));
  fillArt.addEventListener("click", () => {
    const target = getArtwork();
    const targetContext = target.getContext("2d");
    if (!targetContext) return;
    targetContext.clearRect(0, 0, target.width, target.height);
    targetContext.fillStyle = artColor.value;
    targetContext.fillRect(0, 0, target.width, target.height);
    targetContext.globalCompositeOperation = "destination-in";
    targetContext.drawImage(getMask(), 0, 0);
    targetContext.globalCompositeOperation = "source-over";
    generatedArtwork.set(selectedLayer, target.toDataURL("image/png"));
    saveDraft();
    renderLayers();
    draw();
    announce(`Filled ${selectedLayer} with the selected color.`);
  });
  clearArt.addEventListener("click", () => {
    const target = artworkCanvases.get(selectedLayer);
    target?.getContext("2d")?.clearRect(0, 0, target.width, target.height);
    artworkCanvases.delete(selectedLayer);
    generatedArtwork.delete(selectedLayer);
    saveDraft();
    renderLayers();
    draw();
    announce(`Cleared artwork for ${selectedLayer}.`);
  });
  clear.addEventListener("click", () => {
    const mask = getMask();
    const maskContext = mask.getContext("2d");
    if (!maskContext) return;
    saveSnapshot();
    maskContext.clearRect(0, 0, mask.width, mask.height);
    renderLayers();
    draw();
  });
  undo.addEventListener("click", () => {
    const snapshots = history.get(selectedLayer) ?? [];
    const previous = snapshots.pop();
    if (!previous) return;
    const next = future.get(selectedLayer) ?? [];
    next.push(getMask().toDataURL());
    future.set(selectedLayer, next);
    restore(previous);
    undo.disabled = snapshots.length === 0;
    redo.disabled = false;
  });
  redo.addEventListener("click", () => {
    const snapshots = future.get(selectedLayer) ?? [];
    const next = snapshots.pop();
    if (!next) return;
    saveSnapshot();
    restore(next);
    redo.disabled = snapshots.length === 0;
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("input, textarea, select")) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo.click();
      else undo.click();
      return;
    }
    if (event.key.toLowerCase() === "b") setMode("add");
    if (event.key.toLowerCase() === "e") setMode("erase");
  });
  validate.addEventListener("click", () => {
    const project = buildProject();
    if (!isProjectReady(project.layers)) {
      announce(
        "Create or paint the required face, eye-white, pupil, eyelid, mouth, and torso masks before Motion Lab.",
      );
      return;
    }
    openMotion.disabled = false;
    exportProject.disabled = false;
    announce("Project is ready for Motion Lab and final local export.");
    host.dispatchEvent(
      new CustomEvent("avatarprojectready", { bubbles: true, detail: project }),
    );
  });
  exportProject.addEventListener("click", () => {
    const project = buildProject();
    if (!isProjectReady(project.layers)) return;
    download("open-avatar-project.json", JSON.stringify(project, null, 2));
    announce(
      "Exported a local project file. Keep it with the original portrait.",
    );
  });
  const savedDraft = (() => {
    try {
      const parsed: unknown = JSON.parse(
        sessionStorage.getItem("open-avatar-project") ?? "null",
      );
      if (!parsed || typeof parsed !== "object") return undefined;
      const project = parsed as Partial<ExportedProject>;
      return project.version === 1 &&
        typeof project.source === "string" &&
        project.layers
        ? ({
            version: 1,
            updatedAt: project.updatedAt ?? Date.now(),
            source: project.source,
            layers: project.layers,
            generatedArtwork: project.generatedArtwork ?? {},
            expressionArtwork: project.expressionArtwork ?? {},
            missingArtwork: project.missingArtwork ?? [],
            limitations: project.limitations ?? [],
          } satisfies ExportedProject)
        : undefined;
    } catch {
      return undefined;
    }
  })();
  void load(savedDraft?.source ?? exampleSource, savedDraft);
  return {
    loadSource: (nextSource) => load(nextSource),
    loadProject: (project) => load(project.source, project),
    buildAutomatically: async (jobs) => {
      await completeAllMissing(jobs);
      await makeAvatarMotionReady();
      const project = buildProject(jobs?.map(({ partId }) => partId));
      const missingRequired = findMissingRequiredMotionLayers(project.layers);
      if (missingRequired.length)
        throw new Error(
          `Automatic part generation is missing required motion layers: ${missingRequired.join(", ")}.`,
        );
      const expectedGenerated = jobs?.map(({ partId }) => partId) ?? [];
      const missingGenerated = expectedGenerated.filter(
        (name) => !project.generatedArtwork[name],
      );
      if (missingGenerated.length)
        throw new Error(
          `Automatic part generation is missing transparent artwork: ${missingGenerated.join(", ")}.`,
        );
      const missingExpressions = (
        Object.keys(expressionLayers) as ExpressionName[]
      ).filter((name) => !project.expressionArtwork[name]);
      if (missingExpressions.length)
        throw new Error(
          `Automatic part generation is missing expression artwork: ${missingExpressions.join(", ")}.`,
        );
      openMotion.disabled = false;
      exportProject.disabled = false;
      host.dispatchEvent(
        new CustomEvent("avatarprojectready", {
          bubbles: true,
          detail: project,
        }),
      );
      return project;
    },
  };
};
