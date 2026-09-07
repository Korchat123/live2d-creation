import { C, L, M, Q, Z, intersectionsAtY, pathBounds, samplePath, serializePath } from "./path-metrics.js";

const n = value => Number(value.toFixed(2));
const renderedGeometryCache = new WeakMap();
const path = (parent, landmarks, commands) => Object.freeze({
  parent,
  landmarks: Object.freeze(landmarks),
  commands: Object.freeze(commands),
  d: serializePath(commands),
  samples: samplePath(commands),
  bounds: pathBounds(commands)
});

const samePoint = (a, b, epsilon = .001) => Math.hypot(a.x - b.x, a.y - b.y) <= epsilon;

// A closed Catmull-Rom-style envelope expressed as cubic SVG segments.  The
// tangent at every named endpoint is shared by the incoming and outgoing
// cubic, so continuity is a property of the rendered path, not metadata.
function closedSpline(points, tension = .58) {
  const tangents = points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    if (samePoint(previous, current) || samePoint(current, next)) return { x: 0, y: 0 };
    return { x: (next.x - previous.x) * tension, y: (next.y - previous.y) * tension };
  });
  const commands = [M(points[0].x, points[0].y)];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const nextIndex = (index + 1) % points.length;
    const next = points[nextIndex];
    commands.push(C(
      current.x + tangents[index].x / 3,
      current.y + tangents[index].y / 3,
      next.x - tangents[nextIndex].x / 3,
      next.y - tangents[nextIndex].y / 3,
      next.x,
      next.y
    ));
  }
  commands.push(Z());
  return commands;
}

// A closed spline for independently filled attachment surfaces. Control
// handles are clamped to the local segment box so a smooth shoulder cannot
// overshoot into, and accidentally seal, the axillary gap.
function closedSplineClamped(points, tension = .46) {
  const tangents = points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    return { x: (next.x - previous.x) * tension, y: (next.y - previous.y) * tension };
  });
  const clamp = (value, a, b) => Math.max(Math.min(a, b) - 1.5, Math.min(Math.max(a, b) + 1.5, value));
  const commands = [M(points[0].x, points[0].y)];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const nextIndex = (index + 1) % points.length;
    const next = points[nextIndex];
    commands.push(C(
      clamp(current.x + tangents[index].x / 3, current.x, next.x),
      clamp(current.y + tangents[index].y / 3, current.y, next.y),
      clamp(next.x - tangents[nextIndex].x / 3, current.x, next.x),
      clamp(next.y - tangents[nextIndex].y / 3, current.y, next.y),
      next.x, next.y
    ));
  }
  commands.push(Z());
  return commands;
}

// Convert an ordered anatomical contour to cubic segments with one shared
// derivative at each interior landmark. This makes acromion continuity a
// property of the SVG commands rather than a visual approximation.
function openSpline(points, tension = .62, verticalAt = []) {
  const tangents = points.map((current, index) => {
    if (index === 0) return { x: (points[1].x - current.x) * tension, y: (points[1].y - current.y) * tension };
    if (index === points.length - 1) return { x: (current.x - points[index - 1].x) * tension, y: (current.y - points[index - 1].y) * tension };
    if (verticalAt.some(point => samePoint(point, current))) {
      const deltaY = points[index + 1].y - points[index - 1].y;
      return { x: 0, y: Math.sign(deltaY) * Math.max(30, Math.abs(deltaY) * tension * 1.15) };
    }
    return { x: (points[index + 1].x - points[index - 1].x) * tension, y: (points[index + 1].y - points[index - 1].y) * tension };
  });
  return points.slice(1).map((next, index) => {
    const current = points[index];
    return C(
      current.x + tangents[index].x / 3, current.y + tangents[index].y / 3,
      next.x - tangents[index + 1].x / 3, next.y - tangents[index + 1].y / 3,
      next.x, next.y
    );
  });
}

