export const categories = [
  { id: "preview", label: "Preview", icon: "★", ready: true },
  { id: "base", label: "Base", icon: "◇", ready: true },
  { id: "anatomy", label: "Anatomy", icon: "◎", ready: true },
  { id: "bust", label: "Bust", icon: "◡", ready: true },
  { id: "hair", label: "Hair", icon: "≈", ready: true },
  { id: "eyes", label: "Eyes", icon: "◉", ready: true },
  { id: "mouth", label: "Mouth", icon: "⌣", ready: true },
  { id: "outfit", label: "Outfit", icon: "♢", ready: true },
  { id: "accessory", label: "Extras", icon: "+", ready: false }
];

const anatomyStyles = [
  ["shojo-grace", "Shojo grace", "Long delicate", "#efc7b4"],
  ["shonen-athletic", "Shonen athletic", "Balanced strong", "#e8bda8"],
  ["chibi-pop", "Chibi pop", "Compact SD", "#f0bca0"],
  ["bishonen-sleek", "Bishonen sleek", "Tall narrow", "#edc9b0"],
  ["seinen-heroic", "Seinen heroic", "Broad powerful", "#dfa98f"],
  ["josei-elegant", "Josei elegant", "Mature refined", "#f0c9b3"],
  ["genki-compact", "Genki compact", "Short energetic", "#eab197"],
  ["idol-balanced", "Idol balanced", "Clean standard", "#edc2a9"],
  ["fantasy-elfin", "Fantasy elfin", "Slender pointed", "#efc7b2"],
  ["retro-90s", "Retro 90s", "Long angular", "#ebbd9f"]
];

const genders = [
  ["female", "Female"],
  ["male", "Male"],
  ["androgynous", "Androgynous"]
];

const bustAnchorY = {
  "shojo-grace": 0.27,
  "shonen-athletic": 0.27,
  "chibi-pop": 0.415,
  "bishonen-sleek": 0.255,
  "seinen-heroic": 0.27,
  "josei-elegant": 0.28,
  "genki-compact": 0.29,
  "idol-balanced": 0.28,
  "fantasy-elfin": 0.27,
  "retro-90s": 0.27
};

const headFit = {
  "shojo-grace": { left: 0.4306, top: 0.007, width: 0.1388, height: 0.1619 },
  "shonen-athletic": { left: 0.4374, top: -0.0039, width: 0.1252, height: 0.1738 },
  "chibi-pop": { left: 0.319, top: -0.0072, width: 0.3619, height: 0.3364 },
  "bishonen-sleek": { left: 0.4442, top: 0.0078, width: 0.1116, height: 0.145 },
  "seinen-heroic": { left: 0.4442, top: 0.0067, width: 0.1116, height: 0.1682 },
  "josei-elegant": { left: 0.4306, top: 0.0118, width: 0.1388, height: 0.1625 },
  "genki-compact": { left: 0.4306, top: 0.0113, width: 0.1388, height: 0.1738 },
  "idol-balanced": { left: 0.4306, top: 0.0118, width: 0.1388, height: 0.1625 },
  "fantasy-elfin": { left: 0.4442, top: 0.017, width: 0.1116, height: 0.1569 },
  "retro-90s": { left: 0.4442, top: 0.0124, width: 0.1116, height: 0.1506 }
};

const handAnchors = {
  "shojo-grace": { leftX: 385 / 2048, rightX: 1663 / 2048, y: 430 / 2048 },
  "shonen-athletic": { leftX: 303 / 2048, rightX: 1745 / 2048, y: 430 / 2048 },
  "chibi-pop": { leftX: 385 / 2048, rightX: 1663 / 2048, y: 686 / 2048 },
  "bishonen-sleek": { leftX: 324 / 2048, rightX: 1724 / 2048, y: 420 / 2048 },
  "seinen-heroic": { leftX: 303 / 2048, rightX: 1745 / 2048, y: 451 / 2048 },
  "josei-elegant": { leftX: 344 / 2048, rightX: 1704 / 2048, y: 471 / 2048 },
  "genki-compact": { leftX: 344 / 2048, rightX: 1704 / 2048, y: 482 / 2048 },
  "idol-balanced": { leftX: 344 / 2048, rightX: 1704 / 2048, y: 440 / 2048 },
  "fantasy-elfin": { leftX: 344 / 2048, rightX: 1704 / 2048, y: 450 / 2048 },
  "retro-90s": { leftX: 344 / 2048, rightX: 1704 / 2048, y: 420 / 2048 }
};

