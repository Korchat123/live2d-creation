import { STANDARD_BUST_SPEC as SPEC } from "./spec.js";

export const SPEC_VERSION = SPEC.version;
export const CANVAS = SPEC.canvas;
export const PARAMETER_DEFINITIONS = SPEC.parameters;
export const PRESETS = SPEC.presets;

export const NODE_CONTRACTS = Object.freeze({
  "character.root": { parent: null }, "torso.root": { parent: "character.root" },
  "shoulder.root.left": { parent: "torso.root" }, "shoulder.root.right": { parent: "torso.root" },
  "shoulder.left": { parent: "shoulder.root.left" }, "shoulder.right": { parent: "shoulder.root.right" },
  "arm.left": { parent: "shoulder.left" }, "arm.right": { parent: "shoulder.right" },
  "chest.center": { parent: "torso.root" }, "bust.left": { parent: "chest.center" }, "bust.right": { parent: "chest.center" },
  "collar.center": { parent: "torso.root" }, "neck.root": { parent: "character.root" }, "head.root": { parent: "neck.root" },
  "head.crown": { parent: "head.root" }, "temple.left": { parent: "head.root" }, "temple.right": { parent: "head.root" },
  "cheek.left": { parent: "head.root" }, "cheek.right": { parent: "head.root" }, "jaw.left": { parent: "head.root" }, "jaw.right": { parent: "head.root" },
  "ear.left": { parent: "head.root" }, "ear.right": { parent: "head.root" }, "eye.left": { parent: "head.root" }, "eye.right": { parent: "head.root" },
  "brow.left": { parent: "head.root" }, "brow.right": { parent: "head.root" }, "nose.center": { parent: "head.root" },
  "mouth.center": { parent: "head.root" }, "chin.center": { parent: "head.root" }, "hair.back": { parent: "head.root" },
  "hair.front": { parent: "head.root" }, "hair.side.left": { parent: "head.root" }, "hair.side.right": { parent: "head.root" }
});

export const NEGATIVE_FIXTURES = Object.freeze({
  miniatureHead: { mutations: { headWidthOverride: 170, acromionSpanOverride: 700 } },
  wigGap: { mutations: { hairHaloGap: 14, hairHiddenOverlapOverride: 4 } },
  floatingNeck: { mutations: { upperNeckOffsetY: 52 } },
  misplacedFace: { mutations: { faceCenterOffsetX: 44 } },
  rectangularShoulders: { mutations: { torsoWidth850Override: 690, shoulderStyle: "wall" } },
  detachedBust: { mutations: { bustApexOffsetY: 135 } },
  correlatedMaturity: { parameters: { eyeHeight: 36, jawCraniumRatio: 0.67, mouthChinShare: 0.31, upperNeckHeadRatio: 0.29, shoulderHeadRatio: 2.05 } },
  unsafeCombined: { mutations: { headWidthOverride: 330, acromionSpanOverride: 818, hairWidthOverride: 455 } }
  ,wedgeBody: { mutations: { bodyStyle: "wedge" } }
  ,scallopedBib: { mutations: { chestStyle: "scalloped" } }
});

const defaults = () => Object.fromEntries(Object.entries(SPEC.parameters).map(([key, definition]) => [key, definition.value]));
const round = value => Math.round(value * 1000) / 1000;
const point = (x, y, parent) => Object.freeze({ x: round(x), y: round(y), parent });

export function clampParameters(candidate = {}) {
  const output = defaults();
  for (const [key, definition] of Object.entries(SPEC.parameters)) {
    const input = Number(candidate[key]);
    if (Number.isFinite(input)) output[key] = Math.min(definition.max, Math.max(definition.min, input));
  }
  return Object.freeze(output);
}

export function presetParameters(name = "neutral") {
  if (!(name in SPEC.presets)) throw new Error(`Unknown preset: ${name}`);
  return clampParameters({ ...defaults(), ...SPEC.presets[name] });
}

