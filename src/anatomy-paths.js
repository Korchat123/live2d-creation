import { C, L, M, Q, Z, intersectionsAtY, pathBounds, samplePath, serializePath } from "./path-metrics.js";

const n = value => Number(value.toFixed(2));
const path = (parent, landmarks, commands) => Object.freeze({
  parent,
  landmarks: Object.freeze(landmarks),
  commands: Object.freeze(commands),
  d: serializePath(commands),
  samples: samplePath(commands),
  bounds: pathBounds(commands)
});

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
  const hair = path("hair.front", ["napeLeft", "hairTop", "napeRight", "sideLockRootRight", "hairlineTempleRight", "hairlineCenter", "hairlineTempleLeft", "sideLockRootLeft"], [
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
  const hairFit = path("hair.front", ["hairInnerTempleLeft", "hairInnerCrown", "hairInnerTempleRight"], [
    M(l.hairInnerTempleLeft.x, l.hairInnerTempleLeft.y),
    C(l.hairInnerTempleLeft.x + 8, l.skullTop.y + 32, 500 - 58, l.hairInnerCrown.y, l.hairInnerCrown.x, l.hairInnerCrown.y),
    C(500 + 58, l.hairInnerCrown.y, l.hairInnerTempleRight.x - 8, l.skullTop.y + 32, l.hairInnerTempleRight.x, l.hairInnerTempleRight.y)
  ]);

  const shoulderSpan = m.acromionSpan;
  const waistLeft = l.torso850Left.x; const waistRight = l.torso850Right.x;
  const badWedge = mutations.bodyStyle === "wedge";
  const bodyLeft850 = badWedge ? l.acromionLeft.x - 26 : l.torso850Left.x;
  const bodyRight850 = badWedge ? l.acromionRight.x + 26 : l.torso850Right.x;
  const cropLeft = waistLeft + shoulderSpan * .105;
  const cropRight = waistRight - shoulderSpan * .105;
  const body = path("torso.root", ["upperNeckLeft", "collarLeft", "shoulderRootLeft", "trapeziusLeft", "shoulderMidLeft", "acromionLeft", "deltoidOuterLeft", "upperArmLeft", "torso850Left", "torso850Right", "upperArmRight", "deltoidOuterRight", "acromionRight", "shoulderMidRight", "trapeziusRight", "shoulderRootRight", "collarRight", "upperNeckRight"], [
    M(l.upperNeckLeft.x, l.upperNeckLeft.y), C(l.upperNeckLeft.x, l.collarLeft.y - 22, l.collarLeft.x, l.collarLeft.y - 10, l.collarLeft.x, l.collarLeft.y),
    L(l.shoulderRootLeft.x, l.shoulderRootLeft.y),
    Q((l.shoulderRootLeft.x + l.trapeziusLeft.x) / 2, l.trapeziusLeft.y - 5, l.trapeziusLeft.x, l.trapeziusLeft.y),
    Q((l.trapeziusLeft.x + l.shoulderMidLeft.x) / 2, l.shoulderMidLeft.y - 4, l.shoulderMidLeft.x, l.shoulderMidLeft.y),
    Q((l.shoulderMidLeft.x + l.acromionLeft.x) / 2, l.acromionLeft.y - 4, l.acromionLeft.x, l.acromionLeft.y),
    C(l.acromionLeft.x, l.acromionLeft.y + 30, l.deltoidOuterLeft.x, l.deltoidOuterLeft.y - 24, l.deltoidOuterLeft.x, l.deltoidOuterLeft.y),
    Q(l.upperArmLeft.x - 6, l.upperArmLeft.y - 40, l.upperArmLeft.x, l.upperArmLeft.y),
    Q(bodyLeft850 - 8, (l.upperArmLeft.y + 850) / 2, bodyLeft850, 850),
    C(bodyLeft850 + 8, 900, cropLeft - 8, 942, cropLeft, 970), L(cropRight, 970),
    C(cropRight + 8, 942, bodyRight850 - 8, 900, bodyRight850, 850),
    Q(l.upperArmRight.x + 6, l.upperArmRight.y + 40, l.upperArmRight.x, l.upperArmRight.y),
    Q(l.deltoidOuterRight.x, l.deltoidOuterRight.y + 24, l.deltoidOuterRight.x, l.deltoidOuterRight.y),
    C(l.deltoidOuterRight.x, l.deltoidOuterRight.y - 24, l.acromionRight.x, l.acromionRight.y + 30, l.acromionRight.x, l.acromionRight.y),
    Q((l.shoulderMidRight.x + l.acromionRight.x) / 2, l.acromionRight.y - 4, l.shoulderMidRight.x, l.shoulderMidRight.y),
    Q((l.trapeziusRight.x + l.shoulderMidRight.x) / 2, l.shoulderMidRight.y - 4, l.trapeziusRight.x, l.trapeziusRight.y),
    Q((l.shoulderRootRight.x + l.trapeziusRight.x) / 2, l.trapeziusRight.y - 5, l.shoulderRootRight.x, l.shoulderRootRight.y),
    L(l.collarRight.x, l.collarRight.y),
    C(l.collarRight.x, l.collarRight.y - 10, l.upperNeckRight.x, l.collarRight.y - 22, l.upperNeckRight.x, l.upperNeckRight.y), Z()
  ]);

  const neckGuide = path("neck.root", ["upperNeckLeft", "collarLeft", "collarRight", "upperNeckRight"], [M(l.upperNeckLeft.x,l.upperNeckLeft.y), C(l.upperNeckLeft.x,l.collarLeft.y-22,l.collarLeft.x,l.collarLeft.y-10,l.collarLeft.x,l.collarLeft.y), M(l.upperNeckRight.x,l.upperNeckRight.y), C(l.upperNeckRight.x,l.collarRight.y-22,l.collarRight.x,l.collarRight.y-10,l.collarRight.x,l.collarRight.y)]);
  const shoulderGuide = path("collar.center", ["shoulderRootLeft", "sternum", "shoulderRootRight"], [M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), C(420,l.sternum.y-22,465,l.sternum.y,l.sternum.x,l.sternum.y), C(535,l.sternum.y,580,l.sternum.y-22,l.shoulderRootRight.x,l.shoulderRootRight.y)]);

  let chest = null;
  if (m.bustEnvelopeWidth > 0) {
    const depth = 24 + m.bustEnvelopeWidth * .075;
    const ribY = l.bustLeft.y + 72;
    const scallop = mutations.chestStyle === "scalloped";
    const commands = scallop ? [M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), Q(l.bustLeft.x,l.bustLeft.y-30,l.bustLeft.x,l.bustLeft.y+45), Q(l.sternum.x,l.bustLeft.y+95,l.sternum.x,l.bustLeft.y+55), Q(l.bustRight.x,l.bustRight.y+95,l.bustRight.x,l.bustRight.y+45), Q(l.bustRight.x,l.bustRight.y-30,l.shoulderRootRight.x,l.shoulderRootRight.y)] : [
      M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), C(l.shoulderRootLeft.x+24,l.sternum.y+8,l.sternum.x-24,l.sternum.y-4,l.sternum.x,l.sternum.y), C(l.sternum.x+24,l.sternum.y-4,l.shoulderRootRight.x-24,l.sternum.y+8,l.shoulderRootRight.x,l.shoulderRootRight.y),
      M(l.bustOuterLeft.x,l.bustOuterLeft.y), C(l.bustOuterLeft.x+20,l.bustOuterLeft.y-18,l.bustLeft.x-24,l.bustLeft.y-depth,l.bustLeft.x,l.bustLeft.y), C(l.bustLeft.x+24,l.bustLeft.y+8,l.bustInnerLeft.x-14,l.bustInnerLeft.y,l.bustInnerLeft.x,l.bustInnerLeft.y),
      M(l.bustInnerRight.x,l.bustInnerRight.y), C(l.bustInnerRight.x+14,l.bustInnerRight.y,l.bustRight.x-24,l.bustRight.y+8,l.bustRight.x,l.bustRight.y), C(l.bustRight.x+24,l.bustRight.y-depth,l.bustOuterRight.x-20,l.bustOuterRight.y-18,l.bustOuterRight.x,l.bustOuterRight.y),
      M(500-m.bustEnvelopeWidth*.42,ribY), C(430,ribY+7,570,ribY+7,500+m.bustEnvelopeWidth*.42,ribY)
    ];
    chest = path("chest.center", ["shoulderRootLeft","bustLeft","sternum","bustRight","shoulderRootRight"], commands);
  }
  const ears = {
    left: path("ear.left", ["earTopLeft","earBottomLeft"], [M(l.earTopLeft.x,l.earTopLeft.y), C(l.earTopLeft.x-25,l.earTopLeft.y+9,l.earBottomLeft.x-25,l.earBottomLeft.y-10,l.earBottomLeft.x,l.earBottomLeft.y), C(l.earBottomLeft.x+10,l.earBottomLeft.y-18,l.earTopLeft.x+10,l.earTopLeft.y+20,l.earTopLeft.x,l.earTopLeft.y), Z()]),
    right: path("ear.right", ["earTopRight","earBottomRight"], [M(l.earTopRight.x,l.earTopRight.y), C(l.earTopRight.x+25,l.earTopRight.y+9,l.earBottomRight.x+25,l.earBottomRight.y-10,l.earBottomRight.x,l.earBottomRight.y), C(l.earBottomRight.x-10,l.earBottomRight.y-18,l.earTopRight.x-10,l.earTopRight.y+20,l.earTopRight.x,l.earTopRight.y), Z()])
  };
  return Object.freeze({ head, hair, hairFit, body, neckGuide, shoulderGuide, chest, ears });
}

