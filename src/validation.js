import { NODE_CONTRACTS } from "./geometry.js";
import { STANDARD_BUST_SPEC as SPEC } from "./spec.js";
import { measureRenderedGeometry } from "./anatomy-paths.js";

const add = (errors, code, message, actual) => errors.push({ code, message, actual });
const symmetric = (left, right, tolerance = 0.01) => Math.abs(((left + right) / 2) - SPEC.canvas.centerX) <= tolerance;
const between = (value, range) => value >= range[0] && value <= range[1];

export function validateGeometry(geometry) {
  const errors = [];
  const { landmarks: l, measurements: m, ratios: r, parameters: p } = geometry;
  const rendered = measureRenderedGeometry(geometry);
  for (const [name, range] of Object.entries(SPEC.ratioRanges)) if (!between(r[name], range)) add(errors, `ratio.${name}`, `${name} must be ${range[0]}..${range[1]}`, r[name]);
  for (const [name, definition] of Object.entries(SPEC.parameters)) if (!between(p[name], [definition.min, definition.max])) add(errors, `parameter.${name}`, `${name} is outside its authored bounds`, p[name]);

  const faceVertical = [l.hairTop.y, l.skullTop.y, l.browLeft.y, l.eyeLeft.y, l.nose.y, l.mouth.y, l.chin.y];
  if (!strictAscending(faceVertical)) add(errors, "order.faceVertical", "Face landmarks must descend in canonical order", faceVertical);
  const bustOrderValid = m.bustEnvelopeWidth === 0 ? l.bustLeft.y === l.sternum.y : l.acromionLeft.y < l.bustLeft.y && l.bustLeft.y < l.torsoCrop.y;
  if (!(l.upperNeckLeft.y <= l.chin.y && l.chin.y < l.collarLeft.y && l.collarLeft.y < l.acromionLeft.y && bustOrderValid)) {
    add(errors, "order.bodyVertical", "Upper neck, chin, collar, acromion, bust, and crop ordering is invalid", [l.upperNeckLeft.y, l.chin.y, l.collarLeft.y, l.acromionLeft.y, l.bustLeft.y, l.torsoCrop.y]);
  }
  const horizontal = [l.acromionLeft.x, l.earTopLeft.x, l.eyeLeft.x, SPEC.canvas.centerX, l.eyeRight.x, l.earTopRight.x, l.acromionRight.x];
  if (!strictAscending(horizontal)) add(errors, "order.horizontal", "Left/right anatomy ordering is invalid", horizontal);
  for (const [name, left, right] of [
    ["eyes", l.eyeLeft.x, l.eyeRight.x], ["ears", l.earTopLeft.x, l.earTopRight.x], ["upperNeck", l.upperNeckLeft.x, l.upperNeckRight.x],
    ["collar", l.collarLeft.x, l.collarRight.x], ["acromia", l.acromionLeft.x, l.acromionRight.x], ["bust", l.bustLeft.x, l.bustRight.x]
  ]) if (!symmetric(left, right)) add(errors, `symmetry.${name}`, `${name} must remain symmetric`, [left, right]);

  if (Math.abs(l.nose.x - SPEC.canvas.centerX) > 4 || Math.abs(l.mouth.x - SPEC.canvas.centerX) > 4) add(errors, "alignment.face", "Face center must match character center", [l.nose.x, l.mouth.x]);
  if (l.chin.x !== SPEC.canvas.centerX || l.sternum.x !== SPEC.canvas.centerX) add(errors, "alignment.body", "Chin and sternum center lines disagree", [l.chin.x, l.sternum.x]);
  if (!(m.templeWidth >= m.cheekWidth && m.cheekWidth >= m.jawWidth && m.jawWidth >= m.chinWidth)) add(errors, "silhouette.monotonic", "Head width must narrow monotonically below the temple", [m.templeWidth, m.cheekWidth, m.jawWidth, m.chinWidth]);
  const drops = [m.templeWidth - m.cheekWidth, m.cheekWidth - m.jawWidth, m.jawWidth - m.chinWidth];
  if (drops.some(drop => drop < 0 || drop > m.headWidth * .42)) add(errors, "silhouette.curvature", "Adjacent head samples form an abrupt or reversed edge", drops);
  if (!between(m.earTopY, SPEC.constants.earTopRange) || !between(m.earBottomY, SPEC.constants.earBottomRange)) add(errors, "fit.earVertical", "Ear roots must intersect the allowed vertical silhouette", [m.earTopY, m.earBottomY]);
  if (!(m.upperNeckWidth < m.jawWidth && m.collarWidth >= m.upperNeckWidth)) add(errors, "fit.neckWidths", "Upper neck must be inside jaw and widen monotonically to collar", [m.upperNeckWidth, m.jawWidth, m.collarWidth]);
  const neckJoinError = Math.abs(m.upperNeckOutlineWidth - m.upperNeckWidth);
  if (neckJoinError > SPEC.constants.outlineJoinTolerance || Math.abs(l.upperNeckLeft.y - m.upperNeckJoinY) > SPEC.constants.outlineJoinTolerance) {
    add(errors, "fit.floatingNeck", "Upper-neck endpoints must intersect the measured head outline", [neckJoinError, l.upperNeckLeft.y - m.upperNeckJoinY]);
  }
  if (r.chinCranium <= .32 && r.upperNeckHead >= .40) add(errors, "correlation.chinNeck", "A wide neck cannot attach through the minimum chin shelf", [r.chinCranium, r.upperNeckHead]);
  if (!between(m.shoulderDrop, [24, 60])) add(errors, "fit.shoulderDrop", "Acromia must descend 24..60 units from shoulder roots", m.shoulderDrop);
  if (!(m.torsoWidth850 < m.garmentShoulderSpan)) add(errors, "fit.rectangularShoulders", "Torso must curve inward below garment shoulders", [m.torsoWidth850, m.garmentShoulderSpan]);
  if (!between(r.torso850Garment, SPEC.ratioRanges.torso850Garment)) add(errors, "fit.torsoTaper", "Torso width at y=850 must retain a smooth 0.78..0.90 shoulder taper", r.torso850Garment);
  if (m.garmentShoulderSpan - m.acromionSpan > SPEC.constants.garmentPaddingHeadMax * m.headWidth * 2 + .01) add(errors, "fit.garmentPadding", "Garment padding exceeds the base family contract", m.garmentShoulderSpan - m.acromionSpan);
  if (l.acromionLeft.x < SPEC.canvas.safeLeft || l.acromionRight.x > SPEC.canvas.safeRight) add(errors, "containment.shoulders", "Anatomical shoulders exceed the safe silhouette", [l.acromionLeft.x, l.acromionRight.x]);
  if (m.hairCrownOverlap < 0 || m.hairTempleOverlap < 0) add(errors, "fit.wigGap", "Measured inner-cap samples cannot leave a crown or temple gap", [m.hairCrownOverlap, m.hairTempleOverlap]);
  if (m.hairCrownOverlap < m.hairRequiredOverlap || m.hairTempleOverlap < m.hairRequiredOverlap) add(errors, "fit.hairOverlap", "Measured hair/skull overlap is below projected displacement plus safety", [m.hairCrownOverlap, m.hairTempleOverlap, m.hairRequiredOverlap]);
  if (!between(rendered.hairHead, SPEC.ratioRanges.hairHead)) add(errors, "rendered.hairHead", "The sampled visible hair contour must realize the authored hair/head ratio", rendered.hairHead);
  if (!between(rendered.bodyHead, [2.08, 2.60])) add(errors, "rendered.bodyHead", "The sampled bust silhouette must stay proportional to the rendered head", rendered.bodyHead);
  if (!between(rendered.waistShoulder, [.68, .86])) add(errors, "rendered.wedgeBody", "The sampled torso must taper continuously below the shoulder silhouette", rendered.waistShoulder);
  const distanceToPath = (path, landmark) => Math.min(...path.samples.map(sample => Math.hypot(sample.x - landmark.x, sample.y - landmark.y)));
  for (const name of ["craniumLeft", "templeLeft", "cheekLeft", "jawLeft", "chinShelfLeft", "chin", "chinShelfRight", "jawRight", "cheekRight", "templeRight", "craniumRight"]) {
    if (distanceToPath(rendered.paths.head, l[name]) > 1.1) add(errors, `rendered.head.${name}`, `${name} must be an actual sampled point on the visible head contour`, distanceToPath(rendered.paths.head, l[name]));
  }
  for (const name of ["napeLeft", "hairTop", "napeRight", "sideLockRootRight", "hairlineTempleRight", "hairlineCenter", "hairlineTempleLeft", "sideLockRootLeft"]) {
    if (distanceToPath(rendered.paths.hair, l[name]) > 1.1) add(errors, `rendered.hair.${name}`, `${name} must be an actual sampled point on the visible hair contour`, distanceToPath(rendered.paths.hair, l[name]));
  }
  for (const name of ["hairInnerTempleLeft", "hairInnerCrown", "hairInnerTempleRight"]) {
    if (distanceToPath(rendered.paths.hairFit, l[name]) > 1.1) add(errors, `rendered.hairFit.${name}`, `${name} must be sampled on the visible inner-cap fit seam`, distanceToPath(rendered.paths.hairFit, l[name]));
  }
  const hairLeft = SPEC.canvas.centerX - m.hairWidth / 2; const hairRight = SPEC.canvas.centerX + m.hairWidth / 2;
  if (!(l.acromionLeft.x + 12 < hairLeft && hairRight < l.acromionRight.x - 12)) add(errors, "containment.hairShoulderSpace", "Hair envelope needs negative space inside the acromia", [hairLeft, hairRight]);

  if (!between(m.eyeWidth, [54, 70]) || !between(m.eyeHeight, [25, 37])) add(errors, "face.eyeDimensions", "Eye dimensions exceed the adult anime contract", [m.eyeWidth, m.eyeHeight]);
  if (m.irisDiameter > m.eyeWidth - 8 || m.irisVisibleHeight > m.eyeHeight - 4 || m.irisClipRx <= 0 || m.irisClipRy <= 0) add(errors, "face.irisContainment", "The clipped visible iris must remain inside the inset eye opening", [m.irisDiameter, m.irisVisibleHeight, m.irisClipRx, m.irisClipRy]);
  if (!between(m.noseWidth, [10, 26]) || !between(m.noseHeight, [8, 26])) add(errors, "face.noseEnvelope", "Nose mark envelope is out of bounds", [m.noseWidth, m.noseHeight]);
  if (!between(m.mouthWidth, [30, 56]) || !between(m.mouthHeight, [2, 10])) add(errors, "face.mouthEnvelope", "Closed mouth envelope is out of bounds", [m.mouthWidth, m.mouthHeight]);
  const localJawWidth = m.jawWidth;
  if (m.mouthWidth / 2 + localJawWidth * .12 > localJawWidth / 2) add(errors, "face.mouthJawClearance", "Mouth corners lack local jaw clearance", m.mouthWidth);
  const adultRisks = [r.eyeHeightFace > .115, r.mouthChin < .32, r.jawCranium < .68, r.upperNeckHead < .31, r.shoulderHead < 2.12];
  if (adultRisks.filter(Boolean).length >= 3 && adultRisks[0]) add(errors, "correlation.maturity", "Combined eye occupancy, lower face, jaw, neck, and head/shoulder proportions read below the adult target", [r.eyeHeightFace, r.mouthChin, r.jawCranium, r.upperNeckHead, r.shoulderHead]);

  if (m.bustEnvelopeWidth > 0 && Math.abs(l.bustLeft.y - m.expectedBustApexY) > 4) add(errors, "fit.detachedBust", "Covered bust must remain in the shared torso deformation field", l.bustLeft.y - m.expectedBustApexY);
  const chestCenterDrop = rendered.chestCenterY - Math.min(l.shoulderRootLeft.y, l.shoulderRootRight.y);
  if (m.bustEnvelopeWidth > 0 && chestCenterDrop > 45) add(errors, "rendered.scallopedBib", "The sampled upper-chest bridge cannot hang into a scalloped bib", chestCenterDrop);
  if (l.bustUpper.x !== l.sternum.x || l.bustUpper.y !== l.sternum.y) add(errors, "fit.bustChestJoin", "The closed bust envelope must share its upper C0/C1 join with the sternum", [l.bustUpper, l.sternum]);
  if (m.bustEnvelopeWidth === 0) {
    for (const name of ["bustLeft", "bustRight", "bustInnerLeft", "bustInnerRight", "bustOuterLeft", "bustOuterRight"]) if (l[name].x !== l.bustUpper.x || l[name].y !== l.bustUpper.y) add(errors, "fit.bustCollapse", "Zero bust must collapse to the chest center without detached lobes", [name, l[name]]);
  } else if (!(l.bustOuterLeft.x < l.bustLeft.x && l.bustLeft.x < l.bustInnerLeft.x && l.bustInnerLeft.x < l.bustUpper.x && l.bustUpper.x < l.bustInnerRight.x && l.bustInnerRight.x < l.bustRight.x && l.bustRight.x < l.bustOuterRight.x)) {
    add(errors, "fit.bustContinuity", "Bust upper, outer, apex, and inner anchors must form one ordered chest-owned envelope", [l.bustOuterLeft.x, l.bustLeft.x, l.bustInnerLeft.x, l.bustUpper.x, l.bustInnerRight.x, l.bustRight.x, l.bustOuterRight.x]);
  }
  const sternumClearance = Math.min(SPEC.constants.sternumClearanceShoulder * m.acromionSpan, m.bustApexOffset * .55);
  if (m.bustEnvelopeWidth > 0 && (SPEC.canvas.centerX - l.bustInnerLeft.x < sternumClearance - .01 || l.bustInnerRight.x - SPEC.canvas.centerX < sternumClearance - .01)) add(errors, "fit.bustSternumClearance", "Covered bust violates inner sternum clearance", [l.bustInnerLeft.x, l.bustInnerRight.x, sternumClearance]);
  const torsoHalfAtBust = m.torsoWidth850 / 2 + 25;
  if (m.bustEnvelopeWidth / 2 > torsoHalfAtBust - SPEC.constants.bustOuterClearance) add(errors, "fit.bustInsideTorso", "Covered bust envelope exceeds torso/arm clearance", m.bustEnvelopeWidth);
  for (const [name, landmark] of Object.entries(l)) if (!(landmark.parent in NODE_CONTRACTS)) add(errors, `ownership.${name}`, `${name} has no canonical parent socket`, landmark.parent);

  const earTopSpan = l.earTopRight.x - l.earTopLeft.x;
  const earBottomSpan = l.earBottomRight.x - l.earBottomLeft.x;
  if (Math.abs(earTopSpan - m.earTopOutlineWidth) > SPEC.constants.outlineJoinTolerance || Math.abs(earBottomSpan - m.earBottomOutlineWidth) > SPEC.constants.outlineJoinTolerance) {
    add(errors, "fit.earOutline", "Each ear root must be derived from the head outline at its own Y", [earTopSpan, m.earTopOutlineWidth, earBottomSpan, m.earBottomOutlineWidth]);
  }
  return Object.freeze({ status: errors.length ? "Blocked" : "Needs review", errors: Object.freeze(errors) });
}

const strictAscending = values => values.every((value, index) => index === 0 || values[index - 1] < value);

export function validateNodeContracts(contracts = NODE_CONTRACTS) {
  const errors = [];
  for (const [id, node] of Object.entries(contracts)) {
    if (["x", "y", "globalX", "globalY"].some(key => key in node)) add(errors, `global.${id}`, "Node contracts cannot store stage-global positions", node);
    if (id !== "character.root" && !(node.parent in contracts)) add(errors, `parent.${id}`, "Node parent is missing", node.parent);
    const visited = new Set([id]); let cursor = node.parent;
    while (cursor) {
      if (visited.has(cursor)) { add(errors, `cycle.${id}`, "Node graph contains a cycle", cursor); break; }
      visited.add(cursor); cursor = contracts[cursor]?.parent;
    }
  }
  return Object.freeze(errors);
}
