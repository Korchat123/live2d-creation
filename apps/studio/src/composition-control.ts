export const compositionControlVersion = "open-avatar-openpose-v1";
export const compositionControlSize = 1024;

export type PoseJointName =
  | "nose"
  | "neck"
  | "leftShoulder"
  | "leftElbow"
  | "leftWrist"
  | "rightShoulder"
  | "rightElbow"
  | "rightWrist"
  | "leftHip"
  | "leftKnee"
  | "leftAnkle"
  | "rightHip"
  | "rightKnee"
  | "rightAnkle"
  | "leftEye"
  | "rightEye"
  | "leftEar"
  | "rightEar";

export type PoseJoint = Readonly<{
  x: number;
  y: number;
  color: string;
}>;

export type PoseSegment = Readonly<{
  from: PoseJointName;
  to: PoseJointName;
  color: string;
}>;

export const compositionPoseJoints: Readonly<Record<PoseJointName, PoseJoint>> =
  {
    nose: { x: 0.5, y: 0.22, color: "#ff0000" },
    neck: { x: 0.5, y: 0.315, color: "#ff5500" },
    leftShoulder: { x: 0.39, y: 0.34, color: "#ffaa00" },
    leftElbow: { x: 0.345, y: 0.455, color: "#aaff00" },
    leftWrist: { x: 0.325, y: 0.57, color: "#00ff00" },
    rightShoulder: { x: 0.61, y: 0.34, color: "#ffff00" },
    rightElbow: { x: 0.655, y: 0.455, color: "#00ff55" },
    rightWrist: { x: 0.675, y: 0.57, color: "#00ffaa" },
    leftHip: { x: 0.445, y: 0.59, color: "#00ffff" },
    leftKnee: { x: 0.435, y: 0.76, color: "#0055ff" },
    leftAnkle: { x: 0.425, y: 0.91, color: "#0000ff" },
    rightHip: { x: 0.555, y: 0.59, color: "#00aaff" },
    rightKnee: { x: 0.565, y: 0.76, color: "#5500ff" },
    rightAnkle: { x: 0.575, y: 0.91, color: "#aa00ff" },
    leftEye: { x: 0.48, y: 0.21, color: "#ff00ff" },
    rightEye: { x: 0.52, y: 0.21, color: "#ff0055" },
    leftEar: { x: 0.455, y: 0.225, color: "#ff00aa" },
    rightEar: { x: 0.545, y: 0.225, color: "#ff0000" },
  };

export const compositionPoseSegments: readonly PoseSegment[] = [
  { from: "neck", to: "leftShoulder", color: "#ff5500" },
  { from: "leftShoulder", to: "leftElbow", color: "#ffaa00" },
  { from: "leftElbow", to: "leftWrist", color: "#aaff00" },
  { from: "neck", to: "rightShoulder", color: "#ffff00" },
  { from: "rightShoulder", to: "rightElbow", color: "#00ff55" },
  { from: "rightElbow", to: "rightWrist", color: "#00ffaa" },
  { from: "neck", to: "leftHip", color: "#00ffff" },
  { from: "leftHip", to: "leftKnee", color: "#0055ff" },
  { from: "leftKnee", to: "leftAnkle", color: "#0000ff" },
  { from: "neck", to: "rightHip", color: "#00aaff" },
  { from: "rightHip", to: "rightKnee", color: "#5500ff" },
  { from: "rightKnee", to: "rightAnkle", color: "#aa00ff" },
  { from: "nose", to: "neck", color: "#ff0000" },
  { from: "nose", to: "leftEye", color: "#ff00ff" },
  { from: "leftEye", to: "leftEar", color: "#ff00aa" },
  { from: "nose", to: "rightEye", color: "#ff0055" },
  { from: "rightEye", to: "rightEar", color: "#ff0000" },
];

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the composition control image."));
    }, "image/png"),
  );

export const createCompositionControlPng = async (): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = compositionControlSize;
  canvas.height = compositionControlSize;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Could not create the composition control canvas.");
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 12;
  for (const segment of compositionPoseSegments) {
    const from = compositionPoseJoints[segment.from];
    const to = compositionPoseJoints[segment.to];
    context.strokeStyle = segment.color;
    context.beginPath();
    context.moveTo(from.x * canvas.width, from.y * canvas.height);
    context.lineTo(to.x * canvas.width, to.y * canvas.height);
    context.stroke();
  }
  for (const joint of Object.values(compositionPoseJoints)) {
    context.fillStyle = joint.color;
    context.beginPath();
    context.arc(
      joint.x * canvas.width,
      joint.y * canvas.height,
      9,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  return canvasBlob(canvas);
};
