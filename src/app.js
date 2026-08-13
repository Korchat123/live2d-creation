import { categories, initialSelection, parts, partsForCategory, selectPart, selectedParts } from "./model-parts.js";
import { defaultParameters, parameterContract, setParameter } from "./character-parameters.js";
import { composeHairLayers, defaultHairMix, hairAddons, hairMixerStyles, normalizeHairMix } from "./hair-mixer.js";
import { defaultEyeMix, eyeColorChannels, eyeMaskPath, normalizeEyeMix } from "./eye-mixer.js";
import { Live2DCanvasEngine } from "./live2d-canvas.js";

const requestedCategory = new URLSearchParams(window.location.search).get("category");
let activeCategory = categories.some((category) => category.id === requestedCategory && category.ready) ? requestedCategory : "base";
let selection = { ...initialSelection };
let zoom = 1;
let anatomyGender = "all";
let parameters = defaultParameters();
let hairMix = defaultHairMix();
let eyeMix = defaultEyeMix();
let renderSequence = 0;

// Character Presets
const presets = {
  idol: {
    base: "base-idol-balanced-androgynous",
    anatomy: "anatomy-idol-balanced-androgynous",
    bust: "bust-idol-balanced",
    hair: "hair-long-straight",
    eyes: "eyes-classic-blue",
    mouth: "mouth-gentle-smile",
    outfit: "outfit-academy-blazer"
  },
  heroine: {
    base: "base-shonen-athletic-male",
    anatomy: "anatomy-shonen-athletic-male",
    bust: "bust-shonen-athletic",
    hair: "hair-messy-ahoge",
    eyes: "eyes-sharp-red",
    mouth: "mouth-small-open",
    outfit: "outfit-sporty-jacket"
  },
  gothic: {
    base: "base-josei-elegant-female",
    anatomy: "anatomy-josei-elegant-female",
    bust: "bust-josei-elegant",
    hair: "hair-twin-tails",
    eyes: "eyes-sleepy-violet",
    mouth: "mouth-neutral-closed",
    outfit: "outfit-gothic-dress"
  },
  cyber: {
    base: "base-fantasy-elfin-androgynous",
    anatomy: "anatomy-fantasy-elfin-androgynous",
    bust: "bust-fantasy-elfin",
    hair: "hair-wolf-cut",
    eyes: "eyes-heterochromia",
    mouth: "mouth-teeth-smile",
    outfit: "outfit-cyber-street"
  }
};

// DOM Elements
const categoryList = document.querySelector("#category-list");
const partsGrid = document.querySelector("#parts-grid");
const categoryTitle = document.querySelector("#category-title");
const collectionHint = document.querySelector("#collection-hint");
const partsSearch = document.querySelector("#parts-search");
const inspectorList = document.querySelector("#inspector-list");
const selectionCount = document.querySelector("#selection-count");
const character = document.querySelector("#character");
const zoomLabel = document.querySelector("#zoom-label");
const genderFilter = document.querySelector("#gender-filter");
const inspector = document.querySelector(".inspector");
const inspectorTitle = document.querySelector("#inspector-title");
const inspectorDescription = document.querySelector("#inspector-description");
const contextControls = document.querySelector("#context-controls");
const canvasElement = document.querySelector("#live2d-stage");
const presetFileInput = document.querySelector("#preset-file-input");

// Initialize Live2D Canvas Engine
let engine = null;
if (canvasElement) {
  engine = new Live2DCanvasEngine(canvasElement);
}

function renderCategories() {
  categoryList.innerHTML = categories.map((category) => `
    <button class="category-button ${category.id === activeCategory ? "is-active" : ""} ${category.ready ? "" : "is-disabled"}"
      data-category="${category.id}" aria-pressed="${category.id === activeCategory}" ${category.ready ? "" : "disabled"}>
      <span class="category-icon" aria-hidden="true">${category.icon}</span>
      <span>${category.label}</span>
      ${category.ready ? "" : '<small>Next</small>'}
    </button>
  `).join("");
}