export function buildAnatomyPaths(geometry) {
  const { landmarks: l, measurements: m, mutations } = geometry;
  const head = path("head.root", ["skullTop", "craniumLeft", "templeLeft", "cheekLeft", "jawLeft", "chinShelfLeft", "chin", "chinShelfRight", "jawRight", "cheekRight", "templeRight", "craniumRight"], [
    M(l.skullTop.x, l.skullTop.y),
    C(l.skullTop.x - m.headWidth * .26, l.skullTop.y - 1, l.craniumLeft.x + 6, l.craniumLeft.y - 22, l.craniumLeft.x, l.craniumLeft.y),
    C(l.craniumLeft.x, l.craniumLeft.y + 22, l.templeLeft.x, l.templeLeft.y - 18, l.templeLeft.x, l.templeLeft.y),
    C(l.templeLeft.x - 2, l.templeLeft.y + 42, l.cheekLeft.x - 2, l.cheekLeft.y - 20, l.cheekLeft.x, l.cheekLeft.y),
    C(l.cheekLeft.x + 1, l.cheekLeft.y + 42, l.jawLeft.x - 3, l.jawLeft.y - 34, l.jawLeft.x, l.jawLeft.y),
    C(l.jawLeft.x + 8, l.jawLeft.y + 28, l.chinShelfLeft.x - 12, l.chinShelfLeft.y - 10, l.chinShelfLeft.x, l.chinShelfLeft.y),
    Q(l.skullTop.x - m.chinWidth * .20, l.chin.y, l.chin.x, l.chin.y),
    Q(l.skullTop.x + m.chinWidth * .20, l.chin.y, l.chinShelfRight.x, l.chinShelfRight.y),
    C(l.chinShelfRight.x + 12, l.chinShelfRight.y - 10, l.jawRight.x - 8, l.jawRight.y + 28, l.jawRight.x, l.jawRight.y),
    C(l.jawRight.x + 3, l.jawRight.y - 34, l.cheekRight.x - 1, l.cheekRight.y + 42, l.cheekRight.x, l.cheekRight.y),
    C(l.cheekRight.x + 2, l.cheekRight.y - 20, l.templeRight.x + 2, l.templeRight.y + 42, l.templeRight.x, l.templeRight.y),
    C(l.templeRight.x, l.templeRight.y - 18, l.craniumRight.x, l.craniumRight.y + 22, l.craniumRight.x, l.craniumRight.y),
    C(l.craniumRight.x - 6, l.craniumRight.y - 22, l.skullTop.x + m.headWidth * .26, l.skullTop.y - 1, l.skullTop.x, l.skullTop.y), Z()
  ]);

  const hairOuterLeft = 500 - m.hairWidth / 2; const hairOuterRight = 500 + m.hairWidth / 2;
  const hairBack = path("hair.back", ["napeLeft", "hairTop", "napeRight", "sideLockRootRight", "hairlineTempleRight", "hairlineCenter", "hairlineTempleLeft", "sideLockRootLeft"], [
    M(l.napeLeft.x, l.napeLeft.y),
    C(hairOuterLeft + 8, l.napeLeft.y - 72, hairOuterLeft, l.templeLeft.y + 4, hairOuterLeft, l.templeLeft.y - 18),
    C(hairOuterLeft, l.hairTop.y + 45, 500 - m.hairWidth * .24, l.hairTop.y, l.hairTop.x, l.hairTop.y),
    C(500 + m.hairWidth * .24, l.hairTop.y, hairOuterRight, l.hairTop.y + 45, hairOuterRight, l.templeRight.y - 18),
    C(hairOuterRight, l.templeRight.y + 4, hairOuterRight - 8, l.napeRight.y - 72, l.napeRight.x, l.napeRight.y),
    L(l.sideLockRootRight.x, l.sideLockRootRight.y),
    C(l.sideLockRootRight.x - 8, l.sideLockRootRight.y - 18, l.hairlineTempleRight.x + 10, l.hairlineTempleRight.y + 10, l.hairlineTempleRight.x, l.hairlineTempleRight.y),
    C(l.hairlineTempleRight.x - 22, l.hairlineTempleRight.y - 10, l.hairlineCenter.x + 32, l.hairlineCenter.y - 3, l.hairlineCenter.x, l.hairlineCenter.y),
    C(l.hairlineCenter.x - 32, l.hairlineCenter.y - 3, l.hairlineTempleLeft.x + 22, l.hairlineTempleLeft.y - 10, l.hairlineTempleLeft.x, l.hairlineTempleLeft.y),
    C(l.hairlineTempleLeft.x - 10, l.hairlineTempleLeft.y + 10, l.sideLockRootLeft.x + 8, l.sideLockRootLeft.y - 18, l.sideLockRootLeft.x, l.sideLockRootLeft.y),
    L(l.napeLeft.x, l.napeLeft.y), Z()
  ]);
  const hairFront = path("hair.front", ["sideLockRootLeft", "hairlineTempleLeft", "hairlineCenter", "hairlineTempleRight", "sideLockRootRight"], [
    M(l.sideLockRootLeft.x, l.sideLockRootLeft.y),
    C(l.sideLockRootLeft.x + 8, l.sideLockRootLeft.y - 18, l.hairlineTempleLeft.x - 10, l.hairlineTempleLeft.y + 10, l.hairlineTempleLeft.x, l.hairlineTempleLeft.y),
    C(l.hairlineTempleLeft.x + 22, l.hairlineTempleLeft.y - 10, l.hairlineCenter.x - 32, l.hairlineCenter.y - 3, l.hairlineCenter.x, l.hairlineCenter.y),
    C(l.hairlineCenter.x + 32, l.hairlineCenter.y - 3, l.hairlineTempleRight.x - 22, l.hairlineTempleRight.y - 10, l.hairlineTempleRight.x, l.hairlineTempleRight.y),
    C(l.hairlineTempleRight.x + 10, l.hairlineTempleRight.y + 10, l.sideLockRootRight.x - 8, l.sideLockRootRight.y - 18, l.sideLockRootRight.x, l.sideLockRootRight.y)
  ]);
  const hairFit = path("hair.front", ["hairInnerTempleLeft", "hairInnerCrown", "hairInnerTempleRight"], [
    M(l.hairInnerTempleLeft.x, l.hairInnerTempleLeft.y),
    C(l.hairInnerTempleLeft.x + 8, l.skullTop.y + 32, 500 - 58, l.hairInnerCrown.y, l.hairInnerCrown.x, l.hairInnerCrown.y),
    C(500 + 58, l.hairInnerCrown.y, l.hairInnerTempleRight.x - 8, l.skullTop.y + 32, l.hairInnerTempleRight.x, l.hairInnerTempleRight.y)
  ]);

  const badWedge = mutations.bodyStyle === "wedge";
  const bodyLeft850 = badWedge ? l.acromionLeft.x - 26 : l.torso850Left.x;
  const bodyRight850 = badWedge ? l.acromionRight.x + 26 : l.torso850Right.x;
  const cropLeft = l.waistLeft.x;
  const cropRight = l.waistRight.x;
  const wallLeft = mutations.shoulderStyle === "wall"
    ? { ...l.deltoidOuterLeft, x: l.acromionLeft.x }
    : l.deltoidOuterLeft;
  const wallRight = mutations.shoulderStyle === "wall"
    ? { ...l.deltoidOuterRight, x: l.acromionRight.x }
    : l.deltoidOuterRight;
  const upperArmLeft = mutations.shoulderStyle === "wall" ? { ...l.upperArmLeft, x: l.acromionLeft.x } : l.upperArmLeft;
  const upperArmRight = mutations.shoulderStyle === "wall" ? { ...l.upperArmRight, x: l.acromionRight.x } : l.upperArmRight;
  const shoulderCapLeft = mutations.shoulderStyle === "wall" ? { ...l.shoulderCapLeft, x: l.acromionLeft.x } : l.shoulderCapLeft;
  const shoulderCapRight = mutations.shoulderStyle === "wall" ? { ...l.shoulderCapRight, x: l.acromionRight.x } : l.shoulderCapRight;
  const left850 = mutations.shoulderStyle === "wall" ? l.acromionLeft.x : bodyLeft850;
  const right850 = mutations.shoulderStyle === "wall" ? l.acromionRight.x : bodyRight850;
  const bustSideLeft = mutations.shoulderStyle === "wall" ? { ...l.bustSideLeft, x: l.acromionLeft.x } : l.bustSideLeft;
  const bustSideRight = mutations.shoulderStyle === "wall" ? { ...l.bustSideRight, x: l.acromionRight.x } : l.bustSideRight;
  // Five independently authored surfaces. The torso dives medially after its
  // shoulder-only attachment while each arm continues on its own outward axis.
  const torsoLeft = [l.torsoUpperNeckLeft, l.torsoShoulderRootLeft, l.torsoTrapeziusLeft, l.torsoShoulderAttachUpperLeft, l.torsoShoulderAttachLowerLeft, l.torsoAxillaLipLeft, l.torsoAxillaLeft, bustSideLeft, { x: left850, y: 850 }, l.waistLeft, { x: cropLeft, y: 970 }];
  const torsoRight = [{ x: cropRight, y: 970 }, l.waistRight, { x: right850, y: 850 }, bustSideRight, l.torsoAxillaRight, l.torsoAxillaLipRight, l.torsoShoulderAttachLowerRight, l.torsoShoulderAttachUpperRight, l.torsoTrapeziusRight, l.torsoShoulderRootRight, l.torsoUpperNeckRight];
  const torso = path("torso.root", ["torsoUpperNeckLeft", "torsoShoulderRootLeft", "torsoTrapeziusLeft", "torsoShoulderAttachUpperLeft", "torsoShoulderAttachLowerLeft", "torsoAxillaLipLeft", "torsoAxillaLeft", "bustSideLeft", "torso850Left", "waistLeft", "waistRight", "torso850Right", "bustSideRight", "torsoAxillaRight", "torsoAxillaLipRight", "torsoShoulderAttachLowerRight", "torsoShoulderAttachUpperRight", "torsoTrapeziusRight", "torsoShoulderRootRight", "torsoUpperNeckRight"], [
    M(torsoLeft[0].x, torsoLeft[0].y), ...openSpline(torsoLeft, .54),
    L(torsoRight[0].x, torsoRight[0].y), ...openSpline(torsoRight, .54), Z()
  ]);

  const decorativeOnly = ["decorativeSeam", "fusedContainer"].includes(mutations.surfaceStyle);
  const leftArmCommands = decorativeOnly
    ? [M(l.armDeltoidAttachOuterLeft.x, l.armDeltoidAttachOuterLeft.y), L(l.armDeltoidAttachInnerLeft.x, l.armDeltoidAttachInnerLeft.y)]
    : closedSplineClamped([l.armDeltoidAttachOuterLeft, l.armOuterShoulderLeft, l.armOuterMidLeft, l.independentArmCropOuterLeft, l.independentArmCropInnerLeft, l.armInnerMidLeft, l.armInnerShoulderLeft, l.armDeltoidAttachInnerLeft], .34);
  const rightArmCommands = decorativeOnly
    ? [M(l.armDeltoidAttachInnerRight.x, l.armDeltoidAttachInnerRight.y), L(l.armDeltoidAttachOuterRight.x, l.armDeltoidAttachOuterRight.y)]
    : closedSplineClamped([l.armDeltoidAttachInnerRight, l.armInnerShoulderRight, l.armInnerMidRight, l.independentArmCropInnerRight, l.independentArmCropOuterRight, l.armOuterMidRight, l.armOuterShoulderRight, l.armDeltoidAttachOuterRight], .34);
  const arms = Object.freeze({
    left: path("arm.left", ["armDeltoidAttachOuterLeft", "armOuterShoulderLeft", "armOuterMidLeft", "independentArmCropOuterLeft", "independentArmCropInnerLeft", "armInnerMidLeft", "armInnerShoulderLeft", "armDeltoidAttachInnerLeft"], leftArmCommands),
    right: path("arm.right", ["armDeltoidAttachInnerRight", "armInnerShoulderRight", "armInnerMidRight", "independentArmCropInnerRight", "independentArmCropOuterRight", "armOuterMidRight", "armOuterShoulderRight", "armDeltoidAttachOuterRight"], rightArmCommands)
  });

  const leftDeltoidPoints = [l.deltoidTorsoAttachUpperLeft, l.deltoidShoulderLeft, l.acromionLeft, l.deltoidApexLeft, wallLeft, l.deltoidArmAttachOuterLeft, l.deltoidArmAttachInnerLeft, l.deltoidInnerRiseLeft, l.deltoidTorsoAttachLowerLeft];
  const rightDeltoidPoints = [l.deltoidTorsoAttachLowerRight, l.deltoidInnerRiseRight, l.deltoidArmAttachInnerRight, l.deltoidArmAttachOuterRight, wallRight, l.deltoidApexRight, l.acromionRight, l.deltoidShoulderRight, l.deltoidTorsoAttachUpperRight];
  const deltoids = Object.freeze({
    left: path("shoulder.left", ["deltoidTorsoAttachUpperLeft", "deltoidShoulderLeft", "acromionLeft", "deltoidApexLeft", "deltoidOuterLeft", "deltoidArmAttachOuterLeft", "deltoidArmAttachInnerLeft", "deltoidInnerRiseLeft", "deltoidTorsoAttachLowerLeft"], decorativeOnly ? leftArmCommands : closedSplineClamped(leftDeltoidPoints, .38)),
    right: path("shoulder.right", ["deltoidTorsoAttachLowerRight", "deltoidInnerRiseRight", "deltoidArmAttachInnerRight", "deltoidArmAttachOuterRight", "deltoidOuterRight", "deltoidApexRight", "acromionRight", "deltoidShoulderRight", "deltoidTorsoAttachUpperRight"], decorativeOnly ? rightArmCommands : closedSplineClamped(rightDeltoidPoints, .38))
  });

  const exposedOutlines = Object.freeze({
    torso: path("torso.root", ["torsoUpperNeckLeft", "torsoShoulderRootLeft", "torsoTrapeziusLeft", "torsoShoulderAttachUpperLeft", "torsoShoulderAttachLowerLeft", "torsoAxillaLipLeft", "torsoAxillaLeft", "bustSideLeft", "torso850Left", "waistLeft", "waistRight", "torso850Right", "bustSideRight", "torsoAxillaRight", "torsoAxillaLipRight", "torsoShoulderAttachLowerRight", "torsoShoulderAttachUpperRight", "torsoTrapeziusRight", "torsoShoulderRootRight", "torsoUpperNeckRight"], [
      M(l.torsoUpperNeckLeft.x,l.torsoUpperNeckLeft.y), ...openSpline([l.torsoUpperNeckLeft,l.torsoShoulderRootLeft,l.torsoTrapeziusLeft,l.torsoShoulderAttachUpperLeft], .54),
      M(l.torsoShoulderAttachLowerLeft.x,l.torsoShoulderAttachLowerLeft.y), ...openSpline([l.torsoShoulderAttachLowerLeft,l.torsoAxillaLipLeft,l.torsoAxillaLeft,bustSideLeft,{x:left850,y:850},l.waistLeft,{x:cropLeft,y:970}], .54),
      L(cropRight,970), ...openSpline([{x:cropRight,y:970},l.waistRight,{x:right850,y:850},bustSideRight,l.torsoAxillaRight,l.torsoAxillaLipRight,l.torsoShoulderAttachLowerRight], .54),
      M(l.torsoShoulderAttachUpperRight.x,l.torsoShoulderAttachUpperRight.y), ...openSpline([l.torsoShoulderAttachUpperRight,l.torsoTrapeziusRight,l.torsoShoulderRootRight,l.torsoUpperNeckRight], .54)
    ]),
    leftDeltoid: path("shoulder.left", ["deltoidTorsoAttachUpperLeft", "deltoidShoulderLeft", "acromionLeft", "deltoidApexLeft", "deltoidOuterLeft", "deltoidArmAttachOuterLeft", "deltoidArmAttachInnerLeft", "deltoidInnerRiseLeft", "deltoidTorsoAttachLowerLeft"], [
      M(l.deltoidTorsoAttachUpperLeft.x,l.deltoidTorsoAttachUpperLeft.y), ...openSpline([l.deltoidTorsoAttachUpperLeft,l.deltoidShoulderLeft,l.acromionLeft,l.deltoidApexLeft,wallLeft,l.deltoidArmAttachOuterLeft], .42),
      M(l.deltoidArmAttachInnerLeft.x,l.deltoidArmAttachInnerLeft.y), ...openSpline([l.deltoidArmAttachInnerLeft,l.deltoidInnerRiseLeft,l.deltoidTorsoAttachLowerLeft], .42)
    ]),
    rightDeltoid: path("shoulder.right", ["deltoidTorsoAttachLowerRight", "deltoidInnerRiseRight", "deltoidArmAttachInnerRight", "deltoidArmAttachOuterRight", "deltoidOuterRight", "deltoidApexRight", "acromionRight", "deltoidShoulderRight", "deltoidTorsoAttachUpperRight"], [
      M(l.deltoidTorsoAttachLowerRight.x,l.deltoidTorsoAttachLowerRight.y), ...openSpline([l.deltoidTorsoAttachLowerRight,l.deltoidInnerRiseRight,l.deltoidArmAttachInnerRight], .42),
      M(l.deltoidArmAttachOuterRight.x,l.deltoidArmAttachOuterRight.y), ...openSpline([l.deltoidArmAttachOuterRight,wallRight,l.deltoidApexRight,l.acromionRight,l.deltoidShoulderRight,l.deltoidTorsoAttachUpperRight], .42)
    ]),
    leftArm: path("arm.left", ["armDeltoidAttachOuterLeft", "armOuterShoulderLeft", "armOuterMidLeft", "independentArmCropOuterLeft", "independentArmCropInnerLeft", "armInnerMidLeft", "armInnerShoulderLeft", "armDeltoidAttachInnerLeft"], [
      M(l.armDeltoidAttachOuterLeft.x,l.armDeltoidAttachOuterLeft.y), ...openSpline([l.armDeltoidAttachOuterLeft,l.armOuterShoulderLeft,l.armOuterMidLeft,l.independentArmCropOuterLeft], .42),
      M(l.independentArmCropInnerLeft.x,l.independentArmCropInnerLeft.y), ...openSpline([l.independentArmCropInnerLeft,l.armInnerMidLeft,l.armInnerShoulderLeft,l.armDeltoidAttachInnerLeft], .42)
    ]),
    rightArm: path("arm.right", ["armDeltoidAttachInnerRight", "armInnerShoulderRight", "armInnerMidRight", "independentArmCropInnerRight", "independentArmCropOuterRight", "armOuterMidRight", "armOuterShoulderRight", "armDeltoidAttachOuterRight"], [
      M(l.armDeltoidAttachInnerRight.x,l.armDeltoidAttachInnerRight.y), ...openSpline([l.armDeltoidAttachInnerRight,l.armInnerShoulderRight,l.armInnerMidRight,l.independentArmCropInnerRight], .42),
      M(l.independentArmCropOuterRight.x,l.independentArmCropOuterRight.y), ...openSpline([l.independentArmCropOuterRight,l.armOuterMidRight,l.armOuterShoulderRight,l.armDeltoidAttachOuterRight], .42)
    ])
  });

  // Kept as the canonical body entry for consumers, but it now aliases the
  // central torso surface rather than a shield-shaped whole-body polygon.
  const body = torso;

  const neckGuide = path("neck.root", ["upperNeckLeft", "collarLeft", "collarRight", "upperNeckRight"], [M(l.upperNeckLeft.x,l.upperNeckLeft.y), C(l.upperNeckLeft.x,l.collarLeft.y-22,l.collarLeft.x,l.collarLeft.y-10,l.collarLeft.x,l.collarLeft.y), M(l.upperNeckRight.x,l.upperNeckRight.y), C(l.upperNeckRight.x,l.collarRight.y-22,l.collarRight.x,l.collarRight.y-10,l.collarRight.x,l.collarRight.y)]);
  const shoulderGuide = path("collar.center", ["shoulderRootLeft", "sternum", "shoulderRootRight"], [M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), C(420,l.sternum.y-22,465,l.sternum.y,l.sternum.x,l.sternum.y), C(535,l.sternum.y,580,l.sternum.y-22,l.shoulderRootRight.x,l.shoulderRootRight.y)]);
  const armSeams = Object.freeze({
    left: path("torso.root", ["torsoAxillaLipLeft", "torsoAxillaLeft"], [M(l.torsoAxillaLipLeft.x,l.torsoAxillaLipLeft.y), Q(l.torsoAxillaLeft.x-3,(l.torsoAxillaLipLeft.y+l.torsoAxillaLeft.y)/2,l.torsoAxillaLeft.x,l.torsoAxillaLeft.y)]),
    right: path("torso.root", ["torsoAxillaLipRight", "torsoAxillaRight"], [M(l.torsoAxillaLipRight.x,l.torsoAxillaLipRight.y), Q(l.torsoAxillaRight.x+3,(l.torsoAxillaLipRight.y+l.torsoAxillaRight.y)/2,l.torsoAxillaRight.x,l.torsoAxillaRight.y)])
  });
  const armGuides = armSeams;

  // A torso-owned ribcage field. Bust anchors are internal deformation
  // controls, never the visible perimeter, so zero bust retains this same
  // broad topology instead of degenerating into a detached triangle.
  const chestLandmarks = ["sternum", "upperRibRight", "chestSideRight", "lowerRibRight", "lowerRibCenter", "lowerRibLeft", "chestSideLeft", "upperRibLeft", "bustInnerRight", "bustRight", "bustOuterRight", "bustOuterLeft", "bustLeft", "bustInnerLeft"];
  const chestBoundaryNames = ["sternum", "upperRibRight", "chestSideRight", "lowerRibRight", "lowerRibCenter", "lowerRibLeft", "chestSideLeft", "upperRibLeft"];
  const chestPoints = chestBoundaryNames.map(name => l[name]);
  const chestCommands = mutations.chestStyle === "scalloped"
    ? [M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), Q(l.bustLeft.x,l.bustLeft.y-30,l.bustLeft.x,l.bustLeft.y+45), Q(l.sternum.x,l.bustLeft.y+95,l.sternum.x,l.bustLeft.y+55), Q(l.bustRight.x,l.bustRight.y+95,l.bustRight.x,l.bustRight.y+45), Q(l.bustRight.x,l.bustRight.y-30,l.shoulderRootRight.x,l.shoulderRootRight.y)]
    : closedSpline(chestPoints, .48);
  const chest = path("torso.root", chestLandmarks, chestCommands);
  const ears = {
    left: path("ear.left", ["earTopLeft","earBottomLeft"], [M(l.earTopLeft.x,l.earTopLeft.y), C(l.earTopLeft.x-25,l.earTopLeft.y+9,l.earBottomLeft.x-25,l.earBottomLeft.y-10,l.earBottomLeft.x,l.earBottomLeft.y), C(l.earBottomLeft.x+10,l.earBottomLeft.y-18,l.earTopLeft.x+10,l.earTopLeft.y+20,l.earTopLeft.x,l.earTopLeft.y), Z()]),
    right: path("ear.right", ["earTopRight","earBottomRight"], [M(l.earTopRight.x,l.earTopRight.y), C(l.earTopRight.x+25,l.earTopRight.y+9,l.earBottomRight.x+25,l.earBottomRight.y-10,l.earBottomRight.x,l.earBottomRight.y), C(l.earBottomRight.x-10,l.earBottomRight.y-18,l.earTopRight.x-10,l.earTopRight.y+20,l.earTopRight.x,l.earTopRight.y), Z()]),
    innerLeft: path("ear.left", ["earTopLeft","earBottomLeft"], [M(l.earTopLeft.x-2,l.earTopLeft.y+24), Q(l.earTopLeft.x-14,(l.earTopLeft.y+l.earBottomLeft.y)/2,l.earBottomLeft.x-2,l.earBottomLeft.y-22)]),
    innerRight: path("ear.right", ["earTopRight","earBottomRight"], [M(l.earTopRight.x+2,l.earTopRight.y+24), Q(l.earTopRight.x+14,(l.earTopRight.y+l.earBottomRight.y)/2,l.earBottomRight.x+2,l.earBottomRight.y-22)])
  };
  const topology = Object.freeze({
    surfaces: Object.freeze(["arm.left", "arm.right", "torso.root", "shoulder.left", "shoulder.right"]),
    edges: Object.freeze([
      Object.freeze({ from: "arm.left", to: "shoulder.left", seam: "left-insertion", guides: Object.freeze([["armInsertionGuideOuterLeft", "deltoidInsertionGuideOuterLeft"], ["armInsertionGuideInnerLeft", "deltoidInsertionGuideInnerLeft"]]) }),
      Object.freeze({ from: "arm.right", to: "shoulder.right", seam: "right-insertion", guides: Object.freeze([["armInsertionGuideOuterRight", "deltoidInsertionGuideOuterRight"], ["armInsertionGuideInnerRight", "deltoidInsertionGuideInnerRight"]]) }),
      Object.freeze({ from: "shoulder.left", to: "torso.root", seam: "left-shoulder", guides: Object.freeze([["deltoidTorsoGuideUpperLeft", "torsoShoulderGuideUpperLeft"], ["deltoidTorsoGuideLowerLeft", "torsoShoulderGuideLowerLeft"]]) }),
      Object.freeze({ from: "shoulder.right", to: "torso.root", seam: "right-shoulder", guides: Object.freeze([["deltoidTorsoGuideUpperRight", "torsoShoulderGuideUpperRight"], ["deltoidTorsoGuideLowerRight", "torsoShoulderGuideLowerRight"]]) })
    ]),
    zOrder: Object.freeze(["arm.left", "arm.right", "torso.root", "shoulder.left", "shoulder.right"])
  });
  return Object.freeze({ head, hair: hairBack, hairBack, hairFront, hairFit, body, torso, arms, deltoids, exposedOutlines, neckGuide, shoulderGuide, armGuides, armSeams, chest, ears, topology });
}

