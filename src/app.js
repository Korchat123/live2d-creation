import { NEGATIVE_FIXTURES, PARAMETER_DEFINITIONS, SPEC_VERSION, buildGeometry, evidenceStates, fixtureGeometry, presetParameters } from "./geometry.js";
import { validateGeometry } from "./validation.js";
import { buildAnatomyPaths, measureRenderedGeometry } from "./anatomy-paths.js";

const controls = document.querySelector("#controls");
const presetSelect = document.querySelector("#preset-select");
const evidenceSelect = document.querySelector("#evidence-select");
const fixtures = document.querySelector("#fixtures");
const overlayToggle = document.querySelector("#overlay-toggle");
const stage = document.querySelector("#stage");
const metrics = document.querySelector("#metrics");
const errors = document.querySelector("#errors");
const status = document.querySelector("#status");
const stateName = document.querySelector("#state-name");
const specVersion = document.querySelector("#spec-version");
const states = evidenceStates();
let currentParameters = presetParameters("neutral");
let currentFixture = null;
let currentStateName = "preset:neutral";

const n = value => Number(value.toFixed(2));
const escapeText = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

// The geometry owns every landmark. This map only chooses a readable evidence
// label subset and its screen-space direction; it never changes anatomy.
const LABEL_LAYOUT = Object.freeze({
  hairTop: [12, -8, "start"],
  skullTop: [12, 10, "start"],
  hairlineCenter: [12, -10, "start"],
  hairlineTempleLeft: [-12, -10, "end"],
  hairlineTempleRight: [12, -10, "start"],
  templeLeft: [-12, 18, "end"],
  templeRight: [12, 18, "start"],
  eyeLeft: [-42, 6, "end"],
  eyeRight: [42, 6, "start"],
  nose: [14, 0, "start"],
  mouth: [14, 4, "start"],
  jawLeft: [-12, -8, "end"],
  jawRight: [12, -8, "start"],
  chin: [14, 16, "start"],
  upperNeckLeft: [-14, -12, "end"],
  upperNeckRight: [14, -12, "start"],
  collarLeft: [-14, 18, "end"],
  collarRight: [14, 18, "start"],
  acromionLeft: [-14, -12, "end"],
  acromionRight: [14, -12, "start"],
  sternum: [14, 18, "start"],
  bustLeft: [-14, -12, "end"],
  bustRight: [14, -12, "start"],
  torso850Left: [12, -10, "start"],
  torso850Right: [-12, -10, "end"]
});

function landmarkMarkup(name, item) {
  const layout = LABEL_LAYOUT[name];
  const label = layout
    ? `<text x="${n(item.x + layout[0])}" y="${n(item.y + layout[1])}" text-anchor="${layout[2]}">${name}</text>`
    : "";
  return `<g class="landmark" data-landmark="${name}"><title>${name} · ${item.parent} · (${item.x}, ${item.y})</title><circle cx="${item.x}" cy="${item.y}" r="5"/>${label}</g>`;
}

function buildControls() {
  controls.innerHTML = Object.entries(PARAMETER_DEFINITIONS).map(([key, definition]) => `
    <label class="control">
      <span class="control-label"><span>${escapeText(definition.label)}</span><output data-output="${key}">${definition.value}</output></span>
      <input data-parameter="${key}" type="range" min="${definition.min}" max="${definition.max}" step="${definition.step}" value="${definition.value}">
      <span class="control-range"><span>${definition.min}</span><span>${definition.max}</span></span>
    </label>`).join("");
}

function buildEvidenceOptions() {
  const presets = states.filter(item => item.id.startsWith("preset:"));
  const bounds = states.filter(item => item.id.startsWith("bound:"));
  const pairs = states.filter(item => item.id.startsWith("pair:"));
  const boundaries = states.filter(item => item.id.startsWith("boundary:"));
  const combined = states.filter(item => item.id.startsWith("combined:"));
  const group = (label, items) => `<optgroup label="${label}">${items.map(item => `<option value="${item.id}"${item.disabled ? " disabled" : ""}>${item.id}</option>`).join("")}</optgroup>`;
  evidenceSelect.innerHTML = group("Manual state", [{ id: "custom:bounded", disabled: true }, { id: "custom:reconciled", disabled: true }]) + group("Presets", presets) + group("Individual bounds", bounds) + group("Pairwise combined extremes", pairs) + group("Safety boundaries", boundaries) + group("Combined bundles", combined);
}

function buildFixtureButtons() {
  fixtures.innerHTML = Object.keys(NEGATIVE_FIXTURES).map(name => `<button class="fixture-button" type="button" data-fixture="${name}">${name.replace(/([A-Z])/g, " $1")}</button>`).join("");
}

