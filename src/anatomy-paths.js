const n = value => Number(value.toFixed(2));

const path = (parent, landmarks, d) => Object.freeze({ parent, landmarks: Object.freeze(landmarks), d });

// Visible geometry is built only from canonical landmarks. Keeping this layer
// pure makes the silhouette and its ownership independently testable.
export function buildAnatomyPaths(geometry) {
  const { landmarks: l, measurements: m } = geometry;
  const lowerLeft = n(500 - m.torsoWidth850 * .40);
  const lowerRight = n(500 + m.torsoWidth850 * .40);

  const body = path("torso.root", [
    "upperNeckLeft", "collarLeft", "shoulderRootLeft", "trapeziusLeft", "shoulderMidLeft", "acromionLeft",
    "deltoidOuterLeft", "upperArmLeft", "torso850Left", "torso850Right", "upperArmRight", "deltoidOuterRight",
    "acromionRight", "shoulderMidRight", "trapeziusRight", "shoulderRootRight", "collarRight", "upperNeckRight"
  ], `M ${l.upperNeckLeft.x} ${l.upperNeckLeft.y}
    C ${l.upperNeckLeft.x} ${n((l.upperNeckLeft.y + l.collarLeft.y) / 2)}, ${l.collarLeft.x} ${n(l.collarLeft.y - 18)}, ${l.collarLeft.x} ${l.collarLeft.y}
    C ${l.shoulderRootLeft.x} ${l.shoulderRootLeft.y}, ${l.trapeziusLeft.x} ${l.trapeziusLeft.y}, ${l.shoulderMidLeft.x} ${l.shoulderMidLeft.y}
    C ${n((l.shoulderMidLeft.x + l.acromionLeft.x) / 2)} ${n(l.acromionLeft.y - 5)}, ${n(l.acromionLeft.x + 18)} ${n(l.acromionLeft.y - 4)}, ${l.acromionLeft.x} ${l.acromionLeft.y}
    C ${l.garmentShoulderLeft.x} ${n(l.garmentShoulderLeft.y + 18)}, ${l.deltoidOuterLeft.x} ${n(l.deltoidOuterLeft.y - 24)}, ${l.deltoidOuterLeft.x} ${l.deltoidOuterLeft.y}
    C ${l.deltoidOuterLeft.x} ${n(l.deltoidOuterLeft.y + 48)}, ${l.upperArmLeft.x} ${n(l.upperArmLeft.y - 20)}, ${l.upperArmLeft.x} ${l.upperArmLeft.y}
    C ${n(l.upperArmLeft.x + 4)} ${n((l.upperArmLeft.y + l.torso850Left.y) / 2)}, ${n(l.torso850Left.x - 5)} ${n(l.torso850Left.y - 22)}, ${l.torso850Left.x} ${l.torso850Left.y}
    C ${n(l.torso850Left.x + 5)} 900, ${n(lowerLeft - 5)} 942, ${lowerLeft} 970
    L ${lowerRight} 970
    C ${n(lowerRight + 5)} 942, ${n(l.torso850Right.x - 5)} 900, ${l.torso850Right.x} ${l.torso850Right.y}
    C ${n(l.torso850Right.x + 5)} ${n(l.torso850Right.y - 22)}, ${n(l.upperArmRight.x - 4)} ${n((l.upperArmRight.y + l.torso850Right.y) / 2)}, ${l.upperArmRight.x} ${l.upperArmRight.y}
    C ${l.upperArmRight.x} ${n(l.deltoidOuterRight.y + 48)}, ${l.deltoidOuterRight.x} ${n(l.deltoidOuterRight.y + 48)}, ${l.deltoidOuterRight.x} ${l.deltoidOuterRight.y}
    C ${l.deltoidOuterRight.x} ${n(l.deltoidOuterRight.y - 24)}, ${l.garmentShoulderRight.x} ${n(l.garmentShoulderRight.y + 18)}, ${l.acromionRight.x} ${l.acromionRight.y}
    C ${n(l.acromionRight.x - 18)} ${n(l.acromionRight.y - 4)}, ${n((l.shoulderMidRight.x + l.acromionRight.x) / 2)} ${n(l.acromionRight.y - 5)}, ${l.shoulderMidRight.x} ${l.shoulderMidRight.y}
    C ${l.trapeziusRight.x} ${l.trapeziusRight.y}, ${l.shoulderRootRight.x} ${l.shoulderRootRight.y}, ${l.collarRight.x} ${l.collarRight.y}
    C ${l.collarRight.x} ${n(l.collarRight.y - 18)}, ${l.upperNeckRight.x} ${n((l.upperNeckRight.y + l.collarRight.y) / 2)}, ${l.upperNeckRight.x} ${l.upperNeckRight.y} Z`);

  const neckGuide = path("neck.root", ["upperNeckLeft", "collarLeft", "collarRight", "upperNeckRight"],
    `M ${l.upperNeckLeft.x} ${l.upperNeckLeft.y} C ${l.upperNeckLeft.x} ${n((l.upperNeckLeft.y + l.collarLeft.y) / 2)}, ${l.collarLeft.x} ${n(l.collarLeft.y - 18)}, ${l.collarLeft.x} ${l.collarLeft.y}
     M ${l.upperNeckRight.x} ${l.upperNeckRight.y} C ${l.upperNeckRight.x} ${n((l.upperNeckRight.y + l.collarRight.y) / 2)}, ${l.collarRight.x} ${n(l.collarRight.y - 18)}, ${l.collarRight.x} ${l.collarRight.y}`);

  const shoulderGuide = path("collar.center", ["shoulderRootLeft", "sternum", "shoulderRootRight"],
    `M ${l.shoulderRootLeft.x} ${l.shoulderRootLeft.y} Q ${n(l.sternum.x - 34)} ${n(l.sternum.y - 1)} ${l.sternum.x} ${l.sternum.y} Q ${n(l.sternum.x + 34)} ${n(l.sternum.y - 1)} ${l.shoulderRootRight.x} ${l.shoulderRootRight.y}`);

  const chest = m.bustEnvelopeWidth === 0 ? null : path("chest.center", [
    "shoulderRootLeft", "sternum", "shoulderRootRight", "bustOuterRight", "bustRight", "bustInnerRight",
    "bustInnerLeft", "bustLeft", "bustOuterLeft"
  ], `M ${l.shoulderRootLeft.x} ${l.shoulderRootLeft.y}
    Q ${n(l.sternum.x - 34)} ${n(l.sternum.y - 1)} ${l.sternum.x} ${l.sternum.y}
    Q ${n(l.sternum.x + 34)} ${n(l.sternum.y - 1)} ${l.shoulderRootRight.x} ${l.shoulderRootRight.y}
    C ${n(l.shoulderRootRight.x + 42)} ${n(l.sternum.y + 24)}, ${n(l.bustOuterRight.x - 18)} ${n(l.bustOuterRight.y - 64)}, ${l.bustOuterRight.x} ${l.bustOuterRight.y}
    C ${n(l.bustOuterRight.x - 24)} ${n(l.bustRight.y - 18)}, ${n(l.bustRight.x + 22)} ${n(l.bustRight.y - 12)}, ${l.bustRight.x} ${l.bustRight.y}
    C ${n(l.bustRight.x - 16)} ${n(l.bustRight.y + 18)}, ${n(l.bustInnerRight.x + 10)} ${n(l.bustInnerRight.y - 4)}, ${l.bustInnerRight.x} ${l.bustInnerRight.y}
    Q ${l.sternum.x} ${n(l.bustInnerRight.y + 26)} ${l.bustInnerLeft.x} ${l.bustInnerLeft.y}
    C ${n(l.bustInnerLeft.x - 10)} ${n(l.bustInnerLeft.y - 4)}, ${n(l.bustLeft.x + 16)} ${n(l.bustLeft.y + 18)}, ${l.bustLeft.x} ${l.bustLeft.y}
    C ${n(l.bustLeft.x - 22)} ${n(l.bustLeft.y - 12)}, ${n(l.bustOuterLeft.x + 24)} ${n(l.bustLeft.y - 18)}, ${l.bustOuterLeft.x} ${l.bustOuterLeft.y}
    C ${n(l.bustOuterLeft.x + 18)} ${n(l.bustOuterLeft.y - 64)}, ${n(l.shoulderRootLeft.x - 42)} ${n(l.sternum.y + 24)}, ${l.shoulderRootLeft.x} ${l.shoulderRootLeft.y} Z`);

  return Object.freeze({ body, neckGuide, shoulderGuide, chest });
}