const nearestYAtX = (samples, x) => samples.reduce((best, point) => Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best).y;

function cubicJoinAt(commands, point) {
  const index = commands.findIndex(command => command.type === "C" && samePoint(command, point));
  const incoming = commands[index]; const outgoing = commands[index + 1];
  if (!incoming || outgoing?.type !== "C") return { mismatch: Infinity, angle: Infinity };
  const a = { x: point.x - incoming.x2, y: point.y - incoming.y2 };
  const b = { x: outgoing.x1 - point.x, y: outgoing.y1 - point.y };
  const mismatch = Math.hypot(a.x - b.x, a.y - b.y);
  const denominator = Math.max(.0001, Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  const cosine = Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / denominator));
  return { mismatch: n(mismatch), angle: n(Math.acos(cosine) * 180 / Math.PI) };
}

function shoulderChordDeviation(commands, acromion, upperArm) {
  const middleY = (acromion.y + upperArm.y) / 2;
  const hit = y => intersectionsAtY(commands, y)[0];
  const startX = hit(acromion.y + 1); const middleX = hit(middleY); const endX = hit(upperArm.y);
  if (![startX, middleX, endX].every(Number.isFinite)) return 0;
  const linearMiddle = startX + (endX - startX) * ((middleY - (acromion.y + 1)) / (upperArm.y - (acromion.y + 1)));
  return n(Math.abs(middleX - linearMiddle));
}

