import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.equal(geometry.specVersion, "standard-bust-v1/spec-0.7.0");
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
  near(geometry.landmarks.bustLeft.y, geometry.measurements.expectedBustApexY, .01, "covered bust apex");
});

test("geometry, validation, controls, and tests share one executable specification", () => {
  assert.equal(PARAMETER_DEFINITIONS, SPEC.parameters);
  assert.equal(PRESETS, SPEC.presets);
  assert.equal(CANVAS, SPEC.canvas);
  const geometry = buildGeometry();
  for (const [name, range] of Object.entries(SPEC.ratioRanges)) assert.ok(geometry.ratios[name] >= range[0] && geometry.ratios[name] <= range[1], name);
});

test("governing character bible and executable parameter contract have exact parity", () => {
  const bible = readFileSync(new URL("../CHARACTER_BIBLE.md", import.meta.url), "utf8");
  const version = bible.match(/^Version: `([^`]+)`/m)?.[1];
  assert.equal(version, SPEC.version);
  const rows = [...bible.matchAll(/^\| (\w+) \| ([0-9.]+) \| ([0-9.]+) \| ([0-9.]+) \|$/gm)];
  const contract = Object.fromEntries(rows.map(([, key, min, max, value]) => [key, { min: Number(min), max: Number(max), value: Number(value) }]));
  assert.deepEqual(Object.keys(contract), Object.keys(SPEC.parameters));
  for (const [key, definition] of Object.entries(SPEC.parameters)) {
    assert.deepEqual(contract[key], { min: definition.min, max: definition.max, value: definition.value }, key);
  }
});

test("all presentation presets are valid bounded bundles on one anatomy", () => {
  for (const name of Object.keys(PRESETS)) {
    const parameters = presetParameters(name);
    for (const [key, definition] of Object.entries(SPEC.parameters)) assert.ok(parameters[key] >= definition.min && parameters[key] <= definition.max, `${name}.${key}`);
    assert.equal(validateGeometry(buildGeometry(parameters)).status, "Needs review", name);
  }
});

test("presentation targets and shoulder envelopes match spec 0.7", () => {
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
  assert.ok(m.eyeWidth >= SPEC.parameters.eyeWidth.min && m.eyeWidth <= SPEC.parameters.eyeWidth.max);
  assert.ok(m.eyeHeight >= SPEC.parameters.eyeHeight.min && m.eyeHeight <= SPEC.parameters.eyeHeight.max);
  assert.ok(r.eyeAspect >= 1.70 && r.eyeAspect <= 2.35);
  assert.ok(r.innerGapEye >= .88 && r.innerGapEye <= 1.22);
  assert.ok(r.irisEye >= .52 && r.irisEye <= .72);
  assert.ok(m.irisDiameter < m.eyeWidth && m.irisDiameter < m.eyeHeight * 1.45);
  assert.ok(m.irisVisibleHeight <= m.eyeHeight - 4);
  assert.ok(m.noseWidth >= 10 && m.noseWidth <= 26 && m.noseHeight >= 8 && m.noseHeight <= 26);
  assert.ok(m.mouthWidth >= SPEC.parameters.mouthWidth.min && m.mouthWidth <= SPEC.parameters.mouthWidth.max && m.mouthHeight >= 2 && m.mouthHeight <= 10);
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
  assert.ok(l.deltoidOuterLeft.y > l.acromionLeft.y && l.upperArmLeft.y > l.deltoidOuterLeft.y && l.upperArmTransitionLeft.y > l.upperArmLeft.y);
  assert.equal(l.deltoidOuterLeft.parent, "shoulder.left");
  assert.equal(l.deltoidOuterRight.parent, "shoulder.right");
  assert.equal(l.upperArmLeft.parent, "arm.left");
  assert.equal(l.axillaLeft.parent, "torso.root");
  assert.ok(l.acromionLeft.y < l.deltoidApexLeft.y && l.deltoidApexLeft.y < l.axillaLeft.y);
  assert.ok(l.garmentShoulderLeft.x < l.acromionLeft.x);
  assert.ok(m.torsoWidth850 < m.garmentShoulderSpan);
  assert.ok(m.torsoWidth850 / m.garmentShoulderSpan >= SPEC.ratioRanges.torso850Garment[0] && m.torsoWidth850 / m.garmentShoulderSpan <= SPEC.ratioRanges.torso850Garment[1]);
  assert.ok(m.garmentShoulderSpan - m.acromionSpan <= SPEC.constants.garmentPaddingHeadMax * m.headWidth * 2 + .01);
  assert.ok(m.shoulderDrop >= SPEC.parameters.shoulderDrop.min && m.shoulderDrop <= SPEC.parameters.shoulderDrop.max);
});

test("five closed anatomy surfaces preserve connected ownership and canonical provenance", () => {
  for (const name of Object.keys(PRESETS)) {
    const geometry = buildGeometry(presetParameters(name));
    const paths = buildAnatomyPaths(geometry);
    assert.equal(paths.body.parent, "torso.root");
    assert.equal(paths.neckGuide.parent, "neck.root");
    assert.equal(paths.shoulderGuide.parent, "collar.center");
    assert.equal(paths.arms.left.parent, "arm.left");
    assert.equal(paths.arms.right.parent, "arm.right");
    assert.equal(paths.deltoids.left.parent, "shoulder.left");
    assert.equal(paths.deltoids.right.parent, "shoulder.right");
    assert.equal(paths.chest.parent, "torso.root");
    const ownership = {
      torso: ["upperNeckLeft", "shoulderRootLeft", "trapeziusLeft", "shoulderMidLeft", "anteriorFoldLeft", "axillaLeft", "bustSideLeft", "torso850Left", "waistLeft"],
      deltoid: ["acromionLeft", "deltoidApexLeft", "deltoidOuterLeft", "deltoidInsertionOuterLeft", "deltoidInsertionInnerLeft"],
      arm: ["upperArmLeft", "elbowDirectionLeft", "armCropOuterLeft", "armCropInnerLeft", "upperArmInnerLeft"]
    };
    for (const [surfaceName, landmarks] of Object.entries(ownership)) for (const landmark of landmarks) {
      const surface = surfaceName === "torso" ? paths.torso : surfaceName === "deltoid" ? paths.deltoids.left : paths.arms.left;
      assert.ok(surface.landmarks.includes(landmark), `${name}:${surfaceName}:${landmark}`);
      const distance = Math.min(...surface.samples.map(point => Math.hypot(point.x - geometry.landmarks[landmark].x, point.y - geometry.landmarks[landmark].y)));
      assert.ok(distance <= 1.1, `${name}:${landmark} must be on visible contour, distance=${distance}`);
    }
    for (const surface of [paths.torso, paths.arms.left, paths.arms.right, paths.deltoids.left, paths.deltoids.right]) {
      assert.equal(surface.commands.filter(command => command.type === "M").length, 1);
      assert.equal(surface.commands.at(-1).type, "Z");
    }
    assert.equal(paths.topology.surfaces.length, 5);
    assert.equal(paths.topology.edges.length, 4);
    assert.deepEqual(paths.topology.zOrder, ["arm.left", "arm.right", "torso.root", "shoulder.left", "shoulder.right"]);
    const connected = new Set(["torso.root"]);
    while (true) {
      const size = connected.size;
      for (const edge of paths.topology.edges) {
        if (connected.has(edge.from)) connected.add(edge.to);
        if (connected.has(edge.to)) connected.add(edge.from);
      }
      if (connected.size === size) break;
    }
    assert.deepEqual([...connected].sort(), [...paths.topology.surfaces].sort());
    assert.deepEqual(paths.chest.landmarks, ["sternum", "upperRibRight", "chestSideRight", "lowerRibRight", "lowerRibCenter", "lowerRibLeft", "chestSideLeft", "upperRibLeft", "bustInnerRight", "bustRight", "bustOuterRight", "bustOuterLeft", "bustLeft", "bustInnerLeft"]);
    assert.ok(paths.chest.d.startsWith(`M ${geometry.landmarks.sternum.x} ${geometry.landmarks.sternum.y}`));
    assert.equal(paths.chest.commands.filter(command => command.type === "M").length, 1);
    assert.equal(paths.chest.commands.at(-1).type, "Z");
  }
  assert.ok(buildAnatomyPaths(buildGeometry({ bustShoulderRatio: 0 })).chest);
});

test("resolved outline and semantic surfaces form the authored shoulder-arm envelope", () => {
  for (const parameters of [presetParameters("neutral"), presetParameters("feminine"), presetParameters("masculine"), { shoulderHeadRatio: 2.05, shoulderDrop: SPEC.parameters.shoulderDrop.min, headWidth: 260 }]) {
    const rendered = measureRenderedGeometry(buildGeometry(parameters));
    assert.ok(rendered.bodyHead <= 2.60);
    near(rendered.shoulderJoinMismatch, 0, .02, "acromion C1 mismatch");
    near(rendered.shoulderJoinAngle, 0, .1, "acromion G1 angle");
    assert.ok(rendered.shoulderChordDeviation >= 3.5, JSON.stringify(rendered.shoulderChordDeviation));
    assert.ok(rendered.shoulderMaxStraightRun <= 176, JSON.stringify(rendered.shoulderMaxStraightRun));
    assert.ok(rendered.shoulderShelfLength <= 78, JSON.stringify(rendered.shoulderShelfLength));
    assert.ok(rendered.shoulderRootSlope >= .17 && rendered.shoulderRootSlope <= .29, JSON.stringify(rendered.shoulderRootSlope));
    assert.ok(rendered.shoulderPeakPadding >= 4 && rendered.shoulderPeakPadding <= parameters.headWidth * SPEC.constants.garmentPaddingHeadMax, JSON.stringify(rendered.shoulderPeakPadding));
    assert.ok(rendered.shoulderTurnWidths[1] >= rendered.shoulderTurnWidths[0] + 6, JSON.stringify(rendered.shoulderTurnWidths));
    assert.ok(rendered.shoulderDeltoidInset >= 3, JSON.stringify(rendered.shoulderDeltoidInset));
    const ranges = [[.99,1.02],[1.03,1.08],[.99,1.05],[.92,1],[.86,.95]];
    rendered.compositeShoulderRatios.forEach((value,index) => assert.ok(value >= ranges[index][0] && value <= ranges[index][1], JSON.stringify(rendered.compositeShoulderRatios)));
    assert.ok(rendered.armSurfaceClosed.every(Boolean) && rendered.deltoidSurfaceClosed.every(Boolean));
    assert.ok(rendered.seamEndpointGaps.every(gap => gap <= 1.1));
    assert.ok(rendered.attachmentOverlaps.every(overlap => overlap >= 8 && overlap <= 24));
    assert.ok(rendered.torsoInset230 >= parameters.shoulderHeadRatio * parameters.headWidth * .08);
    assert.ok(rendered.upperArmStrip850 >= parameters.headWidth * .14);
  }
  const wall = measureRenderedGeometry(buildGeometry({}, { shoulderStyle: "wall" }));
  assert.ok(validateGeometry(buildGeometry({}, { shoulderStyle: "wall" })).errors.some(error => error.code === "rendered.compositeEnvelope"));
  assert.equal(validateGeometry(buildGeometry({ shoulderHeadRatio: SPEC.parameters.shoulderHeadRatio.min, shoulderDrop: SPEC.parameters.shoulderDrop.min })).status, "Needs review", "the authored min shoulder + min drop pair must remain supported");
  assert.ok(validateGeometry(buildGeometry({ shoulderHeadRatio: SPEC.parameters.shoulderHeadRatio.max, shoulderDrop: SPEC.parameters.shoulderDrop.min })).errors.some(error => error.code === "rendered.shoulderSlope"), "the wide/flat correlated corner remains intentionally blocked");
});

test("bust control deforms the actual covered torso silhouette and default chest surface", () => {
  const variants = [0, .08, .50, .64].map(bustShoulderRatio => measureRenderedGeometry(buildGeometry({ bustShoulderRatio })));
  assert.equal(new Set(variants.map(rendered => rendered.paths.body.d)).size, variants.length, "body path must change at every sampled bust value");
  assert.equal(new Set(variants.map(rendered => rendered.paths.chest.d)).size, variants.length, "chest path must change at every sampled bust value");
  assert.equal(new Set(variants.map(rendered => `${rendered.paths.chest.bounds.width}:${rendered.paths.chest.bounds.height}`)).size, variants.length, "chest bounds must realize each bust value");
  for (let index = 1; index < variants.length; index += 1) {
    assert.notDeepEqual(variants[index].paths.body.samples, variants[index - 1].paths.body.samples);
    assert.notDeepEqual(variants[index].paths.chest.samples, variants[index - 1].paths.chest.samples);
  }
  assert.equal(new Set(variants.map(rendered => rendered.paths.arms.left.d)).size, 1, "bust must not deform upper-arm topology");
  assert.equal(new Set(variants.map(rendered => rendered.paths.arms.right.d)).size, 1, "bust must not deform upper-arm topology");
  assert.equal(new Set(variants.map(rendered => rendered.paths.deltoids.left.d)).size, 1, "bust must not deform deltoid topology");
  assert.equal(new Set(variants.map(rendered => rendered.paths.deltoids.right.d)).size, 1, "bust must not deform deltoid topology");
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

test("one torso-owned ribcage field preserves boundary C1 joins and contains bust controls", () => {
  for (const parameters of [{ bustShoulderRatio: 0 }, { bustShoulderRatio: .08 }, presetParameters("neutral"), { bustShoulderRatio: .64 }, ...Object.keys(PRESETS).map(presetParameters)]) {
    const geometry = buildGeometry(parameters);
    const rendered = measureRenderedGeometry(geometry);
    assert.equal(rendered.chestMoveCount, 1);
    assert.equal(rendered.chestClosed, true);
    near(rendered.chestTangentMismatch, 0, .02, "C1 mismatch");
    assert.equal(rendered.paths.chest.parent, "torso.root");
    for (const name of ["sternum", "upperRibRight", "chestSideRight", "lowerRibRight", "lowerRibCenter", "lowerRibLeft", "chestSideLeft", "upperRibLeft"]) {
      const point = geometry.landmarks[name];
      assert.ok(rendered.paths.chest.landmarks.includes(name), `${name} lacks chest provenance`);
      assert.ok(rendered.paths.chest.commands.some(command => command.type !== "Z" && command.x === point.x && command.y === point.y), `${name} is not an endpoint`);
    }
    assert.equal(validateGeometry(geometry).status, "Needs review");
  }
});

test("zero bust keeps the same broad ribcage topology instead of a detached patch", () => {
  const zero = measureRenderedGeometry(buildGeometry({ bustShoulderRatio: 0 }));
  const low = measureRenderedGeometry(buildGeometry({ bustShoulderRatio: .08 }));
  const neutral = measureRenderedGeometry(buildGeometry());
  for (const rendered of [zero, low, neutral]) {
    assert.equal(rendered.paths.chest.parent, "torso.root");
    assert.ok(rendered.paths.chest.bounds.width >= rendered.waistWidth * .65, JSON.stringify(rendered.paths.chest.bounds));
    assert.ok(rendered.paths.chest.bounds.height >= 150, JSON.stringify(rendered.paths.chest.bounds));
  }
  assert.ok(zero.paths.chest.bounds.width / neutral.paths.chest.bounds.width >= .82);
  assert.ok(zero.paths.chest.bounds.height / neutral.paths.chest.bounds.height >= .9);
  assert.equal(validateGeometry(buildGeometry({ bustShoulderRatio: 0 })).status, "Needs review");
});

test("rendered contours, not intended controls, satisfy the visible silhouette contract", () => {
  for (const state of evidenceStates()) {
    const geometry = buildGeometry(state.parameters);
    const validation = validateGeometry(geometry);
    if (validation.status === "Blocked") continue;
    const rendered = measureRenderedGeometry(geometry);
    assert.ok(rendered.hairHead >= SPEC.ratioRanges.hairHead[0] && rendered.hairHead <= SPEC.ratioRanges.hairHead[1], `${state.id}: hair/head=${rendered.hairHead}`);
    assert.ok(rendered.bodyHead >= 2.05 && rendered.bodyHead <= 2.60, `${state.id}: body/head=${rendered.bodyHead}`);
    assert.ok(rendered.waistShoulder >= .84 && rendered.waistShoulder <= .94, `${state.id}: waist/shoulder=${rendered.waistShoulder}`);
    assert.equal(rendered.shoulderProfile.length, 21, `${state.id}: dense shoulder samples`);
    assert.ok(rendered.shoulderProfile.every(Number.isFinite), `${state.id}: ${JSON.stringify(rendered.shoulderProfile)}`);
    assert.ok(rendered.armSurfaceClosed.every(Boolean) && rendered.deltoidSurfaceClosed.every(Boolean), state.id);
    assert.equal(rendered.topologySurfaces.length, 5, state.id);
    assert.equal(rendered.topologyEdges, 4, state.id);
    assert.ok(rendered.seamEndpointGaps.every(gap => gap <= 1.1), state.id);
    assert.ok(rendered.torsoLateralViolation <= 1.1, state.id);
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
  for (const key of Object.keys(SPEC.parameters)) for (const bound of ["min", "max"]) {
    const state = states.find(item => item.id === `bound:${key}:${bound}`);
    assert.ok(state, `${key}:${bound} evidence missing`);
    assert.equal(validateGeometry(buildGeometry(state.parameters)).status, "Needs review", `${key}:${bound} is an advertised isolated endpoint`);
  }
  assert.equal(validateGeometry(buildGeometry(states.find(state => state.id === "combined:worst-valid").parameters)).status, "Needs review");
  const blocked = states.filter(state => validateGeometry(buildGeometry(state.parameters)).status === "Blocked");
  assert.equal(blocked.length, 37, "the documented correlated rejection set must remain stable");
  for (const id of ["pair:headWidth:min+bustShoulderRatio:min", "pair:shoulderHeadRatio:max+bustShoulderRatio:min"]) {
    assert.ok(validateGeometry(buildGeometry(states.find(state => state.id === id).parameters)).errors.some(error => error.code === "correlation.shoulderFrame"), id);
  }
});

test("all malformed fixtures are blocked for their intended measured defect", () => {
  const expectedCodes = {
    miniatureHead: "ratio.shoulderHead", wigGap: "fit.wigGap", floatingNeck: "fit.floatingNeck", misplacedFace: "alignment.face",
    rectangularShoulders: "fit.rectangularShoulders", detachedBust: "fit.detachedBust", correlatedMaturity: "correlation.maturity", unsafeCombined: "containment.shoulders",
    wedgeBody: "rendered.wedgeBody", scallopedBib: "rendered.scallopedBib", compactShoulderHook: "rendered.compositeEnvelope",
    fakeDecorativeSeam: "topology.closedSurfaces", fusedArmContainer: "topology.closedSurfaces"
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
