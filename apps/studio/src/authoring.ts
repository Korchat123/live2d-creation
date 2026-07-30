export type CropBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type ExportedProject = {
  readonly version: 1;
  readonly source: string;
  readonly layers: Readonly<Record<string, string>>;
  readonly missingArtwork: readonly string[];
  readonly limitations: readonly string[];
};

const requiredLayers = [
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
];
const layerNames = [
  ...requiredLayers,
  "left eye highlight",
  "right eye highlight",
  "left eyebrow",
  "right eyebrow",
  "teeth",
  "tongue",
  "neck",
  "front hair",
  "back hair",
  "accessory",
  "left hand arm",
  "right hand arm",
];

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
): boolean => requiredLayers.every((layer) => Boolean(layers[layer]));

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

export const mountLayerLab = (
  host: HTMLElement,
  exampleSource: string,
): void => {
  const input = host.querySelector<HTMLInputElement>("#source-image");
  const canvas = host.querySelector<HTMLCanvasElement>("#layer-canvas");
  const size = host.querySelector<HTMLInputElement>("#brush-size");
  const layerName = host.querySelector<HTMLElement>("#active-layer");
  const layersOutput = host.querySelector<HTMLElement>("#layer-output");
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
    !clear ||
    !undo ||
    !redo ||
    !add ||
    !erase ||
    !value ||
    !suggest ||
    !suggestAll ||
    !compare ||
    !validate ||
    !exportProject ||
    !openMotion ||
    !status
  )
    return;

  const context = canvas.getContext("2d");
  if (!context) return;
  const masks = new Map<string, HTMLCanvasElement>();
  const history = new Map<string, string[]>();
  const future = new Map<string, string[]>();
  let image: HTMLImageElement | undefined;
  let source = exampleSource;
  let selectedLayer = "face base";
  let drawing = false;
  let mode: "add" | "erase" = "add";
  let showingSource = false;

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
  const draw = () => {
    if (!image) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (showingSource) return;
    context.save();
    context.globalAlpha = 0.35;
    context.drawImage(getMask(), 0, 0);
    context.restore();
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
    const maskContext = getMask().getContext("2d");
    if (!maskContext || !image) return;
    const { x, y } = point(event);
    maskContext.globalCompositeOperation =
      mode === "add" ? "source-over" : "destination-out";
    maskContext.fillStyle = "#ffffff";
    maskContext.beginPath();
    maskContext.arc(x, y, Number(size.value), 0, Math.PI * 2);
    maskContext.fill();
    maskContext.globalCompositeOperation = "source-over";
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
      item.innerHTML = `<span>${name}</span><strong>${bounds ? "masked" : "empty"}</strong>`;
      if (bounds && image) {
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = bounds.width;
        previewCanvas.height = bounds.height;
        const previewContext = previewCanvas.getContext("2d");
        if (previewContext) {
          previewContext.drawImage(
            image,
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
  };
  const load = (nextSource: string) => {
    const next = new Image();
    next.onload = () => {
      image = next;
      source = nextSource;
      canvas.width = next.naturalWidth;
      canvas.height = next.naturalHeight;
      masks.clear();
      history.clear();
      future.clear();
      detectEyeSuggestions();
      undo.disabled = true;
      redo.disabled = true;
      openMotion.disabled = true;
      exportProject.disabled = true;
      renderLayers();
      draw();
      announce("Portrait loaded locally. Select a layer and paint its mask.");
    };
    next.src = nextSource;
  };
  const suggestedRegions: Record<string, [number, number, number, number]> = {
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
    "back hair": [0.15, 0.04, 0.7, 0.52],
    accessory: [0.7, 0.12, 0.1, 0.13],
    "left hand arm": [0.15, 0.45, 0.18, 0.4],
    "right hand arm": [0.67, 0.45, 0.18, 0.4],
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
  const buildProject = (): ExportedProject => {
    const exported: Record<string, string> = {};
    masks.forEach((mask, name) => {
      const bounds = cropBoundsFromAlpha(
        mask.getContext("2d")!.getImageData(0, 0, mask.width, mask.height).data,
        mask.width,
        mask.height,
      );
      if (bounds) exported[name] = mask.toDataURL("image/png");
    });
    return {
      version: 1,
      source,
      layers: exported,
      missingArtwork: findMissingArtwork(exported),
      limitations: [
        "A flat portrait cannot create hidden pixels for large head turns or hands.",
        "Starter masks are crops, not newly created hidden artwork. Repair or generate dedicated eye-white, pupil, eyelid, and mouth artwork before production rigging.",
      ],
    };
  };

  input.addEventListener("change", () => {
    void (async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        announce("Choose a PNG, JPEG, or WebP image.");
        return;
      }
      load(await asDataUrl(file));
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
    paintSuggestion(selectedLayer);
    renderLayers();
    draw();
    announce(`Suggested a ${selectedLayer} region. Refine it with the brush.`);
  });
  suggestAll.addEventListener("click", () => {
    layerNames.forEach(paintSuggestion);
    renderLayers();
    draw();
    announce(
      "Created editable starter masks for all 24 art parts. Review each one before validation.",
    );
  });
  compare.addEventListener("click", () => {
    showingSource = !showingSource;
    compare.textContent = showingSource ? "Show mask" : "Compare source";
    draw();
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
  load(exampleSource);
};
