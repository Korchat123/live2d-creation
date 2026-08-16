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

// Convert an ordered anatomical contour to cubic segments with one shared
// derivative at each interior landmark. This makes acromion continuity a
// property of the SVG commands rather than a visual approximation.
function openSpline(points, tension = .62, verticalAt = []) {
  const tangents = points.map((current, index) => {
    if (index === 0) return { x: (points[1].x - current.x) * tension, y: (points[1].y - current.y) * tension };
    if (index === points.length - 1) return { x: (current.x - points[index - 1].x) * tension, y: (current.y - points[index - 1].y) * tension };
    if (verticalAt.some(point => samePoint(point, current))) {
      const deltaY = points[index + 1].y - points[index - 1].y;
      return { x: 0, y: Math.sign(deltaY) * Math.max(60, Math.abs(deltaY) * tension * 1.55) };
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

  const shoulderSpan = m.acromionSpan;
  const waistLeft = l.torso850Left.x; const waistRight = l.torso850Right.x;
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
  const leftContour = [l.upperNeckLeft, l.shoulderRootLeft, l.trapeziusLeft, l.shoulderMidLeft, l.acromionLeft, shoulderCapLeft, wallLeft, upperArmLeft, bustSideLeft, { x: left850, y: 850 }, l.waistLeft, { x: cropLeft, y: 970 }];
  const rightContour = [{ x: cropRight, y: 970 }, l.waistRight, { x: right850, y: 850 }, bustSideRight, upperArmRight, wallRight, shoulderCapRight, l.acromionRight, l.shoulderMidRight, l.trapeziusRight, l.shoulderRootRight, l.upperNeckRight];
  const body = path("torso.root", ["upperNeckLeft", "shoulderRootLeft", "trapeziusLeft", "shoulderMidLeft", "acromionLeft", "shoulderCapLeft", "deltoidOuterLeft", "upperArmLeft", "bustSideLeft", "torso850Left", "waistLeft", "waistRight", "torso850Right", "bustSideRight", "upperArmRight", "deltoidOuterRight", "shoulderCapRight", "acromionRight", "shoulderMidRight", "trapeziusRight", "shoulderRootRight", "upperNeckRight"], [
    M(leftContour[0].x, leftContour[0].y), ...openSpline(leftContour, .62, [l.acromionLeft]),
    L(rightContour[0].x, rightContour[0].y), ...openSpline(rightContour, .62, [l.acromionRight]), Z()
  ]);

  const neckGuide = path("neck.root", ["upperNeckLeft", "collarLeft", "collarRight", "upperNeckRight"], [M(l.upperNeckLeft.x,l.upperNeckLeft.y), C(l.upperNeckLeft.x,l.collarLeft.y-22,l.collarLeft.x,l.collarLeft.y-10,l.collarLeft.x,l.collarLeft.y), M(l.upperNeckRight.x,l.upperNeckRight.y), C(l.upperNeckRight.x,l.collarRight.y-22,l.collarRight.x,l.collarRight.y-10,l.collarRight.x,l.collarRight.y)]);
  const shoulderGuide = path("collar.center", ["shoulderRootLeft", "sternum", "shoulderRootRight"], [M(l.shoulderRootLeft.x,l.shoulderRootLeft.y), C(420,l.sternum.y-22,465,l.sternum.y,l.sternum.x,l.sternum.y), C(535,l.sternum.y,580,l.sternum.y-22,l.shoulderRootRight.x,l.shoulderRootRight.y)]);

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
  return Object.freeze({ head, hair: hairBack, hairBack, hairFront, hairFit, body, neckGuide, shoulderGuide, chest, ears });
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
    if (Math.abs(dx) > .01 && Math.abs(dy / dx) < .16) {
      run += Math.hypot(dx, dy); longest = Math.max(longest, run);
    } else run = 0;
  }
  return n(longest);
}

export function measureRenderedGeometry(geometry) {
  const paths = buildAnatomyPaths(geometry);
  const chestSurface = paths.chest ? samplePath(paths.chest.commands, 64) : [];
  const bodyWidth = paths.body.bounds.width;
  const headWidth = paths.head.bounds.width;
  const waistHits = intersectionsAtY(paths.body.commands, 850);
  const waistWidth = waistHits.length >= 2 ? waistHits.at(-1) - waistHits[0] : bodyWidth;
  const shoulderYs = [24, 48, 72].map(offset => geometry.landmarks.acromionLeft.y + offset);
  const shoulderWidths = shoulderYs.map(y => {
    const hits = intersectionsAtY(paths.body.commands, y);
    return hits.length >= 2 ? n(hits.at(-1) - hits[0]) : NaN;
  });
  const shoulderInward = shoulderWidths.map(width => n((geometry.measurements.acromionSpan - width) / 2));
  const shoulderJoin = cubicJoinAt(paths.body.commands, geometry.landmarks.acromionLeft);
  const sideSampleYs = [20, 100, 180].map(offset => geometry.landmarks.acromionLeft.y + offset);
  const sideSampleXs = sideSampleYs.map(y => intersectionsAtY(paths.body.commands, y)[0]);
  const chestMoveCount = paths.chest.commands.filter(command => command.type === "M").length;
  const chestClosed = paths.chest.commands.at(-1)?.type === "Z";
  const chestTangentMismatch = cubicJoinMismatch(paths.chest.commands);
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
    shoulderWidths: Object.freeze(shoulderWidths),
    shoulderInward: Object.freeze(shoulderInward),
    shoulderJoinMismatch: shoulderJoin.mismatch,
    shoulderJoinAngle: shoulderJoin.angle,
    shoulderChordDeviation: shoulderChordDeviation(paths.body.commands, geometry.landmarks.acromionLeft, geometry.landmarks.upperArmLeft),
    shoulderMaxStraightRun: shoulderMaxStraightRun(paths.body.commands, geometry.landmarks.acromionLeft.y),
    shoulderShelfLength: shoulderShelfLength(paths.body.commands, geometry.landmarks.shoulderRootLeft, geometry.landmarks.acromionLeft),
    shoulderSideXs: Object.freeze(sideSampleXs.map(n)),
    shoulderSideDisplacement: n(sideSampleXs.at(-1) - sideSampleXs[0]),
    shoulderWindowXs: Object.freeze([665, 725, 785].map(y => n(intersectionsAtY(paths.body.commands, y)[0]))),
    chestMoveCount,
    chestClosed,
    chestTangentMismatch,
    chestCenterY: chestSurface.length ? n(nearestYAtX(chestSurface, 500)) : geometry.landmarks.sternum.y,
    chestApexY: chestSurface.length ? n(nearestYAtX(chestSurface, geometry.landmarks.bustLeft.x)) : geometry.landmarks.sternum.y,
    paths
  });
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