const nearestYAtX = (samples, x) => samples.reduce((best, point) => Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best).y;

export function measureRenderedGeometry(geometry) {
  const paths = buildAnatomyPaths(geometry);
  const chestSurfaceCommands = paths.chest ? paths.chest.commands.slice(0, paths.chest.commands.findIndex((command, index) => index > 0 && command.type === "M") === -1 ? undefined : paths.chest.commands.findIndex((command, index) => index > 0 && command.type === "M")) : [];
  const chestSurface = chestSurfaceCommands.length ? samplePath(chestSurfaceCommands, 64) : [];
  const bodyWidth = paths.body.bounds.width;
  const headWidth = paths.head.bounds.width;
  const waistHits = intersectionsAtY(paths.body.commands, 850);
  const waistWidth = waistHits.length >= 2 ? waistHits.at(-1) - waistHits[0] : bodyWidth;
  return Object.freeze({
    headBounds: paths.head.bounds,
    hairBounds: paths.hair.bounds,
    bodyBounds: paths.body.bounds,
    earLeftBounds: paths.ears.left.bounds,
    earRightBounds: paths.ears.right.bounds,
    headWidth,
    hairWidth: paths.hair.bounds.width,
    bodyWidth,
    hairHead: n(paths.hair.bounds.width / headWidth),
    bodyHead: n(bodyWidth / headWidth),
    waistWidth: n(waistWidth),
    waistShoulder: n(waistWidth / bodyWidth),
    chestCenterY: chestSurface.length ? n(nearestYAtX(chestSurface, 500)) : geometry.landmarks.sternum.y,
    chestApexY: chestSurface.length ? n(nearestYAtX(chestSurface, geometry.landmarks.bustLeft.x)) : geometry.landmarks.sternum.y,
    paths
  });
}