const faceCrop = {
  "shojo-grace": [922, 31, 1126, 317],
  "shonen-athletic": [932, 10, 1116, 317],
  "chibi-pop": [758, 20, 1290, 614],
  "bishonen-sleek": [942, 31, 1106, 287],
  "seinen-heroic": [942, 31, 1106, 328],
  "josei-elegant": [922, 41, 1126, 328],
  "genki-compact": [922, 41, 1126, 348],
  "idol-balanced": [922, 41, 1126, 328],
  "fantasy-elfin": [942, 51, 1106, 328],
  "retro-90s": [942, 41, 1106, 307]
};

function cropFit(style) {
  const [left, top, right, bottom] = faceCrop[style];
  return { left: left / 2048, top: top / 2048, width: (right - left) / 2048, height: (bottom - top) / 2048 };
}

const anatomyParts = anatomyStyles.flatMap(([style, name, detail, swatch]) =>
  genders.map(([gender, genderLabel]) => ({
    id: `anatomy-${style}-${gender}`,
    category: "anatomy",
    name: `${name} · ${genderLabel}`,
    detail: `${detail} · ${genderLabel}`,
    gender,
    style,
    headFit: headFit[style],
    handAnchors: handAnchors[style],
    swatch,
    asset: `./assets/anatomy/${style}/${gender}/source/source.png`,
    handAsset: `./assets/anatomy/${style}/${gender}/hands/hands-registered.png`
  }))
);

const faceParts = anatomyStyles.flatMap(([style, name, , swatch]) =>
  genders.map(([gender, genderLabel]) => ({
    id: `base-${style}-${gender}`,
    category: "base",
    name: `${name} · ${genderLabel}`,
    detail: "Matched face base",
    gender,
    style,
    headFit: headFit[style],
    faceFit: cropFit(style),
    swatch,
    asset: `./assets/parts/face-base/${style}/${gender}.png`
  }))
);

const bustParts = anatomyStyles.map(([style, name, , swatch]) => ({
  id: `bust-${style}`,
  category: "bust",
  name: `${name} bust`,
  detail: "Independent covered layer",
  style,
  swatch,
  anchorY: bustAnchorY[style],
  leftAsset: `./assets/parts/bust/${style}/bust-left.png`,
  rightAsset: `./assets/parts/bust/${style}/bust-right.png`,
  asset: `./assets/parts/bust/${style}/bust-full.png`
}));

const hairStyles = [
  ["long-straight", "Long straight", "Black · center curtain", 1.2],
  ["short-bob", "Short bob", "Chestnut · rounded", 1],
  ["hime-cut", "Hime cut", "Indigo · blunt fringe", 1.08],
  ["high-ponytail", "High ponytail", "Auburn · flowing tail", 1.1],
  ["twin-tails", "Twin tails", "Rose · paired tails", 1.05],
  ["messy-ahoge", "Messy ahoge", "Silver · tousled", 1.05],
  ["double-bun", "Double bun", "Brown · paired buns", 1.12],
  ["side-braid", "Side braid", "Golden · thick braid", 1],
  ["wolf-cut", "Wolf cut", "Blue-black · layered", 1.05],
  ["long-wavy", "Long wavy", "Teal · controlled curls", 1.08]
];

const hairParts = hairStyles.map(([style, name, detail, fitScale]) => ({
  id: `hair-${style}`,
  category: "hair",
  name,
  detail,
  style,
  fitScale,
  swatch: "#4b3b4f",
  asset: `./assets/parts/hair/${style}/source/source.png`
}));

const eyeStyles = [
  ["classic-blue", "Classic blue", "Large balanced"],
  ["soft-brown", "Soft brown", "Warm gentle"],
  ["sharp-red", "Sharp red", "Confident tapered"],
  ["sleepy-violet", "Sleepy violet", "Calm half-lidded"],
  ["round-green", "Round green", "Bright cheerful"],
  ["golden-cat", "Golden cat", "Amber catlike"],
  ["heterochromia", "Heterochromia", "Blue and amber"],
  ["monochrome-gray", "Monochrome gray", "Cool composed"],
  ["magical-star", "Magical star", "Turquoise highlights"],
  ["mature-narrow", "Mature narrow", "Refined subtle"]
];