function renderParts() {
  const category = categories.find((item) => item.id === activeCategory);
  categoryTitle.textContent = category.label;
  collectionHint.textContent = activeCategory === "preview" ? "Assembled" : "Choose one";
  partsSearch.hidden = activeCategory === "preview";
  genderFilter.hidden = !["base", "anatomy"].includes(activeCategory);
  genderFilter.querySelectorAll("[data-gender]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.gender === anatomyGender);
  });
  if (activeCategory === "preview") {
    partsGrid.innerHTML = '<p class="preview-help">This view assembles the current body, bust, outfit, face, eyes, and hair selections.</p>';
    return;
  }
  partsGrid.innerHTML = partsForCategory(activeCategory, anatomyGender).map((part) => `
    <button class="part-card ${selection[activeCategory] === part.id ? "is-selected" : ""}"
      data-part="${part.id}" aria-pressed="${selection[activeCategory] === part.id}">
      <span class="part-thumb ${part.asset ? "has-art" : ""}" style="--swatch:${part.swatch}">
        ${part.asset ? `<img src="${part.asset}" alt="" loading="eager">` : `<span class="part-glyph">${category.icon}</span>`}
      </span>
      <span class="part-copy"><strong>${part.name}</strong><small>${part.detail}</small></span>
      <span class="check" aria-hidden="true">✓</span>
    </button>
  `).join("");
}

function hairMixerMarkup() {
  return `
    <section class="hair-mixer" id="hair-mixer" aria-label="Hair layer mixer">
      <div class="hair-mixer-heading"><strong>Mix small parts</strong><button type="button" data-hair-reset>Reset</button></div>
      <label>Back hair<select data-hair-style="backStyle">${hairMixerStyles.map((style) => `<option value="${style.id}" ${style.id === hairMix.backStyle ? "selected" : ""}>${style.name}</option>`).join("")}</select></label>
      <label>Front hair<select data-hair-style="frontStyle">${hairMixerStyles.map((style) => `<option value="${style.id}" ${style.id === hairMix.frontStyle ? "selected" : ""}>${style.name}</option>`).join("")}</select></label>
      <label class="hair-color">Hair color<input type="color" data-hair-color value="${hairMix.color}"><output>${hairMix.color}</output></label>
      <fieldset><legend>Add-ons (combine any)</legend><div class="addon-grid">
        ${hairAddons.map((addon) => `<label><input type="checkbox" data-hair-addon="${addon.id}" ${hairMix.addons.includes(addon.id) ? "checked" : ""}>${addon.name}</label>`).join("")}
      </div></fieldset>
    </section>
  `;
}

function hairLayerMarkup(paths, className) {
  return paths.map((path) => `<span class="hair-piece ${className} ${path.endsWith("/source/source.png") ? "is-scalp-shell" : ""}" style="--hair-mask:url('${path}')"><img src="${path}" alt=""><span aria-hidden="true"></span></span>`).join("");
}

function eyeMixerMarkup() {
  return `
    <section class="hair-mixer eye-mixer" id="eye-mixer" aria-label="Eye color mixer">
      <div class="hair-mixer-heading"><strong>Eye colors</strong><button type="button" data-eye-reset>Reset</button></div>
      ${eyeColorChannels.map((channel) => `<label>${channel.name}<input type="color" data-eye-color="${channel.id}" value="${eyeMix[channel.id]}"><output>${eyeMix[channel.id]}</output></label>`).join("")}
    </section>
  `;
}

function eyeColorMarkup(style) {
  return eyeColorChannels.map((channel) => `<span class="eye-tint is-${channel.id}" style="--eye-mask:url('${eyeMaskPath(style, channel.id)}');--eye-tint:${eyeMix[channel.id]}" aria-hidden="true"></span>`).join("");
}

const parameterLabels = {
  faceScale: "Overall size", headWidth: "Head width", jawWidth: "Jaw width", jawLength: "Jaw length",
  bustSize: "Volume", bustSpacing: "Spacing", bustHeight: "Height",
  mouthWidth: "Mouth width", mouthHeight: "Mouth height", mouthY: "Vertical position",
  eyeScale: "Eye size", eyeY: "Vertical position",
  previewHeadScale: "Head size", previewHeadWidth: "Head width", previewHandScale: "Hand size"
};

function parameterPanelMarkup(title, names, resetGroup) {
  return `<section class="adjustment-panel">
    <div class="adjustment-heading"><h3>${title}</h3><button type="button" data-reset-parameters="${resetGroup}">Reset</button></div>
    <fieldset>${names.map((name) => `<label>${parameterLabels[name]} <output data-output="${name}">100%</output><input type="range" data-parameter="${name}"></label>`).join("")}</fieldset>
    <p>Controls stay inside the art-safe range.</p>
  </section>`;
}

function selectedDetailMarkup(part, note) {
  return `<div class="selected-detail"><img src="${part.asset}" alt=""><div><small>Selected ${part.category}</small><strong>${part.name}</strong><p>${part.detail}</p></div></div><p class="context-note">${note}</p>`;
}

