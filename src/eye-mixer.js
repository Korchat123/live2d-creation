export const eyeColorChannels = Object.freeze([
  { id: "sclera", name: "Eye white", defaultColor: "#f8f6f3" },
  { id: "iris", name: "Iris", defaultColor: "#287bd1" },
  { id: "pupil", name: "Pupil", defaultColor: "#11152d" }
]);

export function defaultEyeMix() {
  return Object.fromEntries(eyeColorChannels.map((channel) => [channel.id, channel.defaultColor]));
}

export function normalizeEyeMix(value) {
  const fallback = defaultEyeMix();
  return Object.fromEntries(eyeColorChannels.map((channel) => {
    const color = value?.[channel.id];
    return [channel.id, /^#[0-9a-f]{6}$/i.test(color ?? "") ? color : fallback[channel.id]];
  }));
}

export function eyeMaskPath(style, channel) {
  if (!/^[a-z0-9-]+$/.test(style) || !eyeColorChannels.some((item) => item.id === channel)) {
    throw new Error("Unknown eye color mask");
  }
  return `./assets/parts/eyes/${style}/color-masks/${channel}.png`;
}
