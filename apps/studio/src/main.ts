import portraitUrl from "../../../assets/source/reference-avatar/generated-test-avatar-v1/layers/portrait.png?url";
import { mountLayerLab, type ExportedProject } from "./authoring.js";
import {
  parseAutomaticAvatarProject,
  saveAutomaticAvatarProject,
  serializeAutomaticAvatarProject,
} from "./automatic-avatar.js";
import {
  ComfyGenerationProvider,
  mountPromptWorkspace,
  type AcceptedConceptDetail,
} from "./generation-provider.js";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing application root");

root.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/">Open Avatar <span>VTuber Lab</span></a>
    <nav aria-label="Primary"><a class="nav-link selected" href="/">1. Build avatar</a><a class="nav-link" href="/motion.html">2. Motion Lab</a></nav>
  </header>
  <main>
    <section id="builder" class="page active" aria-labelledby="builder-title">
      <div class="hero"><div><p class="eyebrow">Local-first avatar authoring</p><h1 id="builder-title">Prompt once. Get a ready-to-use 2D avatar.</h1><p>Describe the character. Studio generates the design, transparent parts, motion states, and Open Avatar project automatically on this computer.</p></div><img src="${portraitUrl}" alt="Example source portrait for avatar authoring"></div>
      <section id="prompt-workspace" class="prompt-workspace" aria-labelledby="prompt-workspace-title">
        <div>
          <p class="eyebrow">Default workflow</p>
          <h2 id="prompt-workspace-title">Generate your avatar</h2>
          <p>One generation can take several minutes because every motion part is created and checked locally.</p>
        </div>
        <div class="prompt-controls">
          <label>Character description<textarea id="character-prompt" rows="5" maxlength="16384" placeholder="Original anime librarian with shoulder-length blue hair, round glasses, navy jacket, warm expression, neutral front pose"></textarea></label>
          <label hidden>Approved local checkpoint<select id="concept-checkpoint"><option value="">Check local ComfyUI first</option></select></label>
          <details class="prompt-plan" hidden><summary>Review interpreted generation request</summary><dl id="concept-prompt-plan"><div><dt>Identity</dt><dd>Enter a character description.</dd></div></dl></details>
          <div class="buttons"><button id="check-generation" type="button" hidden>Check local ComfyUI</button><button id="generate-concept" type="button" disabled>Generate Live2D avatar</button><button id="cancel-generation" type="button" class="quiet" disabled>Cancel</button></div>
          <p id="generation-status" class="note" aria-live="polite">Checking the local generation provider…</p>
        </div>
        <figure class="concept-candidate">
          <div class="concept-image-stage"><img id="concept-output" alt="Generated character concept candidate" hidden><div id="landmark-overlay" aria-hidden="true"></div></div>
          <figcaption><span id="concept-provenance">No candidate generated.</span></figcaption>
          <div id="concept-variants" class="concept-variants" aria-label="Generated concept candidates" hidden></div>
          <button id="accept-concept" type="button" disabled hidden>Accept design</button>
        </figure>
      </section>
      <section id="project-review" class="project-review" aria-labelledby="project-review-title" hidden>
        <div class="section-heading"><div><p class="eyebrow">Phase P2</p><h2 id="project-review-title">Lock the character bible</h2></div><span class="status">Private draft</span></div>
        <div class="project-review-grid">
          <form id="character-bible-form" class="character-bible">
            <label>Character name<input name="displayName" maxlength="120" required></label>
            <label>Visual style<textarea name="style" rows="3" maxlength="1000" required placeholder="Clean anime line art, soft cel shading…"></textarea></label>
            <label>Palette<textarea name="palette" rows="2" maxlength="1000" required placeholder="Navy, muted blue, warm skin…"></textarea></label>
            <label>Outfit rules<textarea name="outfit" rows="3" maxlength="1000" required></textarea></label>
            <label>Identity-locked features<textarea name="identityNotes" rows="4" maxlength="2000" required placeholder="Face shape, eye shape, hairline, proportions, features that must not drift…"></textarea></label>
          </form>
          <section class="landmark-review" aria-labelledby="landmark-title"><h3 id="landmark-title">Canonical landmarks</h3><p>Mark in order: left eye, right eye, nose, mouth center, chin, then neck joint. Keyboard users can enter normalized X/Y values below.</p><div class="buttons"><button id="mark-landmarks" type="button">Mark landmarks</button><button id="clear-landmarks" type="button" class="quiet">Clear</button></div><p id="landmark-status" class="note" aria-live="polite">0/6 landmarks marked.</p><div id="landmark-values" class="landmark-values"></div></section>
          <section class="part-plan-review" aria-labelledby="part-plan-title"><h3 id="part-plan-title">Part plan</h3><p class="note">Required parts are locked. Enable optional parts only when the design needs them.</p><div id="project-part-plan" class="project-part-plan"></div></section>
        </div>
        <div class="project-actions"><button id="save-authoring-project" type="button">Save project file</button><label class="file-picker">Load project file<input id="load-authoring-project" type="file" accept="application/json,.json"></label><p id="project-review-status" class="note" aria-live="polite">Accept a design to begin.</p></div>
      </section>
      <section id="layer-lab" class="workspace" aria-labelledby="workspace-title" hidden>
        <div class="section-heading"><div><p class="eyebrow">Legacy and correction tools</p><h2 id="workspace-title">Portrait Layer Lab</h2></div><span class="status">Local computer only</span></div>
        <div class="workspace-grid">
          <aside class="tool-panel"><label class="file-picker">Choose portrait<input id="source-image" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="note">The example is local. Your upload replaces it only in this browser.</p><section class="eye-guide" aria-labelledby="eye-guide-title"><h3 id="eye-guide-title">Exact eye guides</h3><p class="note">For each eye click: outer corner, inner corner, top lid, lower lid. This gives the crop its actual portrait shape.</p><div class="buttons"><button id="guide-left-eye" type="button">Guide left eye</button><button id="guide-right-eye" type="button">Guide right eye</button></div><button id="create-guided-eyes" type="button">Create guided eye layers</button><button id="clear-eye-guides" type="button" class="quiet">Clear guides</button><p id="eye-guide-status" class="note" aria-live="polite">No eye guides set.</p></section><section class="eye-guide" aria-labelledby="repair-title"><h3 id="repair-title">Local missing-art repair</h3><p class="note">Uses your current layer mask and local ComfyUI. Generated art is a draft—compare it with the portrait.</p><label>Repair instruction<textarea id="repair-prompt" rows="3" placeholder="Complete the hidden lower eyelid with matching skin and line art."></textarea></label><button id="generate-repair" type="button">Generate selected part</button><p id="repair-status" class="note" aria-live="polite">ComfyUI is used only through this computer.</p><img id="repair-output" class="repair-output" alt="Local ComfyUI generated repair" hidden></section><p>Active part: <strong id="active-layer">face base</strong></p><div class="layer-buttons" aria-label="Avatar art parts"><button type="button" data-layer="face base" class="selected">Face base</button><button type="button" data-layer="left eye white">L eye white</button><button type="button" data-layer="right eye white">R eye white</button><button type="button" data-layer="left pupil iris">L pupil/iris</button><button type="button" data-layer="right pupil iris">R pupil/iris</button><button type="button" data-layer="left eye highlight">L highlight</button><button type="button" data-layer="right eye highlight">R highlight</button><button type="button" data-layer="left upper eyelid">L upper lid</button><button type="button" data-layer="right upper eyelid">R upper lid</button><button type="button" data-layer="left lower eyelid">L lower lid</button><button type="button" data-layer="right lower eyelid">R lower lid</button><button type="button" data-layer="left eyebrow">L eyebrow</button><button type="button" data-layer="right eyebrow">R eyebrow</button><button type="button" data-layer="mouth closed lips">Closed lips</button><button type="button" data-layer="mouth interior">Mouth interior</button><button type="button" data-layer="teeth">Teeth</button><button type="button" data-layer="tongue">Tongue</button><button type="button" data-layer="neck">Neck</button><button type="button" data-layer="torso">Torso</button><button type="button" data-layer="front hair">Front hair</button><button type="button" data-layer="back hair">Back hair</button><button type="button" data-layer="accessory">Accessory</button><button type="button" data-layer="left hand arm">L hand/arm</button><button type="button" data-layer="right hand arm">R hand/arm</button></div><label>Brush radius <output id="brush-value">24 px</output><input id="brush-size" type="range" min="4" max="80" value="24"></label><div class="buttons"><button id="brush-add" type="button" class="selected">Add</button><button id="brush-erase" type="button" class="quiet">Erase</button></div><div class="buttons"><button id="undo-selection" type="button" class="quiet" disabled>Undo</button><button id="redo-selection" type="button" class="quiet" disabled>Redo</button><button id="clear-selection" type="button" class="quiet">Clear</button></div></aside>
          <div class="canvas-panel"><div class="canvas-toolbar"><button id="suggest-all-layers" type="button">Suggest all parts</button><button id="suggest-layers" type="button" class="quiet">Suggest this part</button><button id="show-source" type="button" class="quiet">Compare source</button></div><div class="canvas-viewport"><canvas id="layer-canvas" aria-label="Paint a layer mask over the source portrait"></canvas></div><p class="note">Ctrl/Cmd + mouse wheel zooms. Right-click erases marks. Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo, B add brush, E erase brush.</p><p id="builder-status" class="note" aria-live="polite">Loading example portrait…</p></div>
          <aside class="layer-panel"><h3>Part results</h3><div id="layer-output" class="layer-output-list" aria-live="polite"></div><button id="validate-project" type="button">Validate for Motion Lab</button><button id="open-motion" type="button" class="quiet" disabled>Open Motion Lab page</button><button id="export-project" type="button" class="quiet" disabled>Export project</button></aside>
        </div>
      </section>
    </section>
  </main>
  <div id="announce" class="sr" role="status" aria-live="polite"></div>`;

const arrangeAuthoringPanels = (): void => {
  const rail = document.querySelector<HTMLElement>(".tool-panel");
  const imagePicker = document
    .querySelector<HTMLInputElement>("#source-image")
    ?.closest("label");
  const sourceNote = imagePicker?.nextElementSibling;
  const activePart = document
    .querySelector<HTMLElement>("#active-layer")
    ?.closest("p");
  const parts = document.querySelector<HTMLElement>(".layer-buttons");
  const guides = document.querySelector<HTMLElement>(
    ".eye-guide[aria-labelledby='eye-guide-title']",
  );
  const repair = document.querySelector<HTMLElement>(
    ".eye-guide[aria-labelledby='repair-title']",
  );
  const brushSize = document
    .querySelector<HTMLInputElement>("#brush-size")
    ?.closest("label");
  const addErase = document
    .querySelector<HTMLElement>("#brush-add")
    ?.closest(".buttons");
  const history = document
    .querySelector<HTMLElement>("#undo-selection")
    ?.closest(".buttons");
  if (
    !rail ||
    !imagePicker ||
    !sourceNote ||
    !activePart ||
    !parts ||
    !guides ||
    !repair ||
    !brushSize ||
    !addErase ||
    !history
  )
    return;
  const panel = (title: string, className: string): HTMLElement => {
    const section = document.createElement("section");
    section.className = `control-panel ${className}`;
    const heading = document.createElement("h3");
    heading.textContent = title;
    section.append(heading);
    return section;
  };
  const source = panel("1. Portrait", "source-panel");
  source.append(imagePicker, sourceNote);
  const tools = panel("3. Precision tools", "shape-tools-panel");
  tools.append(activePart, guides);
  const completion = panel("4. Complete this part", "completion-panel");
  const expressions = panel(
    "5. Expression artwork for Motion Lab",
    "expression-panel",
  );
  expressions.innerHTML += `<p class="note">Create local ComfyUI comparison states from the masks you have reviewed. The source portrait is never replaced.</p><div class="buttons"><button id="expression-open-mouth" type="button">Open mouth</button><button id="expression-blink" type="button" class="quiet">Blink</button><button id="expression-left-wink" type="button" class="quiet">Left wink</button><button id="expression-right-wink" type="button" class="quiet">Right wink</button></div><p id="expression-status" class="note" aria-live="polite">Create an expression after its mouth or eye masks are ready.</p>`;
  const paint = panel("6. Paint selected artwork", "paint-panel");
  const help = document.createElement("p");
  help.className = "note";
  help.textContent =
    "Paint the selected part, erase mistakes, undo/redo, or ask local ComfyUI to draft missing pixels for this exact mask.";
  const applyRepair = document.createElement("button");
  applyRepair.id = "apply-repair";
  applyRepair.type = "button";
  applyRepair.className = "quiet";
  applyRepair.disabled = true;
  applyRepair.textContent = "Apply repair to selected part";
  const paintControls = document.createElement("div");
  paintControls.className = "art-paint-controls";
  paintControls.innerHTML = `<label>Paint color <input id="art-color" type="color" value="#fff9ed"></label><div class="buttons"><button id="paint-art" type="button">Paint artwork</button><button id="paint-mask" type="button" class="quiet">Edit mask</button></div><div class="buttons"><button id="fill-art" type="button" class="quiet">Fill selected part</button><button id="clear-art" type="button" class="quiet">Clear artwork</button></div>`;
  const completeAll = document.createElement("button");
  completeAll.id = "complete-all";
  completeAll.type = "button";
  completeAll.textContent = "Complete all missing parts";
  const makeMotionReady = document.createElement("button");
  makeMotionReady.id = "make-motion-ready";
  makeMotionReady.type = "button";
  makeMotionReady.textContent = "Make motion-ready avatar";
  repair.insertBefore(makeMotionReady, repair.querySelector("#repair-status"));
  repair.insertBefore(completeAll, repair.querySelector("#repair-status"));
  repair.insertBefore(applyRepair, repair.querySelector("#repair-status"));
  paint.append(paintControls, brushSize, addErase, history);
  completion.append(help, repair);
  rail.className = "control-rail";
  rail.replaceChildren(source, tools, completion, expressions, paint);
  const layerPanel = document.querySelector<HTMLElement>(".layer-panel");
  const layerOutput = document.querySelector<HTMLElement>("#layer-output");
  const canvasPanel = document.querySelector<HTMLElement>(".canvas-panel");
  if (layerPanel && layerOutput && canvasPanel) {
    const inspector = document.createElement("section");
    inspector.className = "part-inspector";
    inspector.innerHTML = `<h3>Selected part painter</h3><p id="part-editor-name" class="note">Choose a part to edit it here.</p><canvas id="part-canvas" aria-label="Paint the selected avatar part"></canvas><p class="note">Red is the active mask. Paint adds artwork; Edit mask changes the red selection.</p>`;
    canvasPanel.append(inspector);
    const reviewTitle = document.createElement("h3");
    reviewTitle.textContent = "Layer review — click a part to edit";
    layerPanel.insertBefore(reviewTitle, layerOutput);
    parts.classList.add("bottom-parts-list");
    layerPanel.insertBefore(parts, layerOutput);
  }
};

arrangeAuthoringPanels();

const promptWorkspace =
  document.querySelector<HTMLElement>("#prompt-workspace");
const projectReview = document.querySelector<HTMLElement>("#project-review");
const lab = document.querySelector<HTMLElement>("#layer-lab");
const generate = document.querySelector<HTMLButtonElement>("#generate-concept");
const check = document.querySelector<HTMLButtonElement>("#check-generation");
const accept = document.querySelector<HTMLButtonElement>("#accept-concept");
const variants = document.querySelector<HTMLElement>("#concept-variants");
const plan = document.querySelector<HTMLElement>(".prompt-plan");
const checkpoint = document
  .querySelector<HTMLSelectElement>("#concept-checkpoint")
  ?.closest("label");
if (
  !promptWorkspace ||
  !projectReview ||
  !lab ||
  !generate ||
  !check ||
  !accept ||
  !variants ||
  !plan ||
  !checkpoint
)
  throw new Error("Missing automatic avatar controls");

document.querySelector<HTMLElement>("#builder-title")!.textContent =
  "Prompt once. Get a ready-to-use 2D avatar.";
const heroDescription =
  document.querySelector<HTMLElement>(".hero p:last-child");
if (heroDescription)
  heroDescription.textContent =
    "Describe the character. Studio generates the design, transparent parts, motion states, and Open Avatar project automatically on this computer.";
document.querySelector<HTMLElement>("#prompt-workspace-title")!.textContent =
  "Generate your avatar";
const workspaceDescription = promptWorkspace.querySelector<HTMLElement>(
  ":scope > div:first-child > p:last-child",
);
if (workspaceDescription)
  workspaceDescription.textContent =
    "One generation can take several minutes because every motion part is created and checked locally.";
generate.textContent = "Generate Live2D avatar";
check.hidden = true;
accept.hidden = true;
variants.hidden = true;
plan.hidden = true;
checkpoint.hidden = true;
projectReview.hidden = true;
lab.hidden = true;

const automaticPanel = document.createElement("section");
automaticPanel.id = "automatic-avatar";
automaticPanel.className = "automatic-avatar";
automaticPanel.innerHTML = `
  <div class="section-heading"><div><p class="eyebrow">Automatic build</p><h2>Avatar project</h2></div><span id="automatic-state" class="status">Waiting for prompt</span></div>
  <ol id="automatic-progress" class="automatic-progress" aria-live="polite">
    <li data-stage="concept">Generate character design</li>
    <li data-stage="parts">Generate and extract transparent parts</li>
    <li data-stage="rig">Create blink, mouth, gaze, and motion setup</li>
    <li data-stage="project">Validate and package Open Avatar project</li>
  </ol>
  <p id="automatic-status" class="note" aria-live="polite">Enter a prompt, then choose Generate Live2D avatar.</p>
  <div class="buttons">
    <button id="download-automatic-project" type="button" disabled>Download project</button>
    <button id="open-automatic-motion" type="button" class="quiet" disabled>Open avatar</button>
    <label class="file-picker">Upload generated project<input id="upload-automatic-project" type="file" accept="application/json,.json"></label>
  </div>`;
promptWorkspace.after(automaticPanel);

const automaticState =
  automaticPanel.querySelector<HTMLElement>("#automatic-state")!;
const automaticStatus =
  automaticPanel.querySelector<HTMLElement>("#automatic-status")!;
const downloadProject = automaticPanel.querySelector<HTMLButtonElement>(
  "#download-automatic-project",
)!;
const openAvatar = automaticPanel.querySelector<HTMLButtonElement>(
  "#open-automatic-motion",
)!;
const uploadProject = automaticPanel.querySelector<HTMLInputElement>(
  "#upload-automatic-project",
)!;
const stage = (name: string, state: "active" | "complete" | "error") => {
  const item = automaticPanel.querySelector<HTMLElement>(
    `[data-stage="${name}"]`,
  );
  if (item) item.dataset.state = state;
};
const resetStages = () =>
  automaticPanel
    .querySelectorAll<HTMLElement>("[data-stage]")
    .forEach((item) => delete item.dataset.state);

let activeProject: ExportedProject | undefined;
const labController = mountLayerLab(lab, portraitUrl);
const internalAnnouncement = document.querySelector<HTMLElement>("#announce");
if (internalAnnouncement)
  new MutationObserver(() => {
    if (
      promptWorkspace.dataset.pipelineBusy === "true" &&
      internalAnnouncement.textContent
    )
      automaticStatus.textContent = internalAnnouncement.textContent;
  }).observe(internalAnnouncement, { childList: true, subtree: true });
const makeProjectAvailable = async (
  project: ExportedProject,
): Promise<void> => {
  activeProject = project;
  await saveAutomaticAvatarProject(project);
  downloadProject.disabled = false;
  openAvatar.disabled = false;
};
const download = (): void => {
  if (!activeProject) return;
  const url = URL.createObjectURL(
    new Blob([serializeAutomaticAvatarProject(activeProject)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "generated.open-avatar-project.json";
  link.click();
  URL.revokeObjectURL(url);
};

promptWorkspace.addEventListener("avatarconceptgenerated", (event) => {
  const concept = (event as CustomEvent<AcceptedConceptDetail>).detail;
  void (async () => {
    resetStages();
    downloadProject.disabled = true;
    openAvatar.disabled = true;
    automaticState.textContent = "Building";
    stage("concept", "complete");
    stage("parts", "active");
    automaticStatus.textContent =
      "Generating and extracting transparent layers. Keep ComfyUI open…";
    try {
      await labController.loadSource(concept.image);
      const project = await labController.buildAutomatically();
      stage("parts", "complete");
      stage("rig", "complete");
      stage("project", "complete");
      await makeProjectAvailable(project);
      automaticState.textContent = "Ready";
      automaticStatus.textContent =
        "Avatar ready. Download the project or open it in Motion Lab.";
    } catch (error) {
      const active = automaticPanel.querySelector<HTMLElement>(
        '[data-state="active"]',
      );
      if (active) active.dataset.state = "error";
      automaticState.textContent = "Needs retry";
      automaticStatus.textContent =
        error instanceof Error
          ? error.message
          : "Automatic avatar build failed.";
    } finally {
      delete promptWorkspace.dataset.pipelineBusy;
      generate.disabled = false;
    }
  })();
});

downloadProject.addEventListener("click", download);
openAvatar.addEventListener("click", () =>
  window.location.assign("/motion.html"),
);
uploadProject.addEventListener("change", () => {
  void (async () => {
    const file = uploadProject.files?.[0];
    if (!file) return;
    resetStages();
    automaticState.textContent = "Loading";
    automaticStatus.textContent = "Validating the generated project…";
    try {
      const project = parseAutomaticAvatarProject(await file.text());
      await labController.loadProject(project);
      await makeProjectAvailable(project);
      ["concept", "parts", "rig", "project"].forEach((name) =>
        stage(name, "complete"),
      );
      automaticState.textContent = "Ready";
      automaticStatus.textContent =
        "Generated project loaded. Download it again or open the avatar.";
    } catch (error) {
      automaticState.textContent = "Rejected";
      automaticStatus.textContent =
        error instanceof Error ? error.message : "Could not load the project.";
    } finally {
      uploadProject.value = "";
    }
  })();
});

const approvedCheckpoints = (import.meta.env.VITE_COMFY_CHECKPOINTS ?? "")
  .split(",")
  .map((checkpoint) => checkpoint.trim())
  .filter(Boolean);
const approvedControlNets = (import.meta.env.VITE_COMFY_CONTROLNETS ?? "")
  .split(",")
  .map((controlNet) => controlNet.trim())
  .filter(Boolean);
mountPromptWorkspace(
  promptWorkspace,
  new ComfyGenerationProvider(
    approvedCheckpoints,
    fetch,
    undefined,
    approvedControlNets,
  ),
  { automaticBuild: true },
);