export function buildGeometry(candidate = {}, mutations = {}) {
  const p = clampParameters(candidate);
  const c = SPEC.constants;
  const centerX = SPEC.canvas.centerX;
  const headWidth = mutations.headWidthOverride ?? p.headWidth;
  const headHeight = headWidth * p.headAspect;
  const skullTopY = c.skullTopY;
  const chinY = skullTopY + headHeight;
  const faceOffsetX = mutations.faceCenterOffsetX ?? 0;
  const faceCenterX = centerX + faceOffsetX;
  const widthAt = ratio => headWidth * ratio;
  const templeWidth = widthAt(p.templeCraniumRatio);
  const cheekWidth = widthAt(p.cheekCraniumRatio);
  const jawWidth = widthAt(mutations.jawRatioOverride ?? p.jawCraniumRatio);
  const chinWidth = widthAt(p.chinCraniumRatio);
  const templeY = skullTopY + headHeight * c.templeHeadY;
  const cheekY = skullTopY + headHeight * c.cheekHeadY;
  const jawY = skullTopY + headHeight * c.jawHeadY;
  const chinShelfY = skullTopY + headHeight * c.chinShelfHeadY;
  const eyeY = skullTopY + headHeight * c.eyeHeadY;
  const browY = skullTopY + headHeight * c.browHeadY;
  const headOutlineSamples = [
    [skullTopY, headWidth * 0.74], [templeY, templeWidth], [cheekY, cheekWidth], [jawY, jawWidth], [chinShelfY, chinWidth], [chinY, 0]
  ];
  const eyeFaceWidth = interpolateWidth(eyeY, headOutlineSamples);
  const eyeCenterDistance = eyeFaceWidth * p.eyeCenterFaceRatio;
  const eyeWidth = p.eyeWidth;
  const eyeHeight = mutations.eyeHeightOverride ?? p.eyeHeight;
  const irisDiameter = eyeWidth * p.irisEyeRatio;
  const noseY = eyeY + (chinY - eyeY) * c.eyeNoseShare;
  const mouthChinShare = mutations.mouthChinShareOverride ?? p.mouthChinShare;
  const mouthY = chinY - (chinY - eyeY) * mouthChinShare;
  const earTopY = 232;
  const earBottomY = 330;
  const earTopWidth = interpolateWidth(earTopY, headOutlineSamples);
  const earBottomWidth = interpolateWidth(earBottomY, headOutlineSamples);
  const upperNeckWidth = headWidth * (mutations.upperNeckRatioOverride ?? p.upperNeckHeadRatio);
  const collarWidth = headWidth * p.collarHeadRatio;
  const upperNeckJoinY = interpolateYForWidth(upperNeckWidth, [[jawY, jawWidth], [chinShelfY, chinWidth], [chinY, 0]]);
  const upperNeckY = upperNeckJoinY + (mutations.upperNeckOffsetY ?? 0);
  const collarY = upperNeckY + headHeight * p.neckLengthHeadRatio;
  const sternumY = collarY + c.sternumBelowCollar;
  const shoulderRootY = collarY - c.shoulderRootAboveCollar;
  const acromionSpan = mutations.acromionSpanOverride ?? headWidth * p.shoulderHeadRatio;
  const acromionY = shoulderRootY + p.shoulderDrop;
  const garmentPadding = Math.min(14, headWidth * c.garmentPaddingHeadMax);
  const garmentShoulderSpan = acromionSpan + garmentPadding * 2;
  const shoulderRangeShare = (p.shoulderHeadRatio - SPEC.parameters.shoulderHeadRatio.min) / (SPEC.parameters.shoulderHeadRatio.max - SPEC.parameters.shoulderHeadRatio.min);
  const torsoTaperRatio = c.torso850GarmentRatio + shoulderRangeShare * .02;
  const torsoWidth850 = mutations.torsoWidth850Override ?? garmentShoulderSpan * torsoTaperRatio;
  const trapeziusInset = acromionSpan * 0.075;
  const shoulderMidInset = acromionSpan * 0.40;
  const deltoidOuterY = acromionY + 58;
  // A shoulder cap turns decisively into the upper arm; it is not the side of
  // a rectangular garment. These insets scale from the actual head/torso
  // family and remain effective at both shoulder-span bounds.
  const deltoidInset = mutations.shoulderStyle === "wall" ? 0 : Math.max(34, headWidth * .13);
  const shoulderCapInset = mutations.shoulderStyle === "wall" ? 0 : Math.max(7, headWidth * .028);
  const upperArmY = acromionY + 126;
  const bustApexYExpected = acromionY + c.bustBelowAcromion;
  const bustApexY = bustApexYExpected + (mutations.bustApexOffsetY ?? 0);
  const bustEnvelopeWidth = acromionSpan * p.bustShoulderRatio;
  const bustApexOffset = bustEnvelopeWidth === 0 ? 0 : Math.min(acromionSpan * p.bustApexOffsetRatio, bustEnvelopeWidth * .35);
  const bustInnerClearance = bustEnvelopeWidth === 0 ? 0 : Math.min(acromionSpan * c.sternumClearanceShoulder, bustApexOffset * .55);
  const bustVolume = p.bustShoulderRatio / SPEC.parameters.bustShoulderRatio.max;
  const bustSideBulge = bustVolume * Math.min(18, headWidth * .067);
  const hairLift = headHeight * p.hairLiftHeadRatio;
  const hairWidth = mutations.hairWidthOverride ?? headWidth * p.hairWidthHeadRatio;
  const projected = c.hairProjectedDisplacement;
  const hairHiddenOverlap = mutations.hairHiddenOverlapOverride ?? projected + c.hairOverlapSafety;
  const hairHaloGap = mutations.hairHaloGap ?? 0;
  const hairCrownOverlap = hairHiddenOverlap - hairHaloGap;
  const hairTempleOverlap = hairHiddenOverlap - hairHaloGap;
  const centerHairlineY = 155;
  const templeHairlineY = 178;
  const napeY = collarY - 14;
  const napeWidth = collarWidth + 32;

  const landmarks = Object.freeze({
    hairTop: point(centerX, skullTopY - hairLift, "hair.front"), skullTop: point(centerX, skullTopY, "head.crown"),
    craniumLeft: point(centerX - headWidth / 2, skullTopY + headHeight * .19, "head.root"),
    craniumRight: point(centerX + headWidth / 2, skullTopY + headHeight * .19, "head.root"),
    hairInnerCrown: point(centerX, skullTopY + hairCrownOverlap, "hair.front"),
    hairlineCenter: point(centerX, centerHairlineY, "hair.front"),
    hairlineTempleLeft: point(centerX - templeWidth * .38, templeHairlineY, "hair.front"), hairlineTempleRight: point(centerX + templeWidth * .38, templeHairlineY, "hair.front"),
    sideLockRootLeft: point(centerX - templeWidth / 2, templeY, "hair.side.left"), sideLockRootRight: point(centerX + templeWidth / 2, templeY, "hair.side.right"),
    hairInnerTempleLeft: point(centerX - templeWidth / 2 + hairTempleOverlap, templeY, "hair.front"),
    hairInnerTempleRight: point(centerX + templeWidth / 2 - hairTempleOverlap, templeY, "hair.front"),
    napeLeft: point(centerX - napeWidth / 2, napeY, "hair.back"), napeRight: point(centerX + napeWidth / 2, napeY, "hair.back"),
    templeLeft: point(centerX - templeWidth / 2, templeY, "temple.left"), templeRight: point(centerX + templeWidth / 2, templeY, "temple.right"),
    cheekLeft: point(centerX - cheekWidth / 2, cheekY, "cheek.left"), cheekRight: point(centerX + cheekWidth / 2, cheekY, "cheek.right"),
    jawLeft: point(centerX - jawWidth / 2, jawY, "jaw.left"), jawRight: point(centerX + jawWidth / 2, jawY, "jaw.right"),
    chinShelfLeft: point(centerX - chinWidth / 2, chinShelfY, "chin.center"), chinShelfRight: point(centerX + chinWidth / 2, chinShelfY, "chin.center"),
    browLeft: point(faceCenterX - eyeCenterDistance / 2, browY, "brow.left"), browRight: point(faceCenterX + eyeCenterDistance / 2, browY, "brow.right"),
    eyeLeft: point(faceCenterX - eyeCenterDistance / 2, eyeY, "eye.left"), eyeRight: point(faceCenterX + eyeCenterDistance / 2, eyeY, "eye.right"),
    irisLeft: point(faceCenterX - eyeCenterDistance / 2, eyeY, "eye.left"), irisRight: point(faceCenterX + eyeCenterDistance / 2, eyeY, "eye.right"),
    nose: point(faceCenterX, noseY, "nose.center"), mouth: point(faceCenterX, mouthY, "mouth.center"), chin: point(centerX, chinY, "chin.center"),
    earTopLeft: point(centerX - earTopWidth / 2, earTopY, "ear.left"), earTopRight: point(centerX + earTopWidth / 2, earTopY, "ear.right"),
    earBottomLeft: point(centerX - earBottomWidth / 2, earBottomY, "ear.left"), earBottomRight: point(centerX + earBottomWidth / 2, earBottomY, "ear.right"),
    upperNeckLeft: point(centerX - upperNeckWidth / 2, upperNeckY, "neck.root"), upperNeckRight: point(centerX + upperNeckWidth / 2, upperNeckY, "neck.root"),
    collarLeft: point(centerX - collarWidth / 2, collarY, "collar.center"), collarRight: point(centerX + collarWidth / 2, collarY, "collar.center"),
    shoulderRootLeft: point(centerX - collarWidth / 2, shoulderRootY, "shoulder.root.left"), shoulderRootRight: point(centerX + collarWidth / 2, shoulderRootY, "shoulder.root.right"),
    trapeziusLeft: point(centerX - collarWidth / 2 - trapeziusInset, shoulderRootY + p.shoulderDrop * .32, "shoulder.root.left"),
    trapeziusRight: point(centerX + collarWidth / 2 + trapeziusInset, shoulderRootY + p.shoulderDrop * .32, "shoulder.root.right"),
    shoulderMidLeft: point(centerX - shoulderMidInset, shoulderRootY + p.shoulderDrop * .72, "shoulder.left"),
    shoulderMidRight: point(centerX + shoulderMidInset, shoulderRootY + p.shoulderDrop * .72, "shoulder.right"),
    acromionLeft: point(centerX - acromionSpan / 2, acromionY, "shoulder.left"), acromionRight: point(centerX + acromionSpan / 2, acromionY, "shoulder.right"),
    shoulderCapLeft: point(centerX - acromionSpan / 2 + shoulderCapInset, acromionY + 29, "shoulder.left"),
    shoulderCapRight: point(centerX + acromionSpan / 2 - shoulderCapInset, acromionY + 29, "shoulder.right"),
    garmentShoulderLeft: point(centerX - garmentShoulderSpan / 2, acromionY + 14, "shoulder.left"), garmentShoulderRight: point(centerX + garmentShoulderSpan / 2, acromionY + 14, "shoulder.right"),
    deltoidOuterLeft: point(centerX - acromionSpan / 2 + deltoidInset, deltoidOuterY, "arm.left"),
    deltoidOuterRight: point(centerX + acromionSpan / 2 - deltoidInset, deltoidOuterY, "arm.right"),
    upperArmLeft: point(centerX - torsoWidth850 / 2 - 30, upperArmY, "arm.left"),
    upperArmRight: point(centerX + torsoWidth850 / 2 + 30, upperArmY, "arm.right"),
    bustSideLeft: point(centerX - torsoWidth850 / 2 - bustSideBulge, bustApexY + 64, "torso.root"),
    bustSideRight: point(centerX + torsoWidth850 / 2 + bustSideBulge, bustApexY + 64, "torso.root"),
    torso850Left: point(centerX - torsoWidth850 / 2, 850, "torso.root"), torso850Right: point(centerX + torsoWidth850 / 2, 850, "torso.root"),
    waistLeft: point(centerX - torsoWidth850 / 2 + 12, 910, "torso.root"), waistRight: point(centerX + torsoWidth850 / 2 - 12, 910, "torso.root"),
    sternum: point(centerX, sternumY, "chest.center"), bustUpper: point(centerX, sternumY, "chest.center"),
    bustOuterLeft: point(centerX - bustEnvelopeWidth / 2, bustEnvelopeWidth === 0 ? sternumY : bustApexY - 10, "chest.center"),
    bustLeft: point(centerX - bustApexOffset, bustEnvelopeWidth === 0 ? sternumY : bustApexY, "bust.left"),
    bustInnerLeft: point(centerX - bustInnerClearance, bustEnvelopeWidth === 0 ? sternumY : sternumY + 24, "chest.center"),
    bustInnerRight: point(centerX + bustInnerClearance, bustEnvelopeWidth === 0 ? sternumY : sternumY + 24, "chest.center"),
    bustRight: point(centerX + bustApexOffset, bustEnvelopeWidth === 0 ? sternumY : bustApexY, "bust.right"),
    bustOuterRight: point(centerX + bustEnvelopeWidth / 2, bustEnvelopeWidth === 0 ? sternumY : bustApexY - 10, "chest.center"),
    upperRibLeft: point(centerX - collarWidth * (.92 + bustVolume * .05), sternumY + 34 + bustVolume * 3, "torso.root"),
    upperRibRight: point(centerX + collarWidth * (.92 + bustVolume * .05), sternumY + 34 + bustVolume * 3, "torso.root"),
    chestSideLeft: point(centerX - (torsoWidth850 / 2 + 5 + bustSideBulge), bustApexY + 18 + bustVolume * 6, "torso.root"),
    chestSideRight: point(centerX + (torsoWidth850 / 2 + 5 + bustSideBulge), bustApexY + 18 + bustVolume * 6, "torso.root"),
    lowerRibRight: point(centerX + Math.max(torsoWidth850 * (.36 + bustVolume * .025), collarWidth * .85), bustApexY + 68 + bustVolume * 10, "chest.center"),
    lowerRibCenter: point(centerX, bustApexY + 78 + bustVolume * 12, "chest.center"),
    lowerRibLeft: point(centerX - Math.max(torsoWidth850 * (.36 + bustVolume * .025), collarWidth * .85), bustApexY + 68 + bustVolume * 10, "chest.center"),
    torsoCrop: point(centerX, SPEC.canvas.cropY, "torso.root")
  });

  const measurements = Object.freeze({
    headWidth: round(headWidth), headHeight: round(headHeight), templeWidth: round(templeWidth), cheekWidth: round(cheekWidth), jawWidth: round(jawWidth), chinWidth: round(chinWidth),
    eyeFaceWidth: round(eyeFaceWidth), eyeCenterDistance: round(eyeCenterDistance), eyeWidth: round(eyeWidth), eyeHeight: round(eyeHeight), irisDiameter: round(irisDiameter),
    irisClipRx: round(eyeWidth / 2 - 2), irisClipRy: round(eyeHeight / 2 - 2), irisVisibleHeight: round(Math.min(irisDiameter, eyeHeight - 4)),
    noseWidth: p.noseWidth, noseHeight: p.noseHeight, mouthWidth: p.mouthWidth, mouthHeight: p.mouthHeight,
    upperNeckWidth: round(upperNeckWidth), collarWidth: round(collarWidth), acromionSpan: round(acromionSpan), garmentShoulderSpan: round(garmentShoulderSpan),
    torsoWidth850: round(torsoWidth850), shoulderDrop: p.shoulderDrop, bustEnvelopeWidth: round(bustEnvelopeWidth), bustApexOffset: round(bustApexOffset), bustInnerClearance: round(bustInnerClearance), bustSideBulge: round(bustSideBulge),
    expectedBustApexY: round(bustApexYExpected), hairWidth: round(hairWidth), hairLift: round(hairLift), hairHiddenOverlap: round(hairHiddenOverlap),
    hairRequiredOverlap: projected + c.hairOverlapSafety, hairHaloGap: round(Math.max(0, -hairCrownOverlap)),
    hairCrownOverlap: round(landmarks.hairInnerCrown.y - landmarks.skullTop.y),
    hairTempleOverlap: round(Math.min(landmarks.hairInnerTempleLeft.x - landmarks.templeLeft.x, landmarks.templeRight.x - landmarks.hairInnerTempleRight.x)),
    upperNeckOutlineWidth: round(interpolateWidth(upperNeckY, headOutlineSamples)), upperNeckJoinY: round(upperNeckJoinY),
    earTopOutlineWidth: round(interpolateWidth(earTopY, headOutlineSamples)), earBottomOutlineWidth: round(interpolateWidth(earBottomY, headOutlineSamples)),
    earTopY, earBottomY
  });
  const eyeToChin = chinY - eyeY;
  const ratios = Object.freeze({
    shoulderHead: round(acromionSpan / headWidth), headAspect: round(headHeight / headWidth), jawCranium: round(jawWidth / headWidth),
    upperNeckHead: round(upperNeckWidth / headWidth), collarHead: round(collarWidth / headWidth), upperNeckJaw: round(upperNeckWidth / jawWidth),
    neckLengthHead: round((collarY - upperNeckY) / headHeight), templeCranium: round(templeWidth / headWidth), cheekCranium: round(cheekWidth / headWidth),
    chinCranium: round(chinWidth / headWidth), eyeCenterFace: round(eyeCenterDistance / eyeFaceWidth), eyeAspect: round(eyeWidth / eyeHeight),
    innerGapEye: round((eyeCenterDistance - eyeWidth) / eyeWidth), irisEye: round(irisDiameter / eyeWidth), eyeNose: round((noseY - eyeY) / eyeToChin),
    noseMouth: round((mouthY - noseY) / eyeToChin), mouthChin: round((chinY - mouthY) / eyeToChin), mouthEyeCenters: round(p.mouthWidth / eyeCenterDistance),
    hairHead: round(hairWidth / headWidth), hairLiftHead: round(hairLift / headHeight), bustShoulder: round(bustEnvelopeWidth / acromionSpan),
    bustApexShoulder: round(bustApexOffset / acromionSpan), torso850Garment: round(torsoWidth850 / garmentShoulderSpan), eyeHeightFace: round(eyeHeight / (chinY - browY))
  });
  return Object.freeze({ specVersion: SPEC.version, parameters: p, mutations: Object.freeze({ ...mutations }), landmarks, measurements, ratios });
}

