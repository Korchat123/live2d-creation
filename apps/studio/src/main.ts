import portraitUrl from "../../../assets/source/reference-avatar/generated-test-avatar-v1/layers/portrait.png?url";
import { mountLayerLab } from "./authoring.js";
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
      <div class="hero"><div><p class="eyebrow">Local-first avatar authoring</p><h1 id="builder-title">Separate your portrait into a living avatar.</h1><p>Start with one image. Create every starter part, inspect the result of each crop, refine it with a brush, then export or open the separate Motion Lab page.</p></div><img src="${portraitUrl}" alt="Example source portrait for avatar authoring"></div>
      <section id="layer-lab" class="workspace" aria-labelledby="workspace-title">
        <div class="section-heading"><div><p class="eyebrow">Page 1</p><h2 id="workspace-title">Avatar Builder</h2></div><span class="status">Nothing leaves this browser</span></div>
        <div class="workspace-grid">
          <aside class="tool-panel"><label class="file-picker">Choose portrait<input id="source-image" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="note">The example is local. Your upload replaces it only in this browser.</p><p>Active part: <strong id="active-layer">face base</strong></p><div class="layer-buttons" aria-label="Avatar art parts"><button type="button" data-layer="face base" class="selected">Face base</button><button type="button" data-layer="left eye white">L eye white</button><button type="button" data-layer="right eye white">R eye white</button><button type="button" data-layer="left pupil iris">L pupil/iris</button><button type="button" data-layer="right pupil iris">R pupil/iris</button><button type="button" data-layer="left eye highlight">L highlight</button><button type="button" data-layer="right eye highlight">R highlight</button><button type="button" data-layer="left upper eyelid">L upper lid</button><button type="button" data-layer="right upper eyelid">R upper lid</button><button type="button" data-layer="left lower eyelid">L lower lid</button><button type="button" data-layer="right lower eyelid">R lower lid</button><button type="button" data-layer="left eyebrow">L eyebrow</button><button type="button" data-layer="right eyebrow">R eyebrow</button><button type="button" data-layer="mouth closed lips">Closed lips</button><button type="button" data-layer="mouth interior">Mouth interior</button><button type="button" data-layer="teeth">Teeth</button><button type="button" data-layer="tongue">Tongue</button><button type="button" data-layer="neck">Neck</button><button type="button" data-layer="torso">Torso</button><button type="button" data-layer="front hair">Front hair</button><button type="button" data-layer="back hair">Back hair</button><button type="button" data-layer="accessory">Accessory</button><button type="button" data-layer="left hand arm">L hand/arm</button><button type="button" data-layer="right hand arm">R hand/arm</button></div><label>Brush radius <output id="brush-value">24 px</output><input id="brush-size" type="range" min="4" max="80" value="24"></label><div class="buttons"><button id="brush-add" type="button" class="selected">Add</button><button id="brush-erase" type="button" class="quiet">Erase</button></div><div class="buttons"><button id="undo-selection" type="button" class="quiet" disabled>Undo</button><button id="redo-selection" type="button" class="quiet" disabled>Redo</button><button id="clear-selection" type="button" class="quiet">Clear</button></div></aside>
          <div class="canvas-panel"><div class="canvas-toolbar"><button id="suggest-all-layers" type="button">Create all starter masks</button><button id="suggest-layers" type="button" class="quiet">Suggest this part</button><button id="show-source" type="button" class="quiet">Compare source</button></div><canvas id="layer-canvas" aria-label="Paint a layer mask over the source portrait"></canvas><p class="note">Create all starter masks makes 24 editable suggestions. Paint to add pixels, use Erase to deselect, then review every part.</p><p id="builder-status" class="note" aria-live="polite">Loading example portrait…</p></div>
          <aside class="layer-panel"><h3>Part results</h3><div id="layer-output" class="layer-output-list" aria-live="polite"></div><button id="validate-project" type="button">Validate for Motion Lab</button><button id="open-motion" type="button" class="quiet" disabled>Open Motion Lab page</button><button id="export-project" type="button" class="quiet" disabled>Export project</button></aside>
        </div>
      </section>
    </section>
  </main>
  <div id="announce" class="sr" role="status" aria-live="polite"></div>`;

const lab = document.querySelector<HTMLElement>("#layer-lab");
const openMotion = document.querySelector<HTMLButtonElement>("#open-motion");
if (!lab || !openMotion) throw new Error("Missing authoring controls");

mountLayerLab(lab, portraitUrl);
lab.addEventListener("avatarprojectready", (event) => {
  sessionStorage.setItem(
    "open-avatar-project",
    JSON.stringify((event as CustomEvent).detail),
  );
});
openMotion.addEventListener("click", () => {
  window.location.assign("/motion.html");
});