function renderInspector(chosen) {
  const activePart = chosen.find((part) => part.category === activeCategory);
  const [title, description] = {
    preview: ["Final preview", "Review all currently selected and adjusted layers."],
    base: ["Face adjustments", "Change head and jaw proportions for the selected face."],
    anatomy: ["Anatomy details", "Review the selected body style and gender registration."],
    bust: ["Bust adjustments", "Adjust the independent covered bust layers."],
    hair: ["Hair adjustments", "Mix small hair parts and apply one unified color."],
    eyes: ["Eye adjustments", "Choose an eye type on the left, then change each color channel here."],
    mouth: ["Mouth adjustments", "Choose an expression on the left, then fine-tune its safe face registration."],
    outfit: ["Outfit details", "Review the selected registered clothing layer."]
  }[activeCategory];
  inspectorTitle.textContent = title;
  inspectorDescription.textContent = description;

  if (activeCategory === "base") contextControls.innerHTML = parameterPanelMarkup("Face shape", ["faceScale", "headWidth", "jawWidth", "jawLength"], "base");
  else if (activeCategory === "bust") contextControls.innerHTML = parameterPanelMarkup("Covered bust", ["bustSize", "bustSpacing", "bustHeight"], "bust");
  else if (activeCategory === "hair") contextControls.innerHTML = hairMixerMarkup();
  else if (activeCategory === "eyes") contextControls.innerHTML = `${eyeMixerMarkup()}${parameterPanelMarkup("Eye fit", ["eyeScale", "eyeY"], "eyes")}`;
  else if (activeCategory === "mouth") contextControls.innerHTML = parameterPanelMarkup("Mouth fit", ["mouthWidth", "mouthHeight", "mouthY"], "mouth");
  else if (activeCategory === "anatomy") contextControls.innerHTML = selectedDetailMarkup(activePart, `${activePart.gender} · ${activePart.style}. Choose another registered body on the left.`);
  else if (activeCategory === "outfit") contextControls.innerHTML = selectedDetailMarkup(activePart, "Uses standard T-pose / natural alignment registration.");
  else contextControls.innerHTML = `
    ${parameterPanelMarkup("Anime proportions", ["previewHeadScale", "previewHeadWidth", "previewHandScale"], "preview")}
    <div class="readiness-card"><strong>60 FPS Live2D Physics Engine</strong><span>Interactive Animation</span><p>Live gaze mouse tracking, auto-blinking, breathing cycle, head 2.5D tilt, and anime face blush active.</p></div>
    <div class="preview-summary">${chosen.map((part) => `<span><small>${part.category}</small><strong>${part.name}</strong></span>`).join("")}</div>
  `;

  inspectorList.innerHTML = chosen.map((part) => `<button class="inspector-row ${part.category === activeCategory ? "is-active" : ""}" data-category="${part.category}"><span class="mini-swatch has-art" style="--swatch:${part.swatch}"><img src="${part.asset}" alt=""></span><span><small>${part.category}</small><strong>${part.name}</strong></span><span aria-hidden="true">›</span></button>`).join("");
  renderParameters();
}