function shoulderMaxStraightRun(commands, acromionY) {
  const points = [];
  for (let y = Math.ceil(acromionY + 5); y <= 850; y += 8) {
    const x = intersectionsAtY(commands, y)[0];
    if (Number.isFinite(x)) points.push({ x, y });
  }
  let longest = 0;
  for (let start = 0; start < points.length - 2; start += 1) {
    for (let end = start + 2; end < points.length; end += 1) {
      const a = points[start]; const b = points[end];
      const deviation = points.slice(start + 1, end).reduce((maximum, point) => {
        const expected = a.x + (b.x - a.x) * ((point.y - a.y) / (b.y - a.y));
        return Math.max(maximum, Math.abs(point.x - expected));
      }, 0);
      if (deviation <= .8) longest = Math.max(longest, b.y - a.y);
    }
  }
  return n(longest);
}

function shoulderShelfLength(commands, shoulderRoot, acromion) {
  const acromionIndex = commands.findIndex(command => command.type === "C" && samePoint(command, acromion));
  if (acromionIndex < 0) return Infinity;
  const points = samplePath(commands.slice(0, acromionIndex + 1), 24)
    .filter(point => point.x <= shoulderRoot.x + .01 && point.x >= acromion.x - .01 && point.y >= shoulderRoot.y - 2 && point.y <= acromion.y + 2);
  let longest = 0; let run = 0;
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;
    if (Math.abs(dx) > .01 && Math.abs(dy / dx) < .08) {
      run += Math.hypot(dx, dy); longest = Math.max(longest, run);
    } else run = 0;
  }
  return n(longest);
}

