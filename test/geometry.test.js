import assert from "node:assert/strict";
import test from "node:test";
import {
  CANVAS, NEGATIVE_FIXTURES, NODE_CONTRACTS, PARAMETER_DEFINITIONS, PRESETS, buildGeometry, clampParameters,
  evidenceStates, fixtureGeometry, presetParameters
} from "../src/geometry.js";
import { STANDARD_BUST_SPEC as SPEC } from "../src/spec.js";
import { buildAnatomyPaths, measureRenderedGeometry } from "../src/anatomy-paths.js";
import { validateGeometry, validateNodeContracts } from "../src/validation.js";

const near = (actual, expected, tolerance, message) => assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`);

test("neutral geometry matches the corrected character-bible landmarks", () => {
  const geometry = buildGeometry(presetParameters("neutral"));
  assert.equal(geometry.specVersion, "standard-bust-v1/spec-0.3.0");
  assert.deepEqual(validateGeometry(geometry), { status: "Needs review", errors: [] });
  near(geometry.measurements.headWidth, 270, 0.01, "head width");
  near(geometry.measurements.headHeight, 333, 1, "head height");
  near(geometry.landmarks.eyeLeft.x, 435, 1, "left eye center");
  near(geometry.landmarks.eyeRight.x, 565, 1, "right eye center");
  near(geometry.landmarks.eyeLeft.y, 260, 1, "eye line");
  near(geometry.landmarks.nose.y, 322, 1, "nose");
  near(geometry.landmarks.mouth.y, 365, 1, "mouth");
  near(geometry.landmarks.upperNeckLeft.y, 415, 2, "upper neck junction");
  near(geometry.landmarks.chin.y, 425, 1, "chin");
  near(geometry.landmarks.sternum.y, 525, 2, "collar/sternum center");
  near(geometry.landmarks.acromionLeft.x, 196, 1, "left anatomical acromion");
  near(geometry.landmarks.acromionRight.x, 804, 1, "right anatomical acromion");
  near(geometry.landmarks.bustLeft.y, 650, 2, "covered bust apex");
});

test("geometry, validation, controls, and tests share one executable specification", () => {
  assert.equal(PARAMETER_DEFINITIONS, SPEC.parameters);
  assert.equal(PRESETS, SPEC.presets);
  assert.equal(CANVAS, SPEC.canvas);
  const geometry = buildGeometry();
  for (const [name, range] of Object.entries(SPEC.ratioRanges)) assert.ok(geometry.ratios[name] >= range[0] && geometry.ratios[name] <= range[1], name);
});

test("all presentation presets are valid bounded bundles on one anatomy", () => {
  for (const name of Object.keys(PRESETS)) {
    const parameters = presetParameters(name);
    for (const [key, definition] of Object.entries(SPEC.parameters)) assert.ok(parameters[key] >= definition.min && parameters[key] <= definition.max, `${name}.${key}`);
    assert.equal(validateGeometry(buildGeometry(parameters)).status, "Needs review", name);
  }
});

test("presentation targets and shoulder envelopes match spec 0.3", () => {
  const expected = {
    feminine: [2.14, 0.69, 0.31, 0.57], androgynous: [2.25, 0.72, 0.34, 0.50], masculine: [2.40, 0.75, 0.38, 0.44]
  };
  for (const [name, values] of Object.entries(expected)) {
    const ratios = buildGeometry(presetParameters(name)).ratios;
    assert.deepEqual([ratios.shoulderHead, ratios.jawCranium, ratios.upperNeckHead, ratios.bustShoulder], values);
    assert.ok(ratios.shoulderHead >= SPEC.presetShoulderEnvelopes[name][0] && ratios.shoulderHead <= SPEC.presetShoulderEnvelopes[name][1]);
  }
});

test("controls clamp non-finite and out-of-envelope values before evaluation", () => {
  const candidate = Object.fromEntries(Object.keys(SPEC.parameters).map(key => [key, Number.POSITIVE_INFINITY]));
  candidate.headWidth = -999;
  candidate.eyeWidth = 999;
  const clamped = clampParameters(candidate);
  assert.equal(clamped.headWidth, SPEC.parameters.headWidth.min);
  assert.equal(clamped.eyeWidth, SPEC.parameters.eyeWidth.max);
  for (const [key, definition] of Object.entries(SPEC.parameters)) assert.ok(clamped[key] >= definition.min && clamped[key] <= definition.max, key);
});

test("corrected Y-down ordering distinguishes upper neck, chin, and collar", () => {
  for (const name of Object.keys(PRESETS)) {
    const l = buildGeometry(presetParameters(name)).landmarks;
    assert.ok(l.upperNeckLeft.y <= l.chin.y, name);
    assert.ok(l.chin.y < l.collarLeft.y, name);
    assert.ok(l.collarLeft.y < l.acromionLeft.y, name);
    assert.ok(l.acromionLeft.y < l.bustLeft.y, name);
  }
});

test("multi-Y silhouette is symmetric, locally contained, and narrows below cheek", () => {
  for (const name of Object.keys(PRESETS)) {
    const { measurements: m, landmarks: l } = buildGeometry(presetParameters(name));
    assert.ok(m.templeWidth >= m.cheekWidth && m.cheekWidth >= m.jawWidth && m.jawWidth >= m.chinWidth, name);
    for (const [left, right] of [[l.templeLeft, l.templeRight], [l.cheekLeft, l.cheekRight], [l.jawLeft, l.jawRight], [l.chinShelfLeft, l.chinShelfRight]]) {
      near((left.x + right.x) / 2, CANVAS.centerX, .01, name);
    }
    assert.ok(m.upperNeckWidth < m.jawWidth, name);
    assert.ok(m.collarWidth >= m.upperNeckWidth, name);
  }
});

test("eyes, iris, nose, mouth, and ears meet explicit construction bounds", () => {
  const { measurements: m, ratios: r, landmarks: l } = buildGeometry();
  assert.ok(m.eyeWidth >= 54 && m.eyeWidth <= 70);
  assert.ok(m.eyeHeight >= 25 && m.eyeHeight <= 37);
  assert.ok(r.eyeAspect >= 1.70 && r.eyeAspect <= 2.35);
  assert.ok(r.innerGapEye >= .88 && r.innerGapEye <= 1.22);
  assert.ok(r.irisEye >= .52 && r.irisEye <= .72);
  assert.ok(m.irisDiameter < m.eyeWidth && m.irisDiameter < m.eyeHeight * 1.45);
  assert.ok(m.irisVisibleHeight <= m.eyeHeight - 4);
  assert.ok(m.noseWidth >= 10 && m.noseWidth <= 26 && m.noseHeight >= 8 && m.noseHeight <= 26);
  assert.ok(m.mouthWidth >= 30 && m.mouthWidth <= 56 && m.mouthHeight >= 2 && m.mouthHeight <= 10);
  assert.ok(l.earTopLeft.y >= 225 && l.earTopLeft.y <= 240);
  assert.ok(l.earBottomLeft.y >= 320 && l.earBottomLeft.y <= 340);
  near(l.earTopRight.x - l.earTopLeft.x, m.earTopOutlineWidth, 3, "top ear roots intersect outline");
  near(l.earBottomRight.x - l.earBottomLeft.x, m.earBottomOutlineWidth, 3, "bottom ear roots intersect outline");
});

test("hair construction owns canonical hairline, temple, side-lock, and nape samples", () => {
  for (const state of [presetParameters("neutral"), { headWidth: 260 }, { headWidth: 280, hairWidthHeadRatio: 1.32 }]) {
    const { landmarks: l, measurements: m } = buildGeometry(state);
    assert.ok(l.hairlineCenter.y >= 145 && l.hairlineCenter.y <= 165);
    assert.ok(l.hairlineTempleLeft.y >= 165 && l.hairlineTempleLeft.y <= 190);
    assert.equal(m.hairHaloGap, 0);
    assert.ok(m.hairHiddenOverlap >= m.hairRequiredOverlap);
    assert.ok(m.hairCrownOverlap >= m.hairRequiredOverlap);
    assert.ok(m.hairTempleOverlap >= m.hairRequiredOverlap);
    for (const key of ["hairlineCenter", "hairlineTempleLeft", "hairlineTempleRight", "sideLockRootLeft", "sideLockRootRight", "napeLeft", "napeRight"]) assert.ok(l[key].parent.startsWith("hair."), key);
  }
});

test("shoulders distinguish roots, anatomical acromia, garment extent, and narrowing torso", () => {
  const { landmarks: l, measurements: m } = buildGeometry();
  assert.ok(l.shoulderRootLeft.x > l.acromionLeft.x);
  assert.ok(l.shoulderRootLeft.y < l.trapeziusLeft.y && l.trapeziusLeft.y < l.shoulderMidLeft.y && l.shoulderMidLeft.y < l.acromionLeft.y);
  assert.ok(l.deltoidOuterLeft.y > l.acromionLeft.y && l.upperArmLeft.y > l.deltoidOuterLeft.y);
  assert.equal(l.deltoidOuterLeft.parent, "arm.left");
  assert.equal(l.deltoidOuterRight.parent, "arm.right");
  assert.ok(l.garmentShoulderLeft.x < l.acromionLeft.x);
  assert.ok(m.torsoWidth850 < m.garmentShoulderSpan);
  assert.ok(m.torsoWidth850 / m.garmentShoulderSpan >= .78 && m.torsoWidth850 / m.garmentShoulderSpan <= .90);
  assert.ok(m.garmentShoulderSpan - m.acromionSpan <= SPEC.constants.garmentPaddingHeadMax * m.headWidth * 2 + .01);
  assert.ok(m.shoulderDrop >= 24 && m.shoulderDrop <= 60);
});

test("visible anatomy paths preserve neck-to-arm continuity and canonical provenance", () => {
  for (const name of Object.keys(PRESETS)) {
    const geometry = buildGeometry(presetParameters(name));
    const paths = buildAnatomyPaths(geometry);
    assert.equal(paths.body.parent, "torso.root");
    assert.equal(paths.neckGuide.parent, "neck.root");
    assert.equal(paths.shoulderGuide.parent, "collar.center");
    assert.equal(paths.chest.parent, "chest.center");
    for (const landmark of ["upperNeckLeft", "collarLeft", "shoulderRootLeft", "trapeziusLeft", "shoulderMidLeft", "acromionLeft", "deltoidOuterLeft", "upperArmLeft", "torso850Left"]) {
      assert.ok(paths.body.landmarks.includes(landmark), `${name}:${landmark}`);
      const distance = Math.min(...paths.body.samples.map(point => Math.hypot(point.x - geometry.landmarks[landmark].x, point.y - geometry.landmarks[landmark].y)));
      assert.ok(distance <= 1.1, `${name}:${landmark} must be on visible contour, distance=${distance}`);
    }
    assert.deepEqual(paths.chest.landmarks.slice(0, 3), ["shoulderRootLeft", "bustLeft", "sternum"]);
    assert.ok(paths.chest.d.startsWith(`M ${geometry.landmarks.shoulderRootLeft.x} ${geometry.landmarks.shoulderRootLeft.y}`));
    assert.match(paths.chest.d, new RegExp(`${geometry.landmarks.shoulderRootRight.x} ${geometry.landmarks.shoulderRootRight.y}`));
  }
  assert.equal(buildAnatomyPaths(buildGeometry({ bustShoulderRatio: 0 })).chest, null);
});

test("covered bust uses symmetric apexes and a continuous chest-owned envelope", () => {
  for (const bustShoulderRatio of [0, .18, .54, .64]) {
    const { landmarks: l, measurements: m } = buildGeometry({ bustShoulderRatio });
    near((l.bustLeft.x + l.bustRight.x) / 2, CANVAS.centerX, .01, "bust apex symmetry");
    if (bustShoulderRatio === 0) assert.equal(m.bustApexOffset, 0);
    else if (bustShoulderRatio >= .4) assert.ok(m.bustApexOffset / m.acromionSpan >= .13 && m.bustApexOffset / m.acromionSpan <= .18);
    else assert.ok(m.bustApexOffset < m.bustEnvelopeWidth / 2, "low bust must collapse inside its outer envelope");
    assert.equal(l.bustOuterLeft.parent, "chest.center");
    assert.equal(l.bustInnerLeft.parent, "chest.center");
    assert.equal(l.bustInnerRight.parent, "chest.center");
    assert.equal(l.bustOuterRight.parent, "chest.center");
    assert.deepEqual(l.bustUpper, { ...l.sternum, parent: "chest.center" });
    assert.equal(validateGeometry(buildGeometry({ bustShoulderRatio })).status, "Needs review");
  }
});

test("rendered contours, not intended controls, satisfy the visible silhouette contract", () => {
  for (const state of evidenceStates()) {
    const geometry = buildGeometry(state.parameters);
    const validation = validateGeometry(geometry);
    if (validation.status === "Blocked") continue;
    const rendered = measureRenderedGeometry(geometry);
    assert.ok(rendered.hairHead >= SPEC.ratioRanges.hairHead[0] && rendered.hairHead <= SPEC.ratioRanges.hairHead[1], `${state.id}: hair/head=${rendered.hairHead}`);
    assert.ok(rendered.bodyHead >= 2.05 && rendered.bodyHead <= 2.48, `${state.id}: body/head=${rendered.bodyHead}`);
    assert.ok(rendered.waistShoulder >= .68 && rendered.waistShoulder <= .86, `${state.id}: waist/shoulder=${rendered.waistShoulder}`);
  }
});

test("evidence includes presets, every bound, all pairwise corners, and worst-valid bundle", () => {
  const states = evidenceStates();
  const count = Object.keys(SPEC.parameters).length;
  assert.equal(states.length, Object.keys(PRESETS).length + count * 2 + (count * (count - 1) / 2) * 4 + 3);
  assert.equal(new Set(states.map(state => state.id)).size, states.length);
  assert.ok(states.some(state => state.id === "combined:worst-valid"));
  assert.equal(validateGeometry(buildGeometry(states.find(state => state.id === "boundary:adult-safe").parameters)).status, "Needs review");
  assert.ok(validateGeometry(buildGeometry(states.find(state => state.id === "boundary:adult-blocked").parameters)).errors.some(error => error.code === "correlation.maturity"));
  for (const key of Object.keys(SPEC.parameters)) for (const bound of ["min", "max"]) assert.ok(states.some(state => state.id === `bound:${key}:${bound}`));
  assert.equal(validateGeometry(buildGeometry(states.find(state => state.id === "combined:worst-valid").parameters)).status, "Needs review");
  assert.ok(states.some(state => validateGeometry(buildGeometry(state.parameters)).status === "Blocked"), "correlated combinations must be rejected, not silently accepted");
});

test("all malformed fixtures are blocked for their intended measured defect", () => {
  const expectedCodes = {
    miniatureHead: "ratio.shoulderHead", wigGap: "fit.wigGap", floatingNeck: "fit.floatingNeck", misplacedFace: "alignment.face",
    rectangularShoulders: "fit.rectangularShoulders", detachedBust: "fit.detachedBust", correlatedMaturity: "correlation.maturity", unsafeCombined: "containment.shoulders",
    wedgeBody: "rendered.wedgeBody", scallopedBib: "rendered.scallopedBib"
  };
  assert.deepEqual(Object.keys(NEGATIVE_FIXTURES), Object.keys(expectedCodes));
  for (const [name, code] of Object.entries(expectedCodes)) {
    const result = validateGeometry(fixtureGeometry(name));
    assert.equal(result.status, "Blocked", name);
    assert.ok(result.errors.some(error => error.code === code), `${name}: ${JSON.stringify(result.errors)}`);
  }
});

test("maturity correlation rejects only the combined childlike condition", () => {
  assert.ok(validateGeometry(fixtureGeometry("correlatedMaturity")).errors.some(error => error.code === "correlation.maturity"));
  const isolatedJaw = buildGeometry({}, { jawRatioOverride: .67 });
  assert.ok(!validateGeometry(isolatedJaw).errors.some(error => error.code === "correlation.maturity"));
});

test("neck endpoints are solved from the real outline and reject unsafe chin/neck correlation", () => {
  for (const state of evidenceStates()) {
    const geometry = buildGeometry(state.parameters);
    near(geometry.measurements.upperNeckWidth, geometry.measurements.upperNeckOutlineWidth, SPEC.constants.outlineJoinTolerance, state.id);
  }
  assert.ok(validateGeometry(buildGeometry({ chinCraniumRatio: .32, upperNeckHeadRatio: .40 })).errors.some(error => error.code === "correlation.chinNeck"));
});

test("geometry is deterministic, immutable, symmetric, and graph connected", () => {
  for (const state of evidenceStates()) {
    const first = buildGeometry(state.parameters); const second = buildGeometry(state.parameters);
    assert.deepEqual(first, second, state.id);
    for (const landmark of Object.values(first.landmarks)) assert.ok(landmark.parent in NODE_CONTRACTS, state.id);
  }
  const geometry = buildGeometry();
  assert.ok(Object.isFrozen(geometry) && Object.isFrozen(geometry.landmarks));
  assert.throws(() => { geometry.landmarks.eyeLeft.x = 0; }, TypeError);
});

test("node contracts contain hierarchy only and reject per-part global positioning", () => {
  assert.deepEqual(validateNodeContracts(), []);
  for (const node of Object.values(NODE_CONTRACTS)) assert.deepEqual(Object.keys(node).sort(), ["parent"]);
  const corrupted = { ...NODE_CONTRACTS, "eye.left": { parent: "head.root", globalX: 412 } };
  assert.ok(validateNodeContracts(corrupted).some(error => error.code === "global.eye.left"));
});

test("center-derived formulas replace fixed neutral X positions", () => {
  for (const parameters of [{ headWidth: 260 }, { headWidth: 280, shoulderHeadRatio: 2.48, jawCraniumRatio: .67, upperNeckHeadRatio: .40 }]) {
    const { landmarks: l, measurements: m } = buildGeometry(parameters);
    near(l.acromionLeft.x, CANVAS.centerX - m.acromionSpan / 2, .001, "acromion formula");
    near(l.jawLeft.x, CANVAS.centerX - m.jawWidth / 2, .001, "jaw formula");
    near(l.upperNeckLeft.x, CANVAS.centerX - m.upperNeckWidth / 2, .001, "neck formula");
    near(l.bustLeft.x, CANVAS.centerX - m.bustApexOffset, .001, "bust formula");
  }
});

test("head changes propagate to face, ears, hair, neck, and shoulder formulas", () => {
  const narrow = buildGeometry({ headWidth: 260 }); const wide = buildGeometry({ headWidth: 280 });
  for (const name of ["eyeLeft", "earTopLeft", "templeLeft", "jawLeft", "hairTop", "sideLockRootLeft", "napeLeft", "upperNeckLeft", "collarLeft", "acromionLeft"]) {
    assert.notDeepEqual(narrow.landmarks[name], wide.landmarks[name], name);
  }
});

test("shoulder and bust changes propagate through torso while bust never changes face maturity", () => {
  const slim = buildGeometry({ shoulderHeadRatio: 2.05, bustShoulderRatio: 0, upperNeckHeadRatio: .29 });
  const broad = buildGeometry({ shoulderHeadRatio: 2.48, bustShoulderRatio: .64, upperNeckHeadRatio: .40 });
  assert.notEqual(slim.landmarks.acromionLeft.x, broad.landmarks.acromionLeft.x);
  assert.notEqual(slim.landmarks.torso850Left.x, broad.landmarks.torso850Left.x);
  assert.notEqual(slim.landmarks.bustOuterLeft.x, broad.landmarks.bustOuterLeft.x);
  assert.notEqual(slim.landmarks.upperNeckLeft.x, broad.landmarks.upperNeckLeft.x);
  const faceKeys = ["eyeLeft", "eyeRight", "nose", "mouth", "chin", "jawLeft", "jawRight"];
  const lowBust = buildGeometry({ bustShoulderRatio: 0 }); const highBust = buildGeometry({ bustShoulderRatio: .64 });
  for (const key of faceKeys) assert.deepEqual(lowBust.landmarks[key], highBust.landmarks[key], key);
});

test("automated validation never self-approves Gate A", () => {
  assert.equal(validateGeometry(buildGeometry()).status, "Needs review");
  assert.notEqual(validateGeometry(buildGeometry()).status, "Approved");
  assert.equal(validateGeometry(fixtureGeometry("wigGap")).status, "Blocked");
});