function renderSelection() {
  const currentRender = ++renderSequence;
  const chosen = selectedParts(selection);
  const face = chosen.find((part) => part.category === "base");
  const anatomy = chosen.find((part) => part.category === "anatomy");
  const bust = chosen.find((part) => part.category === "bust");
  const hair = chosen.find((part) => part.category === "hair");
  const eyes = chosen.find((part) => part.category === "eyes");
  const mouth = chosen.find((part) => part.category === "mouth");
  const outfit = chosen.find((part) => part.category === "outfit");
  const hairLayers = composeHairLayers(hairMix);

  const chosenMap = { base: face, anatomy, bust, hair, eyes, mouth, outfit };

  // Update Live2D Canvas Engine
  if (engine) {
    engine.updateData(chosenMap, parameters, hairMix, eyeMix);
  }

  // Update DOM Fallback view
  const isFacePreview = ["base", "hair", "eyes", "mouth"].includes(activeCategory);
  character.className = `${activeCategory === "preview"
    ? "character final-preview"
    : isFacePreview ? "character face-preview" : "character body-preview"} category-${activeCategory} is-loading`;
  character.style.setProperty("--zoom", zoom);
  character.style.setProperty("--face-scale", parameters.faceScale);
  character.style.setProperty("--head-width", parameters.headWidth);
  character.style.setProperty("--jaw-width", parameters.jawWidth);
  character.style.setProperty("--jaw-length", parameters.jawLength);
  character.style.setProperty("--bust-size", parameters.bustSize);
  character.style.setProperty("--bust-anchor-y", `${bust.anchorY * 100}%`);
  character.style.setProperty("--bust-shift-y", `${parameters.bustHeight * 100}%`);
  const spacingShift = (parameters.bustSpacing - 1) * 45;
  character.style.setProperty("--bust-left-shift", `${-spacingShift}%`);
  character.style.setProperty("--bust-right-shift", `${spacingShift}%`);
  character.style.setProperty("--hair-fit-scale", hair.fitScale);
  character.style.setProperty("--hair-color", hairMix.color);
  character.style.setProperty("--mouth-width", parameters.mouthWidth);
  character.style.setProperty("--mouth-height", parameters.mouthHeight);
  character.style.setProperty("--mouth-shift-y", `${parameters.mouthY * 100}%`);
  character.style.setProperty("--eye-scale", parameters.eyeScale);
  character.style.setProperty("--eye-shift-y", `${parameters.eyeY * 100}%`);
  character.style.setProperty("--preview-head-scale", parameters.previewHeadScale);
  character.style.setProperty("--preview-head-width", parameters.previewHeadWidth);
  character.style.setProperty("--preview-hand-scale", parameters.previewHandScale);
  character.style.setProperty("--hand-left-anchor-x", `${anatomy.handAnchors.leftX * 100}%`);
  character.style.setProperty("--hand-right-anchor-x", `${anatomy.handAnchors.rightX * 100}%`);
  character.style.setProperty("--hand-anchor-y", `${anatomy.handAnchors.y * 100}%`);
  character.style.setProperty("--head-left", `${face.headFit.left * 100}%`);
  character.style.setProperty("--head-top", `${face.headFit.top * 100}%`);
  character.style.setProperty("--head-composite-width", `${face.headFit.width * 100}%`);
  character.style.setProperty("--head-composite-height", `${face.headFit.height * 100}%`);
  character.style.setProperty("--face-part-left", `${face.faceFit.left * 100}%`);
  character.style.setProperty("--face-part-top", `${face.faceFit.top * 100}%`);
  character.style.setProperty("--face-part-width", `${face.faceFit.width * 100}%`);
  character.style.setProperty("--face-part-height", `${face.faceFit.height * 100}%`);
  const faceBottom = face.faceFit.top + face.faceFit.height;
  const headOriginY = (faceBottom - face.headFit.top) / face.headFit.height * 100;
  character.style.setProperty("--head-origin-y", `${headOriginY}%`);

  if (activeCategory === "preview") {
    character.innerHTML = `
      <span class="head-composite is-back">
        ${hairLayerMarkup(hairLayers.back, "is-back")}
      </span>
      <img class="outfit-layer" src="${outfit.asset}" alt="${outfit.name}">
      <img class="hand-layer is-left" src="${anatomy.handAsset}" alt="">
      <img class="hand-layer is-right" src="${anatomy.handAsset}" alt="">
      <img class="selected-face-layer" src="${face.asset}" alt="${face.name}">
      <span class="head-composite is-front">
        <img class="eye-layer" src="${eyes.asset}" alt="">
        ${eyeColorMarkup(eyes.style)}
        <img class="mouth-layer" src="${mouth.asset}" alt="">
        ${hairLayerMarkup(hairLayers.front, "is-front")}
      </span>
    `;
  } else if (activeCategory === "hair") {
    character.innerHTML = `
      ${hairLayerMarkup(hairLayers.back, "is-back")}
      <img class="face-reference-layer" src="./assets/parts/face-base/anime-neutral-v3.png" alt="Anime face base">
      <img class="eye-layer" src="${eyes.asset}" alt="${eyes.name} preview">
      ${eyeColorMarkup(eyes.style)}
      <img class="mouth-layer" src="${mouth.asset}" alt="${mouth.name} preview">
      ${hairLayerMarkup(hairLayers.front, "is-front")}
    `;
  } else if (activeCategory === "eyes") {
    character.innerHTML = `
      <img class="face-reference-layer" src="./assets/parts/face-base/anime-neutral-v3.png" alt="Anime face base">
      <img class="eye-layer" src="${eyes.asset}" alt="${eyes.name} preview">
      ${eyeColorMarkup(eyes.style)}
      <img class="mouth-layer" src="${mouth.asset}" alt="${mouth.name} preview">
    `;
  } else if (activeCategory === "mouth") {
    character.innerHTML = `
      <img class="face-reference-layer" src="./assets/parts/face-base/anime-neutral-v3.png" alt="Anime face base">
      <img class="eye-layer" src="${eyes.asset}" alt="${eyes.name} preview">
      ${eyeColorMarkup(eyes.style)}
      <img class="mouth-layer" src="${mouth.asset}" alt="${mouth.name} preview">
    `;
  } else if (activeCategory === "base") {
    character.innerHTML = `
      <img class="face-layer is-upper" src="${face.asset}" alt="${face.name} upper head preview">
      <img class="face-layer is-jaw" src="${face.asset}" alt="${face.name} adjustable jaw preview">
    `;
  } else {
    character.innerHTML = `
      ${activeCategory === "outfit" ? `
        <img class="outfit-layer" src="${outfit.asset}" alt="${outfit.name} preview">
        <img class="hand-layer" src="${anatomy.handAsset}" alt="">
      ` : `
        <img class="body-layer" src="${anatomy.asset}" alt="${anatomy.name} body preview">
        <img class="bust-layer is-left" src="${bust.leftAsset}" alt="">
        <img class="bust-layer is-right" src="${bust.rightAsset}" alt="">
      `}
    `;
  }

  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  selectionCount.textContent = `${chosen.length} parts selected`;
  renderInspector(chosen);

  const images = [...character.querySelectorAll("img")];
  Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  }))).then(() => {
    if (currentRender === renderSequence) character.classList.remove("is-loading");
  });
}

