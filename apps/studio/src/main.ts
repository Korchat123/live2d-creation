import manifest from "../../../assets/fixtures/minimal-avatar/avatar.json" with { type: "json" };
import clips from "../../../assets/reference-avatar/animation-clips.json" with { type: "json" };
import type { NamedAnimationClips } from "@open-avatar/core";
import eyeUrl from "../../../assets/fixtures/minimal-avatar/layers/eye_c_pair.svg?url";
import browUrl from "../../../assets/fixtures/minimal-avatar/layers/brow_c_pair.svg?url";
import faceUrl from "../../../assets/fixtures/minimal-avatar/layers/face_c_base.svg?url";
import mouthUrl from "../../../assets/fixtures/minimal-avatar/layers/mouth_c_lower_mesh.svg?url";
import torsoUrl from "../../../assets/fixtures/minimal-avatar/layers/torso_c_base.svg?url";
import render from "../../../assets/fixtures/minimal-avatar/render.json" with { type: "json" };
import { AvatarRenderer, type RenderBundle } from "@open-avatar/renderer-pixi";
import {
  TrustedStudioAdapter,
  actionCommand,
  resetCommand,
  setCommand,
} from "./controller.js";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing application root");

root.innerHTML = `
  <header>
    <div>
      <p class="eyebrow">Open Avatar Studio · Phase B</p>
      <h1>One avatar. One control language.</h1>
      <p class="lede">Human gestures and scripted intelligence travel through the same validated command adapter.</p>
    </div>
    <span id="status" class="pill">Loading renderer…</span>
  </header>
  <main>
    <section class="stage-card">
      <div class="heading">
        <div><p class="eyebrow">Live preview</p><h2>Minimal original avatar</h2></div>
        <button id="dispose" class="quiet">Dispose renderer</button>
      </div>
      <div id="stage" class="stage"><canvas id="avatar" aria-label="Animated avatar preview"></canvas></div>
      <div class="telemetry"><span>Frame <strong id="frame">—</strong></span><strong id="last">Waiting</strong></div>
    </section>
    <aside>
      <section class="panel">
        <p class="eyebrow">Trusted source · Human</p><h2>Direct controls</h2>
        <label>Gaze X <output id="xv">0.00</output><input id="x" type="range" min="-1" max="1" value="0" step=".05"></label>
        <label>Gaze Y <output id="yv">0.00</output><input id="y" type="range" min="-1" max="1" value="0" step=".05"></label>
        <label>Mouth open <output id="mv">0.00</output><input id="mouth" type="range" min="0" max="1" value="0" step=".05"></label>
        <div class="buttons">
          <button data-action="blink">Blink</button>
          <button data-action="expression">Expression</button>
          <button data-action="motion">Motion</button>
          <button id="reset" class="quiet">Reset</button>
        </div>
      </section>
      <section class="panel ai">
        <div class="heading"><div><p class="eyebrow">Trusted source · AI</p><h2>Scripted controller</h2></div><span id="override" class="pill">Available</span></div>
        <p>Uses the exact same adapter path as human input.</p>
        <button id="script">Run AI sequence</button>
      </section>
      <section class="panel">
        <p class="eyebrow">Bundle truth</p><h2>Capabilities</h2>
        <ul id="caps"></ul><p class="note">Unsupported actions are safely rejected.</p>
      </section>
    </aside>
  </main>
  <div id="announce" class="sr" role="status" aria-live="polite"></div>`;

const query = <T extends Element = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
};

const adapter = new TrustedStudioAdapter(manifest, {
  clips: clips as NamedAnimationClips,
});
const renderer = new AvatarRenderer();
const canvas = query<HTMLCanvasElement>("#avatar");
const assetUrls: Record<string, string> = {
  "layers/brow_c_pair.svg": browUrl,
  "layers/eye_c_pair.svg": eyeUrl,
  "layers/face_c_base.svg": faceUrl,
  "layers/mouth_c_lower_mesh.svg": mouthUrl,
  "layers/torso_c_base.svg": torsoUrl,
};
const bundle: RenderBundle = {
  ...(render as RenderBundle),
  layers: render.layers.map((layer) => ({
    ...layer,
    assetUrl: assetUrls[layer.assetUrl] ?? layer.assetUrl,
  })),
};
let disposed = false;
let timer: number | undefined;
let lastFrame = performance.now();