const filledSurfaces = paths => [paths.arms.left, paths.arms.right, paths.torso, paths.deltoids.left, paths.deltoids.right];

function mergedIntervalsAtY(paths, y) {
  const intervals = filledSurfaces(paths).flatMap(surface => {
    const hits = [...intersectionsAtY(surface.commands, y)].sort((a, b) => a - b);
    const output = [];
    for (let index = 0; index + 1 < hits.length; index += 2) output.push([hits[index], hits[index + 1]]);
    return output;
  }).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of intervals) {
    const last = merged.at(-1);
    if (!last || interval[0] > last[1] + .01) merged.push([...interval]);
    else last[1] = Math.max(last[1], interval[1]);
  }
  return merged;
}

const surfaceIntersectionsAtY = (paths, y) => mergedIntervalsAtY(paths, y).flat();

function compositeBounds(paths) {
  const surfaces = filledSurfaces(paths);
  return Object.freeze({
    minX: Math.min(...surfaces.map(surface => surface.bounds.minX)),
    maxX: Math.max(...surfaces.map(surface => surface.bounds.maxX)),
    minY: Math.min(...surfaces.map(surface => surface.bounds.minY)),
    maxY: Math.max(...surfaces.map(surface => surface.bounds.maxY)),
    width: Math.max(...surfaces.map(surface => surface.bounds.maxX)) - Math.min(...surfaces.map(surface => surface.bounds.minX)),
    height: Math.max(...surfaces.map(surface => surface.bounds.maxY)) - Math.min(...surfaces.map(surface => surface.bounds.minY))
  });
}