const eyeParts = eyeStyles.map(([style, name, detail]) => ({
  id: `eyes-${style}`,
  category: "eyes",
  name,
  detail,
  style,
  swatch: "#d9c7dd",
  asset: `./assets/parts/eyes/${style}/source/source.png`
}));

const outfitStyles = [
  ["academy-blazer", "Academy blazer", "Navy tailored"],
  ["sailor-uniform", "Sailor uniform", "Navy and white"],
  ["oversized-hoodie", "Oversized hoodie", "Lavender casual"],
  ["gothic-dress", "Gothic dress", "Black and burgundy"],
  ["idol-stage", "Idol stage", "White pink gold"],
  ["fantasy-mage", "Fantasy mage", "Deep blue layered"],
  ["cyber-street", "Cyber street", "Black neon cyan"],
  ["modern-yukata", "Modern yukata", "Plum floral"],
  ["formal-suit", "Formal suit", "Charcoal tailored"],
  ["sporty-jacket", "Sporty jacket", "Teal athletic"]
];

const outfitParts = outfitStyles.map(([style, name, detail]) => ({
  id: `outfit-${style}`,
  category: "outfit",
  name,
  detail,
  style,
  swatch: "#746277",
  asset: `./assets/parts/outfits/${style}/source/source.png`
}));

const mouthStyles = [
  ["neutral-closed", "Neutral closed", "Calm resting line"],
  ["gentle-smile", "Gentle smile", "Soft closed smile"],
  ["small-open", "Small open", "Talking vowel"],
  ["wide-happy", "Wide happy", "Cheerful open smile"],
  ["surprised-o", "Surprised O", "Round surprised vowel"],
  ["frown", "Frown", "Sad closed curve"],
  ["teeth-smile", "Teeth smile", "Bright toothy grin"],
  ["tongue-smile", "Tongue smile", "Playful open smile"]
];

const mouthParts = mouthStyles.map(([style, name, detail]) => ({
  id: `mouth-${style}`,
  category: "mouth",
  name,
  detail,
  style,
  swatch: "#9e4b56",
  asset: `./assets/parts/mouth/${style}/source/source.png`
}));

export const parts = [
  {
    id: "base-anime-neutral-v3",
    category: "base",
    name: "Anime neutral",
    detail: "Face base 01",
    swatch: "#f7c8ad",
    headFit: headFit["idol-balanced"],
    faceFit: cropFit("idol-balanced"),
    asset: "./assets/parts/face-base/anime-neutral-v3.png"
  },
  ...faceParts,
  ...anatomyParts,
  ...bustParts,
  ...hairParts,
  ...eyeParts,
  ...mouthParts,
  ...outfitParts
];

export const initialSelection = Object.freeze({
  base: "base-idol-balanced-androgynous",
  anatomy: "anatomy-idol-balanced-androgynous",
  bust: "bust-idol-balanced",
  hair: "hair-long-straight",
  eyes: "eyes-classic-blue",
  mouth: "mouth-gentle-smile",
  outfit: "outfit-academy-blazer"
});

export function selectPart(selection, part, catalog = parts) {
  const knownPart = catalog.find((candidate) => candidate.id === part.id);
  if (!knownPart || knownPart.category !== part.category) {
    throw new Error("Cannot select an unknown or mismatched part");
  }

  return { ...selection, [knownPart.category]: knownPart.id };
}

export function selectedParts(selection, catalog = parts) {
  return Object.entries(selection).map(([category, id]) => {
    const part = catalog.find((candidate) => candidate.id === id && candidate.category === category);
    if (!part) throw new Error(`Selection contains an invalid ${category} part`);
    return part;
  });
}

export function partsForCategory(category, gender = "all", catalog = parts) {
  return catalog.filter((part) =>
    part.category === category &&
    (!["base", "anatomy"].includes(category) || gender === "all" || part.gender === gender)
  );
}