function updateControlValues() {
  for (const [key, value] of Object.entries(currentParameters)) {
    const input = controls.querySelector(`[data-parameter="${key}"]`);
    const output = controls.querySelector(`[data-output="${key}"]`);
    if (input) input.value = value;
    if (output) output.value = value;
  }
}

function ellipseMarkup(cx, cy, rx, ry, className, parent, attributes = "") {
  return `<ellipse class="${className}" data-parent="${parent}" cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${attributes}/>`;
}

function renderSvg(geometry) {
  const { landmarks: l, measurements: m } = geometry;
  const anatomy = buildAnatomyPaths(geometry);
  stage.dataset.acromionLeftX = l.acromionLeft.x;
  stage.dataset.acromionRightX = l.acromionRight.x;
  stage.dataset.acromionY = l.acromionLeft.y;
  stage.dataset.specVersion = geometry.specVersion;
  const provenance = item => item.landmarks.join(" ");
  const landmarkEntries = Object.entries(l).filter(([name]) => name !== "torsoCrop");
  const overlay = overlayToggle.checked ? `
    <g class="measurements">
      <path class="chest-field" data-layer="torso-deformation-field" data-parent="${anatomy.chest.parent}" data-landmark-chain="${provenance(anatomy.chest)}" d="${anatomy.chest.d}"/>
      <line x1="500" y1="35" x2="500" y2="970"/>
      <line x1="${l.acromionLeft.x}" y1="${l.acromionLeft.y}" x2="${l.acromionRight.x}" y2="${l.acromionRight.y}"/>
      ${landmarkEntries.map(([name, item]) => landmarkMarkup(name, item)).join("")}
      <text class="canvas-label" x="24" y="34">${geometry.specVersion}</text>
    </g>` : "";
  stage.innerHTML = `
    <style>
      .body, .arm-surface, .deltoid-surface { fill:#ddd6e2; stroke:none }
      .surface-outline { fill:none; stroke:#4d4656; stroke-width:4; stroke-linejoin:round; stroke-linecap:round; vector-effect:non-scaling-stroke }
      .head { fill:#eee8ef; stroke:#4d4656; stroke-width:4; vector-effect:non-scaling-stroke }
      .construction { fill:none; stroke:#8c6fb4; stroke-width:3; stroke-dasharray:10 8; vector-effect:non-scaling-stroke }
      .hair-back { fill:#d8cbe5; fill-opacity:.76; stroke:#6e587e; stroke-width:4; vector-effect:non-scaling-stroke }
      .hair-front { fill:none; stroke:#6e587e; stroke-width:6; stroke-linecap:round; vector-effect:non-scaling-stroke }
      .ear { fill:#ead7df; stroke:#965f79; stroke-width:4; vector-effect:non-scaling-stroke }
      .ear-detail { fill:none; stroke:#a56b83; stroke-width:3; stroke-linecap:round; vector-effect:non-scaling-stroke }
      .chest-volume { fill:url(#torso-volume); stroke:none; pointer-events:none }
      .chest-field { fill:none; stroke:#9b8ba7; stroke-opacity:.7; stroke-width:2; stroke-dasharray:8 8; vector-effect:non-scaling-stroke }
      .anatomy-line { fill:none; stroke:#75687d; stroke-width:2; stroke-linecap:round; vector-effect:non-scaling-stroke }
      .axilla-cue { stroke-width:2.5 }
      @media (max-width:720px) { .axilla-cue { opacity:.42 } }
      .face-mark { fill:#f8f5f8; stroke:#665b70; stroke-width:3; vector-effect:non-scaling-stroke }
      .feature-line { fill:none; stroke:#665b70; stroke-width:4; stroke-linecap:round; vector-effect:non-scaling-stroke }
      .measurements line { stroke:#b48d9c; stroke-width:1.5; stroke-dasharray:5 6; vector-effect:non-scaling-stroke }
      .measurements circle { fill:#9c526e; stroke:#fff; stroke-width:2; vector-effect:non-scaling-stroke }
      .measurements text { fill:#7b4057; font-family:system-ui,sans-serif; font-weight:700; paint-order:stroke; stroke:#f7f3f7; stroke-width:4px; stroke-linejoin:round }
      .measurements .canvas-label { font-size:16px; fill:#665b70 }
    </style>
    <defs>
      <radialGradient id="torso-volume" cx="50%" cy="42%" rx="58%" ry="72%"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".62" stop-color="#bcaec8" stop-opacity=".12"/><stop offset="1" stop-color="#8c789c" stop-opacity="0"/></radialGradient>
      <clipPath id="eye-clip-left"><ellipse cx="${l.eyeLeft.x}" cy="${l.eyeLeft.y}" rx="${m.irisClipRx}" ry="${m.irisClipRy}"/></clipPath>
      <clipPath id="eye-clip-right"><ellipse cx="${l.eyeRight.x}" cy="${l.eyeRight.y}" rx="${m.irisClipRx}" ry="${m.irisClipRy}"/></clipPath>
    </defs>
    <path class="hair-back" data-layer="hair-back" data-parent="${anatomy.hairBack.parent}" data-landmark-chain="${provenance(anatomy.hairBack)}" d="${anatomy.hairBack.d}"/>
    <g data-layer="upper-arms">
      <path class="arm-surface" data-layer="upper-arm-left" data-parent="${anatomy.arms.left.parent}" data-landmark-chain="${provenance(anatomy.arms.left)}" d="${anatomy.arms.left.d}"/>
      <path class="arm-surface" data-layer="upper-arm-right" data-parent="${anatomy.arms.right.parent}" data-landmark-chain="${provenance(anatomy.arms.right)}" d="${anatomy.arms.right.d}"/>
    </g>
    <path class="body" data-parent="${anatomy.body.parent}" data-landmark-chain="${provenance(anatomy.body)}" d="${anatomy.body.d}"/>
    <path class="chest-volume" data-layer="covered-torso-volume" data-parent="${anatomy.chest.parent}" data-landmark-chain="${provenance(anatomy.chest)}" opacity="${n(.18 + geometry.parameters.bustShoulderRatio / .64 * .22)}" d="${anatomy.chest.d}"/>
    <g data-layer="deltoids">
      <path class="deltoid-surface" data-layer="deltoid-left" data-parent="${anatomy.deltoids.left.parent}" data-landmark-chain="${provenance(anatomy.deltoids.left)}" d="${anatomy.deltoids.left.d}"/>
      <path class="deltoid-surface" data-layer="deltoid-right" data-parent="${anatomy.deltoids.right.parent}" data-landmark-chain="${provenance(anatomy.deltoids.right)}" d="${anatomy.deltoids.right.d}"/>
    </g>
    ${Object.values(anatomy.exposedOutlines).map(item => `<path class="surface-outline" data-layer="exposed-surface-outline" data-parent="${item.parent}" data-landmark-chain="${provenance(item)}" d="${item.d}"/>`).join("")}
    <path class="anatomy-line" data-parent="${anatomy.neckGuide.parent}" data-landmark-chain="${provenance(anatomy.neckGuide)}" d="${anatomy.neckGuide.d}"/>
    <path class="anatomy-line" data-parent="${anatomy.shoulderGuide.parent}" data-landmark-chain="${provenance(anatomy.shoulderGuide)}" d="${anatomy.shoulderGuide.d}"/>
    <path class="ear" data-layer="ears" data-parent="${anatomy.ears.left.parent}" data-landmark-chain="${provenance(anatomy.ears.left)}" d="${anatomy.ears.left.d}"/>
    <path class="ear" data-layer="ears" data-parent="${anatomy.ears.right.parent}" data-landmark-chain="${provenance(anatomy.ears.right)}" d="${anatomy.ears.right.d}"/>
    <path class="head" data-parent="${anatomy.head.parent}" data-landmark-chain="${provenance(anatomy.head)}" d="${anatomy.head.d}"/>
    <path class="ear-detail" data-layer="ear-details" data-parent="${anatomy.ears.innerLeft.parent}" data-landmark-chain="${provenance(anatomy.ears.innerLeft)}" d="${anatomy.ears.innerLeft.d}"/>
    <path class="ear-detail" data-layer="ear-details" data-parent="${anatomy.ears.innerRight.parent}" data-landmark-chain="${provenance(anatomy.ears.innerRight)}" d="${anatomy.ears.innerRight.d}"/>
    <path class="hair-front" data-layer="hair-front" data-parent="${anatomy.hairFront.parent}" data-landmark-chain="${provenance(anatomy.hairFront)}" d="${anatomy.hairFront.d}"/>
    <path class="construction" data-parent="${anatomy.hairFit.parent}" data-landmark-chain="${provenance(anatomy.hairFit)}" d="${anatomy.hairFit.d}"/>
    ${ellipseMarkup(l.eyeLeft.x, l.eyeLeft.y, m.eyeWidth / 2, m.eyeHeight / 2, "face-mark", "eye.left")}
    ${ellipseMarkup(l.eyeRight.x, l.eyeRight.y, m.eyeWidth / 2, m.eyeHeight / 2, "face-mark", "eye.right")}
    ${ellipseMarkup(l.irisLeft.x, l.irisLeft.y, m.irisDiameter / 2, m.irisDiameter / 2, "construction", "eye.left", 'clip-path="url(#eye-clip-left)"')}
    ${ellipseMarkup(l.irisRight.x, l.irisRight.y, m.irisDiameter / 2, m.irisDiameter / 2, "construction", "eye.right", 'clip-path="url(#eye-clip-right)"')}
    <path class="feature-line" data-parent="brow.left" d="M ${n(l.browLeft.x - m.eyeWidth * .38)} ${l.browLeft.y} Q ${l.browLeft.x} ${n(l.browLeft.y - 8)} ${n(l.browLeft.x + m.eyeWidth * .38)} ${l.browLeft.y}"/>
    <path class="feature-line" data-parent="brow.right" d="M ${n(l.browRight.x - m.eyeWidth * .38)} ${l.browRight.y} Q ${l.browRight.x} ${n(l.browRight.y - 8)} ${n(l.browRight.x + m.eyeWidth * .38)} ${l.browRight.y}"/>
    <path class="feature-line" data-parent="nose.center" d="M ${l.nose.x} ${n(l.nose.y - m.noseHeight / 2)} L ${n(l.nose.x - m.noseWidth / 2)} ${n(l.nose.y + m.noseHeight / 2)} L ${n(l.nose.x + m.noseWidth / 2)} ${n(l.nose.y + m.noseHeight / 2)}"/>
    <path class="feature-line" data-parent="mouth.center" d="M ${n(l.mouth.x - m.mouthWidth / 2)} ${l.mouth.y} Q ${l.mouth.x} ${n(l.mouth.y + m.mouthHeight)} ${n(l.mouth.x + m.mouthWidth / 2)} ${l.mouth.y}"/>
    ${overlay}`;
}