function intervalsAtY(surface, y) {
  const hits = [...intersectionsAtY(surface.commands, y)].sort((a, b) => a - b);
  const intervals = [];
  for (let index = 0; index + 1 < hits.length; index += 2) intervals.push([hits[index], hits[index + 1]]);
  return intervals;
}

function intervalsAtX(surface, x) {
  const hits = [];
  const samples = surface.samples;
  for (let index = 1; index < samples.length; index += 1) {
    const a = samples[index - 1]; const b = samples[index];
    if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) hits.push(a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x)));
  }
  hits.sort((a, b) => a - b);
  const intervals = [];
  for (let index = 0; index + 1 < hits.length; index += 2) intervals.push([hits[index], hits[index + 1]]);
  return intervals;
}

function maximumIntersectionDepth(first, second, coordinate, vertical = false) {
  const a = vertical ? intervalsAtX(first, coordinate) : intervalsAtY(first, coordinate);
  const b = vertical ? intervalsAtX(second, coordinate) : intervalsAtY(second, coordinate);
  let maximum = 0;
  for (const left of a) for (const right of b) maximum = Math.max(maximum, Math.min(left[1], right[1]) - Math.max(left[0], right[0]));
  return n(Math.max(0, maximum));
}

function sampledOverlapDepths(first, second, start, end, vertical = false) {
  return Object.freeze(Array.from({ length: 8 }, (_, index) => maximumIntersectionDepth(first, second, start + (end - start) * ((index + 1) / 9), vertical)));
}