function renderParameters() {
  contextControls.querySelectorAll("[data-parameter]").forEach((input) => {
    const rule = parameterContract[input.dataset.parameter];
    input.min = rule.min;
    input.max = rule.max;
    input.step = rule.step;
    input.value = parameters[input.dataset.parameter];
  });
  contextControls.querySelectorAll("[data-output]").forEach((output) => {
    const value = parameters[output.dataset.output];
    output.value = `${Math.round(value * 100)}%`;
  });
}

function render() {
  renderCategories();
  renderParts();
  renderSelection();
}

// Event Listeners: Categories & Parts Selection
categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});

partsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-part]");
  if (!button) return;
  const part = parts.find((candidate) => candidate.id === button.dataset.part);
  selection = selectPart(selection, part);
  if (part.category === "hair") {
    hairMix = normalizeHairMix({ ...hairMix, backStyle: part.style, frontStyle: part.style });
  }
  render();
});

inspector.addEventListener("change", (event) => {
  if (event.target.matches("[data-hair-style]")) {
    hairMix = normalizeHairMix({ ...hairMix, [event.target.dataset.hairStyle]: event.target.value });
  } else if (event.target.matches("[data-hair-addon]")) {
    const addons = new Set(hairMix.addons);
    event.target.checked ? addons.add(event.target.dataset.hairAddon) : addons.delete(event.target.dataset.hairAddon);
    hairMix = normalizeHairMix({ ...hairMix, addons: [...addons] });
  } else if (event.target.matches("[data-hair-color]")) {
    hairMix = normalizeHairMix({ ...hairMix, color: event.target.value });
  } else if (event.target.matches("[data-eye-color]")) {
    eyeMix = normalizeEyeMix({ ...eyeMix, [event.target.dataset.eyeColor]: event.target.value });
  } else {
    return;
  }
  renderSelection();
});

inspector.addEventListener("click", (event) => {
  if (event.target.matches("[data-hair-reset]")) hairMix = defaultHairMix();
  else if (event.target.matches("[data-eye-reset]")) eyeMix = defaultEyeMix();
  else return;
  renderSelection();
});

genderFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gender]");
  if (!button) return;
  anatomyGender = button.dataset.gender;
  renderParts();
});

contextControls.addEventListener("change", (event) => {
  const input = event.target.closest("[data-parameter]");
  if (!input) return;
  parameters = setParameter(parameters, input.dataset.parameter, input.value);
  renderSelection();
});

contextControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reset-parameters]");
  if (!button) return;
  const defaults = defaultParameters();
  const names = button.dataset.resetParameters === "base"
    ? ["faceScale", "headWidth", "jawWidth", "jawLength"]
    : button.dataset.resetParameters === "mouth"
      ? ["mouthWidth", "mouthHeight", "mouthY"]
      : button.dataset.resetParameters === "eyes"
        ? ["eyeScale", "eyeY"]
        : button.dataset.resetParameters === "preview"
          ? ["previewHeadScale", "previewHeadWidth", "previewHandScale"]
          : ["bustSize", "bustSpacing", "bustHeight"];
  parameters = { ...parameters, ...Object.fromEntries(names.map((name) => [name, defaults[name]])) };
  renderSelection();
});