function render() {
  const geometry = currentFixture ? fixtureGeometry(currentFixture) : buildGeometry(currentParameters);
  const validation = validateGeometry(geometry);
  const rendered = measureRenderedGeometry(geometry);
  status.textContent = validation.status;
  status.className = `status ${validation.status === "Blocked" ? "blocked" : "needs-review"}`;
  stateName.textContent = currentFixture ? `fixture:${currentFixture}` : currentStateName;
  const visibleRatios = { ...geometry.ratios, renderedHairHead: rendered.hairHead, renderedBodyHead: rendered.bodyHead, renderedWaistShoulder: rendered.waistShoulder };
  metrics.innerHTML = Object.entries(visibleRatios).map(([name, value]) => `<span class="metric-name">${name}</span><span class="metric-value">${value}</span>`).join("");
  errors.innerHTML = validation.errors.length
    ? validation.errors.map(error => `<div class="error-card"><strong>${escapeText(error.code)}</strong><br>${escapeText(error.message)} · actual ${escapeText(JSON.stringify(error.actual))}</div>`).join("")
    : `<div class="review-card"><strong>Automated checks found no hard failure.</strong><br>This remains a candidate until an independent evaluator reviews its silhouette and evidence.</div>`;
  renderSvg(geometry);
}

controls.addEventListener("input", event => {
  const key = event.target.dataset.parameter;
  if (!key) return;
  const candidate = { ...currentParameters, [key]: Number(event.target.value) };
  if (validateGeometry(buildGeometry(candidate)).status === "Blocked") {
    updateControlValues();
    currentStateName = "custom:reconciled";
    presetSelect.selectedIndex = -1;
    evidenceSelect.value = currentStateName;
    render();
    return;
  }
  currentParameters = candidate;
  currentFixture = null;
  currentStateName = "custom:bounded";
  presetSelect.selectedIndex = -1;
  evidenceSelect.value = currentStateName;
  controls.querySelector(`[data-output="${key}"]`).value = event.target.value;
  render();
});
presetSelect.addEventListener("change", () => {
  currentParameters = presetParameters(presetSelect.value);
  currentFixture = null;
  currentStateName = `preset:${presetSelect.value}`;
  evidenceSelect.value = currentStateName;
  updateControlValues();
  render();
});
evidenceSelect.addEventListener("change", () => {
  const selected = states.find(item => item.id === evidenceSelect.value);
  if (!selected) return;
  currentParameters = selected.parameters;
  currentFixture = null;
  currentStateName = selected.id;
  if (selected.id.startsWith("preset:")) presetSelect.value = selected.id.slice(7);
  else presetSelect.selectedIndex = -1;
  updateControlValues();
  render();
});
fixtures.addEventListener("click", event => {
  const name = event.target.dataset.fixture;
  if (!name) return;
  currentFixture = name;
  render();
});
overlayToggle.addEventListener("change", render);

buildControls();
specVersion.textContent = SPEC_VERSION;
buildEvidenceOptions();
buildFixtureButtons();
updateControlValues();
if (window.matchMedia("(max-width: 720px)").matches) overlayToggle.checked = false;
render();