function pointInside(surface, point) {
  const polygon = surface.samples; let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index]; const b = polygon[previous];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function exposedContribution(surface, occluders, step = 12) {
  let count = 0; let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  for (let y = Math.floor(surface.bounds.minY); y <= Math.ceil(surface.bounds.maxY); y += step) for (let x = Math.floor(surface.bounds.minX); x <= Math.ceil(surface.bounds.maxX); x += step) {
    const point = { x, y };
    if (pointInside(surface, point) && !occluders.some(item => pointInside(item, point))) {
      count += 1; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return Object.freeze({ area: n(count * step * step), width: n(Math.max(0, maxX - minX)), height: n(Math.max(0, maxY - minY)) });
}

export function measureRenderedGeometry(geometry) {
  if (renderedGeometryCache.has(geometry)) return renderedGeometryCache.get(geometry);
  const paths = buildAnatomyPaths(geometry);
  const chestSurface = samplePath(paths.chest.commands, 64);
  const bodyBounds = compositeBounds(paths);
  const shoulderBandWidths = [];
  for (let y = Math.ceil(geometry.landmarks.acromionLeft.y); y <= geometry.landmarks.acromionLeft.y + geometry.measurements.headWidth * .55; y += 6) {
    const hits = surfaceIntersectionsAtY(paths, y);
    if (hits.length >= 2) shoulderBandWidths.push(hits.at(-1) - hits[0]);
  }
  const bodyWidth = Math.max(...shoulderBandWidths);
  const headWidth = paths.head.bounds.width;
  const waistHits = surfaceIntersectionsAtY(paths, 850);
  const waistWidth = waistHits.length >= 2 ? waistHits.at(-1) - waistHits[0] : bodyWidth;
  const shoulderYs = [90, 150, 230].map(offset => geometry.landmarks.acromionLeft.y + offset);
  const widthsAt = ys => ys.map(y => {
    const hits = surfaceIntersectionsAtY(paths, y);
    return hits.length >= 2 ? n(hits.at(-1) - hits[0]) : NaN;
  });
  const shoulderWidths = widthsAt(shoulderYs);
  const shoulderInward = shoulderWidths.map(width => n((geometry.measurements.acromionSpan - width) / 2));
  const shoulderTurnWidths = widthsAt([0, 24, 48, 90].map(offset => geometry.landmarks.acromionLeft.y + offset));
  const shoulderProfile = widthsAt(Array.from({ length: 21 }, (_, index) => geometry.landmarks.acromionLeft.y + index * 12));
  const shoulderDerivatives = shoulderProfile.slice(1).map((width, index) => n((width - shoulderProfile[index]) / 12));
  const shoulderCurvatures = shoulderDerivatives.slice(1).map((slope, index) => n((slope - shoulderDerivatives[index]) / 12));
  const shoulderJoin = cubicJoinAt(paths.deltoids.left.commands, geometry.landmarks.acromionLeft);
  const sideSampleXs = [20, 100, 180].map(offset => surfaceIntersectionsAtY(paths, geometry.landmarks.acromionLeft.y + offset)[0]);
  const chestMoveCount = paths.chest.commands.filter(command => command.type === "M").length;
  const chestClosed = paths.chest.commands.at(-1)?.type === "Z";
  const h = geometry.measurements.headWidth;
  const gapSamples = Array.from({ length: 8 }, (_, index) => geometry.landmarks.acromionLeft.y + h * (.47 + index * .09));
  const gapIntervals = gapSamples.map(y => mergedIntervalsAtY(paths, y));
  const axillaryGaps = gapIntervals.flatMap(intervals => intervals.length === 3 ? [intervals[1][0] - intervals[0][1], intervals[2][0] - intervals[1][1]] : []);
  let threeComponentRun = 0; let currentRun = 0;
  for (let y = geometry.landmarks.acromionLeft.y + h * .44; y <= Math.min(970, geometry.landmarks.acromionLeft.y + h * 1.35); y += 6) {
    if (mergedIntervalsAtY(paths, y).length === 3) { currentRun += 6; threeComponentRun = Math.max(threeComponentRun, currentRun); }
    else currentRun = 0;
  }
  const leftArmTopCenter = (geometry.landmarks.armDeltoidAttachOuterLeft.x + geometry.landmarks.armDeltoidAttachInnerLeft.x) / 2;
  const leftArmMidCenter = (geometry.landmarks.armOuterMidLeft.x + geometry.landmarks.armInnerMidLeft.x) / 2;
  const armAngle = Math.atan2(leftArmTopCenter - leftArmMidCenter, geometry.landmarks.armOuterMidLeft.y - geometry.landmarks.armDeltoidAttachOuterLeft.y) * 180 / Math.PI;
  const armTopWidth = geometry.landmarks.armDeltoidAttachInnerLeft.x - geometry.landmarks.armDeltoidAttachOuterLeft.x;
  const armMidWidth = geometry.landmarks.armInnerMidLeft.x - geometry.landmarks.armOuterMidLeft.x;
  const deltoidExposure = exposedContribution(paths.deltoids.left, [paths.torso, paths.arms.left]);
  const ownerForeignLandmarks = filledSurfaces(paths).flatMap(surface => surface.landmarks.filter(name => geometry.landmarks[name]?.parent !== surface.parent).map(name => `${surface.parent}:${name}:${geometry.landmarks[name]?.parent}`));
  const attachmentGuideGaps = paths.topology.edges.flatMap(edge => edge.guides.flatMap(pair => {
    const first = geometry.landmarks[pair[0]]; const second = geometry.landmarks[pair[1]];
    return [Math.hypot(first.x - second.x, first.y - second.y)];
  }));
  const armOverlapDepths = sampledOverlapDepths(paths.arms.left, paths.deltoids.left, geometry.landmarks.armDeltoidAttachOuterLeft.x + 3, geometry.landmarks.armDeltoidAttachInnerLeft.x - 3, true);
  const torsoOverlapDepths = sampledOverlapDepths(paths.torso, paths.deltoids.left, geometry.landmarks.deltoidTorsoAttachUpperLeft.y + 2, geometry.landmarks.deltoidTorsoAttachLowerLeft.y - 2);
  const result = Object.freeze({
    headBounds: paths.head.bounds, hairBounds: paths.hair.bounds, bodyBounds,
    earLeftBounds: paths.ears.left.bounds, earRightBounds: paths.ears.right.bounds,
    headWidth, hairWidth: paths.hair.bounds.width, bodyWidth,
    hairHead: n(paths.hair.bounds.width / headWidth), bodyHead: n(bodyWidth / headWidth),
    waistWidth: n(waistWidth), waistShoulder: n(waistWidth / bodyWidth),
    shoulderWidths: Object.freeze(shoulderWidths), shoulderInward: Object.freeze(shoulderInward),
    shoulderRootSlope: n((geometry.landmarks.acromionLeft.y - geometry.landmarks.shoulderRootLeft.y) / (geometry.landmarks.shoulderRootLeft.x - geometry.landmarks.acromionLeft.x)),
    shoulderTurnWidths: Object.freeze(shoulderTurnWidths), shoulderProfile: Object.freeze(shoulderProfile),
    shoulderDerivatives: Object.freeze(shoulderDerivatives), shoulderCurvatures: Object.freeze(shoulderCurvatures),
    shoulderPeakPadding: n((Math.max(...shoulderTurnWidths) - geometry.measurements.acromionSpan) / 2),
    shoulderDeltoidInset: n((Math.max(...shoulderTurnWidths) - shoulderTurnWidths.at(-1)) / 2),
    shoulderJoinMismatch: shoulderJoin.mismatch, shoulderJoinAngle: shoulderJoin.angle,
    shoulderChordDeviation: shoulderChordDeviation(paths.deltoids.left.commands, geometry.landmarks.acromionLeft, geometry.landmarks.armOuterShoulderLeft),
    shoulderMaxStraightRun: 0,
    shoulderShelfLength: 0,
    shoulderSideXs: Object.freeze(sideSampleXs.map(n)), shoulderSideDisplacement: n(sideSampleXs.at(-1) - sideSampleXs[0]),
    shoulderWindowXs: Object.freeze([665, 725, 785].map(y => n(surfaceIntersectionsAtY(paths, y)[0]))),
    armSurfaceClosed: Object.freeze([paths.arms.left, paths.arms.right].map(surface => surface.commands.filter(command => command.type === "M").length === 1 && surface.commands.at(-1)?.type === "Z")),
    armSurfaceParents: Object.freeze([paths.arms.left.parent, paths.arms.right.parent]),
    armSurfaceWidths: Object.freeze([paths.arms.left.bounds.width, paths.arms.right.bounds.width].map(n)),
    armSurfaceHeights: Object.freeze([paths.arms.left.bounds.height, paths.arms.right.bounds.height].map(n)),
    deltoidSurfaceClosed: Object.freeze([paths.deltoids.left, paths.deltoids.right].map(surface => surface.commands.filter(command => command.type === "M").length === 1 && surface.commands.at(-1)?.type === "Z")),
    deltoidSurfaceParents: Object.freeze([paths.deltoids.left.parent, paths.deltoids.right.parent]),
    seamEndpointGaps: Object.freeze([
      Math.min(...paths.torso.samples.map(sample => Math.hypot(sample.x - geometry.landmarks.torsoAxillaLipLeft.x, sample.y - geometry.landmarks.torsoAxillaLipLeft.y))),
      Math.min(...paths.torso.samples.map(sample => Math.hypot(sample.x - geometry.landmarks.bustSideLeft.x, sample.y - geometry.landmarks.bustSideLeft.y))),
      Math.min(...paths.torso.samples.map(sample => Math.hypot(sample.x - geometry.landmarks.torsoAxillaLipRight.x, sample.y - geometry.landmarks.torsoAxillaLipRight.y))),
      Math.min(...paths.torso.samples.map(sample => Math.hypot(sample.x - geometry.landmarks.bustSideRight.x, sample.y - geometry.landmarks.bustSideRight.y)))
    ].map(n)),
    seamHeights: Object.freeze([paths.armSeams.left.bounds.height, paths.armSeams.right.bounds.height].map(n)),
    attachmentOverlaps: Object.freeze([
      geometry.landmarks.deltoidArmAttachOuterLeft.y - geometry.landmarks.armDeltoidAttachOuterLeft.y,
      geometry.landmarks.deltoidArmAttachOuterRight.y - geometry.landmarks.armDeltoidAttachOuterRight.y,
      geometry.landmarks.deltoidTorsoAttachUpperLeft.x - geometry.landmarks.torsoShoulderAttachUpperLeft.x,
      geometry.landmarks.torsoShoulderAttachUpperRight.x - geometry.landmarks.deltoidTorsoAttachUpperRight.x
    ].map(n)),
    compositeShoulderRatios: Object.freeze([0, 40, 90, 150, 230].map(offset => {
      const hits = surfaceIntersectionsAtY(paths, geometry.landmarks.acromionLeft.y + offset);
      return n((hits.at(-1) - hits[0]) / geometry.measurements.acromionSpan);
    })),
    torsoInset230: n((shoulderWidths[2] - (intersectionsAtY(paths.torso.commands, geometry.landmarks.acromionLeft.y + 230).at(-1) - intersectionsAtY(paths.torso.commands, geometry.landmarks.acromionLeft.y + 230)[0])) / 2),
    upperArmStrip850: n(intersectionsAtY(paths.torso.commands, 850)[0] - surfaceIntersectionsAtY(paths, 850)[0]),
    ownerForeignLandmarks: Object.freeze(ownerForeignLandmarks),
    attachmentGuideGaps: Object.freeze(attachmentGuideGaps.map(n)),
    overlapDepthSamples: Object.freeze([...armOverlapDepths, ...torsoOverlapDepths]),
    unionComponentsBelowAxilla: Object.freeze(gapIntervals.map(intervals => intervals.length)),
    axillaryGaps: Object.freeze(axillaryGaps.map(n)),
    axillaryThreeComponentRun: n(threeComponentRun / h),
    shoulderBridgeComponents: mergedIntervalsAtY(paths, geometry.landmarks.acromionLeft.y + h * .08).length,
    armAbductionDegrees: n(armAngle), armTaperRatio: n(armMidWidth / armTopWidth),
    independentCropOffset: n(geometry.landmarks.independentArmCropOuterLeft.y - 970),
    deltoidExposure,
    torsoLateralViolation: n(Math.max(0, geometry.landmarks.acromionLeft.x - paths.torso.bounds.minX, paths.torso.bounds.maxX - geometry.landmarks.acromionRight.x)),
    sideCrossingViolation: n(Math.max(0, paths.arms.left.bounds.maxX - 500, 500 - paths.arms.right.bounds.minX, paths.deltoids.left.bounds.maxX - 500, 500 - paths.deltoids.right.bounds.minX)),
    topologyEdges: paths.topology.edges.length, topologySurfaces: paths.topology.surfaces, zOrder: paths.topology.zOrder,
    chestMoveCount, chestClosed, chestTangentMismatch: cubicJoinMismatch(paths.chest.commands),
    chestCenterY: chestSurface.length ? n(nearestYAtX(chestSurface, 500)) : geometry.landmarks.sternum.y,
    chestApexY: chestSurface.length ? n(nearestYAtX(chestSurface, geometry.landmarks.bustLeft.x)) : geometry.landmarks.sternum.y,
    paths
  });
  renderedGeometryCache.set(geometry, result);
  return result;
}

function cubicJoinMismatch(commands) {
  const segments = commands.filter(command => command.type === "C");
  if (segments.length < 2 || commands.filter(command => command.type === "M").length !== 1 || commands.at(-1)?.type !== "Z") return Infinity;
  let maximum = 0;
  let start = commands[0];
  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index];
    const next = segments[(index + 1) % segments.length];
    const join = { x: current.x, y: current.y };
    const incoming = { x: join.x - current.x2, y: join.y - current.y2 };
    const outgoing = { x: next.x1 - join.x, y: next.y1 - join.y };
    maximum = Math.max(maximum, Math.hypot(incoming.x - outgoing.x, incoming.y - outgoing.y));
    start = current;
  }
  return n(maximum);
}