inspectorList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});

// Preset Buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    if (presets[key]) {
      selection = { ...presets[key] };
      render();
    }
  });
});

// Live Animation Controls Toolbar
const toggleAnimBtn = document.querySelector("#toggle-anim");
const toggleGazeBtn = document.querySelector("#toggle-gaze");
const togglePoseBtn = document.querySelector("#toggle-pose");
const exprSelect = document.querySelector("#expr-select");
const bgSelect = document.querySelector("#bg-select");

if (toggleAnimBtn) {
  toggleAnimBtn.addEventListener("click", () => {
    const active = toggleAnimBtn.classList.toggle("is-active");
    if (engine) engine.toggleAnimation(active);
  });
}

if (toggleGazeBtn) {
  toggleGazeBtn.addEventListener("click", () => {
    const active = toggleGazeBtn.classList.toggle("is-active");
    if (engine) engine.toggleGaze(active);
  });
}

if (togglePoseBtn) {
  togglePoseBtn.addEventListener("click", () => {
    const isNatural = togglePoseBtn.classList.toggle("is-active");
    const pose = isNatural ? "natural" : "t-pose";
    if (engine) engine.setPose(pose);
  });
}

if (exprSelect) {
  exprSelect.addEventListener("change", () => {
    if (engine) engine.setExpression(exprSelect.value);
  });
}

if (bgSelect) {
  bgSelect.addEventListener("change", () => {
    if (engine) engine.setBackdrop(bgSelect.value);
  });
}

// Export Dropdown & File Actions
const exportBtn = document.querySelector("#export-btn");
const exportMenu = document.querySelector("#export-menu");

if (exportBtn && exportMenu) {
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    exportMenu.hidden = !exportMenu.hidden;
  });

  window.addEventListener("click", () => {
    exportMenu.hidden = true;
  });

  exportMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-export]");
    if (!btn) return;
    const action = btn.dataset.export;

    if (action === "png" && engine) {
      const dataUrl = engine.exportPNG();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `live2d-character-${Date.now()}.png`;
      a.click();
    } else if (action === "manifest" && engine) {
      const manifestStr = engine.exportLive2DManifest();
      const blob = new Blob([manifestStr], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `live2d-model-manifest.json`;
      a.click();
    } else if (action === "preset") {
      const presetData = JSON.stringify({ selection, parameters, hairMix, eyeMix }, null, 2);
      const blob = new Blob([presetData], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `character-preset-${Date.now()}.json`;
      a.click();
    }
  });
}

// Save & Load Preset Buttons
document.querySelector("#save-draft").addEventListener("click", (e) => {
  localStorage.setItem("live2d_saved_preset", JSON.stringify({ selection, parameters, hairMix, eyeMix }));
  e.currentTarget.textContent = "Preset Saved! ✓";
  setTimeout(() => { e.currentTarget.textContent = "Save Preset"; }, 1500);
});

document.querySelector("#load-draft").addEventListener("click", () => {
  const saved = localStorage.getItem("live2d_saved_preset");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.selection) selection = data.selection;
      if (data.parameters) parameters = data.parameters;
      if (data.hairMix) hairMix = data.hairMix;
      if (data.eyeMix) eyeMix = data.eyeMix;
      render();
    } catch (err) {
      console.error("Failed to load preset:", err);
    }
  } else if (presetFileInput) {
    presetFileInput.click();
  }
});

if (presetFileInput) {
  presetFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.selection) selection = data.selection;
        if (data.parameters) parameters = data.parameters;
        if (data.hairMix) hairMix = data.hairMix;
        if (data.eyeMix) eyeMix = data.eyeMix;
        render();
      } catch (err) {
        alert("Invalid preset JSON file.");
      }
    };
    reader.readAsText(file);
  });
}

// Stage Zoom Controls
document.querySelector("#zoom-in").addEventListener("click", () => {
  zoom = Math.min(1.3, zoom + 0.1);
  if (canvasElement) canvasElement.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
});

document.querySelector("#zoom-out").addEventListener("click", () => {
  zoom = Math.max(0.7, zoom - 0.1);
  if (canvasElement) canvasElement.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
});

document.querySelector("#reset-view").addEventListener("click", () => {
  zoom = 1;
  if (canvasElement) canvasElement.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
});

render();
