import type { ExportedProject } from "./authoring.js";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing application root");

const parseProject = (raw: string | null): ExportedProject | undefined => {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    const value = parsed as Record<string, unknown>;
    if (value.version !== 1 || typeof value.source !== "string")
      return undefined;
    if (!value.layers || typeof value.layers !== "object") return undefined;
    if (
      !Array.isArray(value.missingArtwork) ||
      !Array.isArray(value.limitations)
    )
      return undefined;
    const layers = Object.fromEntries(
      Object.entries(value.layers as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    const missingArtwork = value.missingArtwork.filter(
      (part): part is string => typeof part === "string",
    );
    const limitations = value.limitations.filter(
      (part): part is string => typeof part === "string",
    );
    return {
      version: 1,
      source: value.source,
      layers,
      missingArtwork,
      limitations,
    };
  } catch {
    return undefined;
  }
};

const project = parseProject(sessionStorage.getItem("open-avatar-project"));
root.innerHTML = `
  <header class="site-header"><a class="brand" href="/">Open Avatar <span>VTuber Lab</span></a><nav aria-label="Primary"><a class="nav-link" href="/">1. Build avatar</a><a class="nav-link selected" href="/motion.html">2. Motion Lab</a></nav></header>
  <main><section class="page" aria-labelledby="motion-title"><p class="eyebrow">Page 2</p><h1 id="motion-title">Motion Lab</h1>
  <div class="motion-grid"><section class="motion-stage"><canvas id="motion-canvas" aria-label="Animated avatar preview"></canvas><p id="motion-status">${project ? "Loading validated avatar…" : "No validated project found. Return to Builder, create the parts, then validate it."}</p></section>
  <aside class="motion-panel"><h2>Controls</h2><label>Gaze X <output id="gaze-x-value">0</output><input id="gaze-x" type="range" min="-1" max="1" step="0.01" value="0"></label><label>Gaze Y <output id="gaze-y-value">0</output><input id="gaze-y" type="range" min="-1" max="1" step="0.01" value="0"></label><label>Blink <output id="blink-value">0</output><input id="blink" type="range" min="0" max="1" step="0.01" value="0"></label><label>Mouth open <output id="mouth-value">0</output><input id="mouth" type="range" min="0" max="1" step="0.01" value="0"></label><label><input id="breath" type="checkbox"> Gentle breathing</label><div class="buttons"><button id="reset-motion" type="button" class="quiet">Reset</button><a class="button-link" href="/">Return to Builder</a></div><h2>Artwork warnings</h2><ul id="readiness"></ul></aside></div></section></main>`;

const canvas = document.querySelector<HTMLCanvasElement>("#motion-canvas");
const status = document.querySelector<HTMLElement>("#motion-status");
const readiness = document.querySelector<HTMLUListElement>("#readiness");
if (!canvas || !status || !readiness || !project) {
  // The static page is the safe fallback for missing or corrupt project data.
} else {
  const sourceUrl = new URL(project.source, window.location.href);
  const sourceIsSafe =
    project.source.startsWith("data:image/") ||
    (sourceUrl.origin === window.location.origin &&
      (sourceUrl.pathname.startsWith("/assets/") ||
        sourceUrl.pathname.startsWith("/@fs/")));
  if (!sourceIsSafe) {
    status.textContent =
      "The saved source image is invalid. Return to Builder and validate again.";
  } else {
    const image = new Image();
    const loadImage = (source: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const next = new Image();
        next.onload = () => resolve(next);
        next.onerror = () => reject(new Error("Layer image could not load."));
        next.src = source;
      });
    image.onload = async () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      const masks = new Map<string, HTMLImageElement>();
      await Promise.all(
        Object.entries(project.layers).map(async ([name, source]) => {
          masks.set(name, await loadImage(source));
        }),
      );
      const control = (id: string): HTMLInputElement => {
        const element = document.querySelector<HTMLInputElement>(`#${id}`);
        if (!element) throw new Error(`Missing ${id}`);
        return element;
      };
      const gazeX = control("gaze-x");
      const gazeY = control("gaze-y");
      const blink = control("blink");
      const mouth = control("mouth");
      const breath = control("breath");
      const output = (id: string): HTMLOutputElement => {
        const element = document.querySelector<HTMLOutputElement>(`#${id}`);
        if (!element) throw new Error(`Missing ${id}`);
        return element;
      };
      const drawMasked = (name: string, x = 0, y = 0, alpha = 1) => {
        const mask = masks.get(name);
        if (!mask) return;
        const layer = document.createElement("canvas");
        layer.width = canvas.width;
        layer.height = canvas.height;
        const layerContext = layer.getContext("2d");
        if (!layerContext) return;
        layerContext.drawImage(image, 0, 0);
        layerContext.globalCompositeOperation = "destination-in";
        layerContext.drawImage(mask, 0, 0, canvas.width, canvas.height);
        context.save();
        context.globalAlpha = alpha;
        context.drawImage(layer, x, y);
        context.restore();
      };
      const fillMask = (name: string, color: string) => {
        const mask = masks.get(name);
        if (!mask) return;
        const layer = document.createElement("canvas");
        layer.width = canvas.width;
        layer.height = canvas.height;
        const layerContext = layer.getContext("2d");
        if (!layerContext) return;
        layerContext.fillStyle = color;
        layerContext.fillRect(0, 0, layer.width, layer.height);
        layerContext.globalCompositeOperation = "destination-in";
        layerContext.drawImage(mask, 0, 0, canvas.width, canvas.height);
        context.drawImage(layer, 0, 0);
      };
      const render = (time = 0) => {
        const dx = Number(gazeX.value) * canvas.width * 0.012;
        const dy = Number(gazeY.value) * canvas.height * 0.008;
        const blinkAmount = Number(blink.value);
        const mouthAmount = Number(mouth.value);
        const breathing = breath.checked ? Math.sin(time / 900) * 0.008 : 0;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(0, canvas.height * -breathing);
        context.scale(1, 1 + breathing);
        context.drawImage(image, 0, 0);
        ["left eye white", "right eye white"].forEach((name) =>
          fillMask(name, "#fff9ed"),
        );
        [
          "left pupil iris",
          "right pupil iris",
          "left eye highlight",
          "right eye highlight",
        ].forEach((name) => drawMasked(name, dx, dy));
        ["left upper eyelid", "right upper eyelid"].forEach((name) =>
          drawMasked(name, 0, blinkAmount * canvas.height * 0.025),
        );
        ["left lower eyelid", "right lower eyelid"].forEach((name) =>
          drawMasked(name, 0, -blinkAmount * canvas.height * 0.012),
        );
        drawMasked("mouth interior", 0, mouthAmount * canvas.height * 0.012, 1);
        context.restore();
        output("gaze-x-value").value = gazeX.value;
        output("gaze-y-value").value = gazeY.value;
        output("blink-value").value = blink.value;
        output("mouth-value").value = mouth.value;
      };
      [gazeX, gazeY, blink, mouth, breath].forEach((input) =>
        input.addEventListener("input", () => render()),
      );
      document
        .querySelector<HTMLButtonElement>("#reset-motion")
        ?.addEventListener("click", () => {
          gazeX.value = "0";
          gazeY.value = "0";
          blink.value = "0";
          mouth.value = "0";
          breath.checked = false;
          render();
        });
      const frame = (time: number) => {
        render(time);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      status.textContent =
        "Motion preview is live. Check gaze extremes and blink before export.";
    };
    image.src = project.source;
  }
  readiness.replaceChildren();
  const notes = project.missingArtwork.length
    ? project.missingArtwork
    : [
        "All starter masks present; repair hidden art before final production export.",
      ];
  notes.forEach((part) => {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = part;
    const state = document.createElement("strong");
    state.textContent = project.missingArtwork.length ? "missing" : "review";
    row.append(name, state);
    readiness.append(row);
  });
}