function interpolateWidth(y, samples) {
  const ordered = [...samples].sort((a, b) => a[0] - b[0]);
  if (y <= ordered[0][0]) return ordered[0][1];
  if (y >= ordered.at(-1)[0]) return ordered.at(-1)[1];
  for (let index = 1; index < ordered.length; index += 1) {
    if (y <= ordered[index][0]) {
      const [y0, width0] = ordered[index - 1]; const [y1, width1] = ordered[index];
      return width0 + (width1 - width0) * ((y - y0) / (y1 - y0));
    }
  }
}

function interpolateYForWidth(width, samples) {
  for (let index = 1; index < samples.length; index += 1) {
    const [y0, width0] = samples[index - 1];
    const [y1, width1] = samples[index];
    if (width <= width0 && width >= width1) return y0 + (y1 - y0) * ((width0 - width) / (width0 - width1));
  }
  return samples.at(-1)[0];
}

export function fixtureGeometry(name) {
  if (!(name in NEGATIVE_FIXTURES)) throw new Error(`Unknown fixture: ${name}`);
  const fixture = NEGATIVE_FIXTURES[name];
  return buildGeometry(clampParameters({ ...presetParameters("neutral"), ...(fixture.parameters ?? {}) }), fixture.mutations ?? {});
}

export function evidenceStates() {
  const states = Object.keys(SPEC.presets).map(name => ({ id: `preset:${name}`, parameters: presetParameters(name) }));
  const entries = Object.entries(SPEC.parameters);
  for (const [key, definition] of entries) {
    states.push({ id: `bound:${key}:min`, parameters: clampParameters({ [key]: definition.min }) });
    states.push({ id: `bound:${key}:max`, parameters: clampParameters({ [key]: definition.max }) });
  }
  for (let left = 0; left < entries.length; left += 1) for (let right = left + 1; right < entries.length; right += 1) {
    const [leftKey, leftDefinition] = entries[left]; const [rightKey, rightDefinition] = entries[right];
    for (const leftBound of ["min", "max"]) for (const rightBound of ["min", "max"]) states.push({
      id: `pair:${leftKey}:${leftBound}+${rightKey}:${rightBound}`,
      parameters: clampParameters({ [leftKey]: leftDefinition[leftBound], [rightKey]: rightDefinition[rightBound] })
    });
  }
  states.push({ id: "boundary:adult-safe", parameters: clampParameters({ eyeHeight: 36, jawCraniumRatio: .68, mouthChinShare: .32, upperNeckHeadRatio: .31, shoulderHeadRatio: 2.12 }) });
  states.push({ id: "boundary:adult-blocked", parameters: clampParameters({ eyeHeight: 36, jawCraniumRatio: .67, mouthChinShare: .31, upperNeckHeadRatio: .29, shoulderHeadRatio: 2.05 }) });
  states.push({ id: "combined:worst-valid", parameters: clampParameters({ headWidth: 280, shoulderHeadRatio: 2.48, jawCraniumRatio: .67, upperNeckHeadRatio: .40, collarHeadRatio: .49, hairWidthHeadRatio: 1.32, bustShoulderRatio: .64 }) });
  return Object.freeze(states);
}
