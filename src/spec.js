export const STANDARD_BUST_SPEC = Object.freeze({
  version: "standard-bust-v1/spec-0.3.0",
  canvas: Object.freeze({ width: 1000, height: 1000, centerX: 500, cropY: 970, safeLeft: 120, safeRight: 880 }),
  parameters: Object.freeze({
    headWidth: { label: "Cranium width", min: 260, max: 280, step: 1, value: 270 },
    headAspect: { label: "Head height / width", min: 1.16, max: 1.31, step: 0.01, value: 1.233 },
    shoulderHeadRatio: { label: "Acromion span / head", min: 2.05, max: 2.48, step: 0.01, value: 2.25 },
    jawCraniumRatio: { label: "Jaw angle / cranium", min: 0.67, max: 0.75, step: 0.01, value: 0.72 },
    upperNeckHeadRatio: { label: "Upper neck / head", min: 0.29, max: 0.40, step: 0.01, value: 0.34 },
    collarHeadRatio: { label: "Collar span / head", min: 0.38, max: 0.49, step: 0.01, value: 0.44 },
    neckLengthHeadRatio: { label: "Visible neck / head height", min: 0.22, max: 0.34, step: 0.01, value: 0.27 },
    shoulderDrop: { label: "Shoulder-root to acromion drop", min: 24, max: 60, step: 1, value: 44 },
    templeCraniumRatio: { label: "Temple width / cranium", min: 0.94, max: 1.00, step: 0.01, value: 0.98 },
    cheekCraniumRatio: { label: "Cheek width / cranium", min: 0.86, max: 0.94, step: 0.01, value: 0.90 },
    chinCraniumRatio: { label: "Chin shelf / cranium", min: 0.28, max: 0.40, step: 0.01, value: 0.34 },
    eyeCenterFaceRatio: { label: "Eye centers / face-at-eye", min: 0.43, max: 0.53, step: 0.001, value: 0.516 },
    eyeWidth: { label: "Eye width", min: 54, max: 70, step: 1, value: 62 },
    eyeHeight: { label: "Eye height", min: 25, max: 37, step: 1, value: 31 },
    irisEyeRatio: { label: "Iris diameter / eye width", min: 0.52, max: 0.72, step: 0.01, value: 0.62 },
    noseWidth: { label: "Nose mark width", min: 10, max: 26, step: 1, value: 16 },
    noseHeight: { label: "Nose mark height", min: 8, max: 26, step: 1, value: 14 },
    mouthWidth: { label: "Closed mouth width", min: 30, max: 56, step: 1, value: 42 },
    mouthHeight: { label: "Closed mouth height", min: 2, max: 10, step: 1, value: 4 },
    mouthChinShare: { label: "Mouth-to-chin / eye-to-chin", min: 0.29, max: 0.43, step: 0.01, value: 0.36 },
    hairWidthHeadRatio: { label: "Hair envelope / head", min: 1.12, max: 1.32, step: 0.01, value: 1.20 },
    hairLiftHeadRatio: { label: "Hair rise / head height", min: 0.06, max: 0.15, step: 0.01, value: 0.10 },
    bustShoulderRatio: { label: "Covered bust envelope / shoulder", min: 0, max: 0.64, step: 0.01, value: 0.54 },
    bustApexOffsetRatio: { label: "Bust apex offset / shoulder", min: 0.13, max: 0.18, step: 0.01, value: 0.155 }
  }),
  ratioRanges: Object.freeze({
    shoulderHead: [2.05, 2.48], headAspect: [1.16, 1.31], jawCranium: [0.67, 0.75], upperNeckHead: [0.29, 0.40],
    collarHead: [0.38, 0.49], upperNeckJaw: [0.42, 0.62], neckLengthHead: [0.22, 0.34], templeCranium: [0.94, 1.00],
    cheekCranium: [0.86, 0.94], chinCranium: [0.28, 0.40], eyeCenterFace: [0.43, 0.53], eyeAspect: [1.70, 2.35],
    innerGapEye: [0.88, 1.22], irisEye: [0.52, 0.72], eyeNose: [0.32, 0.45], noseMouth: [0.20, 0.32],
    mouthChin: [0.29, 0.43], mouthEyeCenters: [0.23, 0.43], hairHead: [1.12, 1.32], hairLiftHead: [0.06, 0.15],
    bustShoulder: [0, 0.64], bustApexShoulder: [0, 0.18], torso850Garment: [0.78, 0.90]
  }),
  constants: Object.freeze({
    skullTopY: 92, browHeadY: 0.390, eyeHeadY: 0.505, templeHeadY: 0.34, cheekHeadY: 0.625, jawHeadY: 0.85,
    chinShelfHeadY: 0.97, eyeNoseShare: 0.376, upperNeckLead: 9, shoulderRootAboveCollar: 4,
    sternumBelowCollar: 20, bustBelowAcromion: 105, earTopRange: [225, 240], earBottomRange: [320, 340],
    hairlineCenterRange: [145, 165], hairlineTempleRange: [165, 190], hairProjectedDisplacement: 12, hairOverlapSafety: 8,
    garmentPaddingHeadMax: 0.06, torso850GarmentRatio: 0.82, bustOuterClearance: 12, sternumClearanceShoulder: 0.08,
    outlineJoinTolerance: 3
  }),
  presets: Object.freeze({
    neutral: {},
    feminine: { shoulderHeadRatio: 2.14, jawCraniumRatio: 0.69, upperNeckHeadRatio: 0.31, bustShoulderRatio: 0.57, neckLengthHeadRatio: 0.26 },
    androgynous: { shoulderHeadRatio: 2.25, jawCraniumRatio: 0.72, upperNeckHeadRatio: 0.34, bustShoulderRatio: 0.50, neckLengthHeadRatio: 0.27 },
    masculine: { shoulderHeadRatio: 2.40, jawCraniumRatio: 0.75, upperNeckHeadRatio: 0.38, bustShoulderRatio: 0.44, neckLengthHeadRatio: 0.28 }
  }),
  presetShoulderEnvelopes: Object.freeze({ feminine: [2.10, 2.18], androgynous: [2.20, 2.30], masculine: [2.34, 2.46] })
});