const viewport = () => {
  const bounds = query("#stage").getBoundingClientRect();
  return {
    width: Math.max(256, bounds.width),
    height: Math.max(256, bounds.height),
    resolution: Math.min(devicePixelRatio, 2),
  };
};

const submit = (command: unknown, source: "human" | "ai") => {
  const result = adapter.submit(command, source);
  query("#last").textContent = result.message;
  query("#announce").textContent = result.message;
};

const frame = (now: number) => {
  if (disposed) return;
  const snapshot = adapter.snapshot();
  renderer.render(snapshot.pose);
  query("#frame").textContent = `${(now - lastFrame).toFixed(1)} ms`;
  lastFrame = now;
  const remaining = snapshot.humanOverrideUntil - performance.now();
  query("#override").textContent =
    remaining > 0 ? `Human override ${Math.ceil(remaining)} ms` : "Available";
  requestAnimationFrame(frame);
};

void renderer
  .load(canvas, bundle, viewport())
  .then(() => {
    query("#status").textContent = "Renderer ready";
    requestAnimationFrame(frame);
  })
  .catch(() => {
    query("#status").textContent = "Renderer unavailable";
  });

for (const id of ["x", "y", "mouth"]) {
  query<HTMLInputElement>(`#${id}`).addEventListener("input", () => {
    const x = Number(query<HTMLInputElement>("#x").value);
    const y = Number(query<HTMLInputElement>("#y").value);
    const mouth = Number(query<HTMLInputElement>("#mouth").value);
    query<HTMLOutputElement>("#xv").value = x.toFixed(2);
    query<HTMLOutputElement>("#yv").value = y.toFixed(2);
    query<HTMLOutputElement>("#mv").value = mouth.toFixed(2);
    submit(
      setCommand(
        adapter.createId("human"),
        id === "mouth"
          ? { channel: "mouthOpen", value: mouth }
          : { channel: "gaze", x, y },
      ),
      "human",
    );
  });
}

document
  .querySelectorAll<HTMLButtonElement>("[data-action]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      submit(
        actionCommand(
          adapter.createId("human"),
          button.dataset.action as "blink" | "expression" | "motion",
        ),
        "human",
      ),
    ),
  );
query("#reset").addEventListener("click", () =>
  submit(resetCommand(adapter.createId("human")), "human"),
);
query("#script").addEventListener("click", () => {
  const steps = [
    () =>
      submit(
        setCommand(adapter.createId("ai"), {
          channel: "gaze",
          x: -0.7,
          y: 0.3,
        }),
        "ai",
      ),
    () =>
      submit(
        setCommand(adapter.createId("ai"), {
          channel: "mouthOpen",
          value: 0.85,
        }),
        "ai",
      ),
    () => submit(actionCommand(adapter.createId("ai"), "blink"), "ai"),
    () => submit(actionCommand(adapter.createId("ai"), "expression"), "ai"),
    () => submit(actionCommand(adapter.createId("ai"), "motion"), "ai"),
    () => submit(resetCommand(adapter.createId("ai")), "ai"),
  ];
  let index = 0;
  const next = () => {
    steps[index]?.();
    index += 1;
    if (index < steps.length) timer = window.setTimeout(next, 600);
  };
  next();
});

for (const capability of [
  "gaze",
  "blink",
  "mouthOpen",
  "expression",
  "motion",
  "reset",
]) {
  const available = adapter.capabilities().includes(capability as never);
  query("#caps").insertAdjacentHTML(
    "beforeend",
    `<li><span>${capability}</span><strong class="${available ? "yes" : "no"}">${available ? "Available" : "Not authored"}</strong></li>`,
  );
}

const resizeObserver = new ResizeObserver(() => {
  if (!disposed && renderer.state === "ready") renderer.resize(viewport());
});
resizeObserver.observe(query("#stage"));

const dispose = () => {
  if (disposed) return;
  disposed = true;
  if (timer) clearTimeout(timer);
  resizeObserver.disconnect();
  renderer.dispose();
  query("#status").textContent = "Renderer disposed";
};
query("#dispose").addEventListener("click", dispose);
addEventListener("pagehide", dispose);
