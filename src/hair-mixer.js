export const hairMixerStyles = Object.freeze([
  ["long-straight", "Long straight"],
  ["short-bob", "Short bob"],
  ["hime-cut", "Hime cut"],
  ["high-ponytail", "High ponytail"],
  ["twin-tails", "Twin tails"],
  ["messy-ahoge", "Messy ahoge"],
  ["double-bun", "Double bun"],
  ["side-braid", "Side braid"],
  ["wolf-cut", "Wolf cut"],
  ["long-wavy", "Long wavy"]
].map(([id, name]) => Object.freeze({ id, name })));

export const hairAddons = Object.freeze([
  ["ahoge", "Ahoge", "messy-ahoge/ahoge/ahoge.png", "front"],
  ["bun-left", "Left bun", "double-bun/buns/bun-left.png", "front"],
  ["bun-right", "Right bun", "double-bun/buns/bun-right.png", "front"],
  ["braid-left", "Side braid", "side-braid/braids/braid-left.png", "front"],
  ["ponytail", "Ponytail", "high-ponytail/ponytails/ponytail.png", "back"],
  ["twin-tail-left", "Left tail", "twin-tails/twin-tails/twin-tail-left.png", "back"],
  ["twin-tail-right", "Right tail", "twin-tails/twin-tails/twin-tail-right.png", "back"]
].map(([id, name, relativePath, zone]) => Object.freeze({ id, name, relativePath, zone })));

const backFiles = [
  "back-hair/back-left.png", "back-hair/back-center.png", "back-hair/back-right.png",
  "nape/nape-left.png", "nape/nape-right.png"
];

const frontFiles = [
  "side-locks/side-lock-left.png", "side-locks/side-lock-right.png",
  "front-hair/front-left.png", "front-hair/front-center.png", "front-hair/front-right.png",
  "other/crown.png"
];

function styleExists(style) {
  return hairMixerStyles.some((candidate) => candidate.id === style);
}

export function defaultHairMix() {
  return { backStyle: "long-straight", frontStyle: "long-straight", addons: [], color: "#29262d" };
}

export function normalizeHairMix(value) {
  const fallback = defaultHairMix();
  const validAddons = new Set(hairAddons.map((addon) => addon.id));
  return {
    backStyle: styleExists(value?.backStyle) ? value.backStyle : fallback.backStyle,
    frontStyle: styleExists(value?.frontStyle) ? value.frontStyle : fallback.frontStyle,
    addons: [...new Set(value?.addons ?? [])].filter((id) => validAddons.has(id)),
    color: /^#[0-9a-f]{6}$/i.test(value?.color ?? "") ? value.color : fallback.color
  };
}

export function composeHairLayers(value) {
  const mix = normalizeHairMix(value);
  const root = "./assets/parts/hair";
  const result = {
    back: backFiles.map((file) => `${root}/${mix.backStyle}/${file}`),
    front: [
      `${root}/${mix.frontStyle}/source/source.png`,
      ...frontFiles.map((file) => `${root}/${mix.frontStyle}/${file}`)
    ]
  };
  for (const id of mix.addons) {
    const addon = hairAddons.find((candidate) => candidate.id === id);
    result[addon.zone].push(`${root}/${addon.relativePath}`);
  }
  return result;
}
