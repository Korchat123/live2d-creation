import { categories, initialSelection, parts, partsForCategory, selectPart, selectedParts } from "./model-parts.js";
import { defaultParameters, parameterContract, setParameter } from "./character-parameters.js";

let activeCategory = "base";
let selection = { ...initialSelection };
let zoom = 1;
let anatomyGender = "all";
let parameters = defaultParameters();

const categoryList = document.querySelector("#category-list");
const partsGrid = document.querySelector("#parts-grid");
const categoryTitle = document.querySelector("#category-title");
const inspectorList = document.querySelector("#inspector-list");
const selectionCount = document.querySelector("#selection-count");
const character = document.querySelector("#character");
const zoomLabel = document.querySelector("#zoom-label");
const genderFilter = document.querySelector("#gender-filter");
const adjustmentPanel = document.querySelector(".adjustment-panel");

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

function renderSelection() {
  const chosen = selectedParts(selection);
  const face = chosen.find((part) => part.category === "base");
  const anatomy = chosen.find((part) => part.category === "anatomy");
  const bust = chosen.find((part) => part.category === "bust");
  const hair = chosen.find((part) => part.category === "hair");
  const eyes = chosen.find((part) => part.category === "eyes");
  const outfit = chosen.find((part) => part.category === "outfit");

  const isFacePreview = ["base", "hair", "eyes"].includes(activeCategory);
  character.className = activeCategory === "preview"
    ? "character final-preview"
    : isFacePreview ? "character face-preview" : "character body-preview";
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
  character.style.setProperty("--head-left", `${anatomy.headFit.left * 100}%`);
  character.style.setProperty("--head-top", `${anatomy.headFit.top * 100}%`);
  character.style.setProperty("--head-composite-width", `${anatomy.headFit.width * 100}%`);

  if (activeCategory === "preview") {
    character.innerHTML = `
      <img class="outfit-layer" src="${outfit.asset}" alt="${outfit.name}">
      <img class="hand-layer" src="${anatomy.handAsset}" alt="">
      <span class="head-composite">
        <img class="face-reference-layer" src="./assets/parts/face-base/anime-neutral-v3.png" alt="">
        <img class="eye-layer" src="${eyes.asset}" alt="">
        <img class="hair-layer" src="${hair.asset}" alt="">
      </span>
    `;
  } else if (["hair", "eyes"].includes(activeCategory)) {
    character.innerHTML = `
      <img class="face-reference-layer" src="./assets/parts/face-base/anime-neutral-v3.png" alt="Anime face base">
      <img class="eye-layer" src="${eyes.asset}" alt="${eyes.name} preview">
      <img class="hair-layer" src="${hair.asset}" alt="${hair.name} preview">
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
  inspectorList.innerHTML = chosen.map((part) => `
    <button class="inspector-row" data-category="${part.category}">
      <span class="mini-swatch has-art" style="--swatch:${part.swatch}"><img src="${part.asset}" alt=""></span>
      <span><small>${part.category}</small><strong>${part.name}</strong></span>
      <span aria-hidden="true">›</span>
    </button>
  `).join("");
  renderParameters();
}

function renderParameters() {
  adjustmentPanel.querySelectorAll("[data-parameter]").forEach((input) => {
    const rule = parameterContract[input.dataset.parameter];
    input.min = rule.min;
    input.max = rule.max;
    input.step = rule.step;
    input.value = parameters[input.dataset.parameter];
  });
  adjustmentPanel.querySelectorAll("[data-output]").forEach((output) => {
    const value = parameters[output.dataset.output];
    output.value = `${Math.round(value * 100)}%`;
  });
}

function render() {
  renderCategories();
  renderParts();
  renderSelection();
}

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
  render();
});

genderFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gender]");
  if (!button) return;
  anatomyGender = button.dataset.gender;
  renderParts();
});

adjustmentPanel.addEventListener("input", (event) => {
  const input = event.target.closest("[data-parameter]");
  if (!input) return;
  parameters = setParameter(parameters, input.dataset.parameter, input.value);
  renderSelection();
});

document.querySelector("#reset-parameters").addEventListener("click", () => {
  parameters = defaultParameters();
  renderSelection();
});

inspectorList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});

document.querySelector("#zoom-in").addEventListener("click", () => {
  zoom = Math.min(1.25, zoom + 0.1);
  renderSelection();
});

document.querySelector("#zoom-out").addEventListener("click", () => {
  zoom = Math.max(0.75, zoom - 0.1);
  renderSelection();
});

document.querySelector("#reset-view").addEventListener("click", () => {
  zoom = 1;
  renderSelection();
});

document.querySelector("#save-draft").addEventListener("click", (event) => {
  event.currentTarget.textContent = "Draft saved";
  window.setTimeout(() => { event.currentTarget.textContent = "Save draft"; }, 1400);
});

render();
