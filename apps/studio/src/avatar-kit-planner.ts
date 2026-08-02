/** Private Studio planning types. They are not an Open Avatar file contract. */
export const minimumAvatarSetKinds = [
  "body",
  "face",
  "eyes",
  "mouth",
  "hair",
  "outfit",
] as const;

export const optionalAvatarSetKinds = [
  "animal-ears",
  "tail",
  "headwear",
  "prop",
  "accessory",
] as const;

export type AvatarSetKind =
  | (typeof minimumAvatarSetKinds)[number]
  | (typeof optionalAvatarSetKinds)[number];

export type AvatarKitCatalogEntry = Readonly<{
  id: string;
  kind: AvatarSetKind;
  /** Shared geometry/landmark profile used to prevent anatomically invalid mixes. */
  anchorProfile: string;
  compatibleAnchorProfiles: readonly string[];
  styleTags: readonly string[];
  featureTags: readonly string[];
  recolorableChannels: readonly string[];
}>;

export type PlannedAvatarSet = Readonly<{
  kind: AvatarSetKind;
  source: "catalog" | "generate";
  catalogEntryId?: string;
  anchorProfile: string;
  requestedFeatures: readonly string[];
  colorOverrides: Readonly<Record<string, string>>;
  generationPrompt?: string;
}>;

export type AvatarKitPlan = Readonly<{
  seed: number;
  anchorProfile: string;
  sets: readonly PlannedAvatarSet[];
}>;

const colors = [
  "light blue",
  "dark blue",
  "light green",
  "dark green",
  "rose gold",
  "black",
  "white",
  "amber",
  "blue",
  "green",
  "red",
  "pink",
  "purple",
  "violet",
  "silver",
  "gold",
  "brown",
  "gray",
  "grey",
  "orange",
] as const;

const normalized = (value: string): string => value.trim().toLowerCase();

const colorNear = (
  prompt: string,
  role: "eyes" | "hair",
): string | undefined => {
  const value = normalized(prompt);
  return colors.find((color) => {
    const colorIndex = value.indexOf(color);
    if (colorIndex < 0) return false;
    const roleIndex = value.indexOf(role, colorIndex + color.length);
    if (roleIndex < 0) return false;
    return (
      value
        .slice(colorIndex + color.length, roleIndex)
        .trim()
        .split(/\s+/u)
        .filter(Boolean).length <= 3
    );
  });
};

const requestedFeatures = (
  prompt: string,
  kind: AvatarSetKind,
): readonly string[] => {
  const value = normalized(prompt);
  const tags: string[] = [];
  const add = (pattern: RegExp, tag: string) => {
    if (pattern.test(value)) tags.push(tag);
  };
  if (kind === "body") {
    add(/\bpetite\b/u, "petite");
    add(/\btall\b/u, "tall");
  }
  if (kind === "face") {
    add(/\bround face\b/u, "round");
    add(/\bsharp face\b|\bpointed chin\b/u, "sharp");
  }
  if (kind === "hair") {
    add(/\blong\b(?:\s+\w+){0,3}\s+hair\b/u, "long");
    add(/\bshort\b(?:\s+\w+){0,3}\s+hair\b/u, "short");
    add(/\btwin.?tails?\b/u, "twin-tail");
    add(/\bbob(?: cut)?\b/u, "bob");
  }
  if (kind === "outfit") {
    add(/\bgothic\b/u, "gothic");
    add(/\bhoodie\b/u, "hoodie");
    add(/\bdress\b/u, "dress");
    add(/\bjacket\b/u, "jacket");
  }
  if (kind === "animal-ears") {
    add(/\bcat(?: girl| boy| ears?)?\b/u, "cat");
    add(/\bfox(?: girl| boy| ears?)?\b/u, "fox");
    add(/\b(?:bunny|rabbit)(?: girl| boy| ears?)?\b/u, "rabbit");
    add(/\b(?:dog|wolf)(?: girl| boy| ears?)?\b/u, "canine");
  }
  if (kind === "tail") {
    add(/\bcat tail\b/u, "cat");
    add(/\bfox tail\b/u, "fox");
    add(/\b(?:dog|wolf) tail\b/u, "canine");
  }
  if (kind === "headwear") {
    add(/\bwitch hat\b/u, "witch");
    add(/\bcrown\b/u, "crown");
    add(/\btiara\b/u, "tiara");
  }
  if (kind === "prop") {
    add(/\bcane\b/u, "cane");
    add(/\bstaff\b/u, "staff");
    add(/\bwand\b/u, "wand");
    add(/\bsword\b/u, "sword");
    add(/\bspear\b/u, "spear");
    add(/\bumbrella\b/u, "umbrella");
    add(/\baxe\b/u, "axe");
    add(/\bscythe\b/u, "scythe");
  }
  if (kind === "accessory") {
    add(/\bglasses\b/u, "glasses");
    add(/\bchoker\b/u, "choker");
    add(/\bnecklace\b/u, "necklace");
  }
  return tags;
};

const requestedKinds = (prompt: string): readonly AvatarSetKind[] => {
  const value = normalized(prompt);
  const result: AvatarSetKind[] = [...minimumAvatarSetKinds];
  const add = (kind: AvatarSetKind, pattern: RegExp) => {
    if (pattern.test(value) && !result.includes(kind)) result.push(kind);
  };
  add(
    "animal-ears",
    /\b(cat|fox|bunny|rabbit|dog|wolf)(?: girl| boy| ears?)?\b/u,
  );
  add("tail", /\b(cat|fox|dog|wolf) tail\b/u);
  add("headwear", /\b(hat|cap|crown|tiara|headwear)\b/u);
  add("prop", /\b(cane|staff|wand|sword|spear|umbrella|axe|scythe)\b/u);
  add("accessory", /\b(glasses|choker|necklace|earrings?|brooch|jewelry)\b/u);
  return result;
};

const stableIndex = (seed: number, key: string, length: number): number => {
  let hash = seed >>> 0;
  for (const character of key) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return length ? hash % length : 0;
};

const generationPrompt = (
  kind: AvatarSetKind,
  prompt: string,
  anchorProfile: string,
  features: readonly string[],
): string =>
  [
    `Create only one ${kind} avatar set`,
    `fit anatomy anchor profile ${anchorProfile}`,
    features.length ? `required features: ${features.join(", ")}` : "",
    `character request: ${prompt.trim()}`,
    "front-facing registered full-canvas RGBA artwork",
    "preserve attachment anchors and do not generate a complete character",
  ]
    .filter(Boolean)
    .join(", ");

export const planAvatarKit = (
  prompt: string,
  seed: number,
  catalog: readonly AvatarKitCatalogEntry[],
  style?: string,
): AvatarKitPlan => {
  const styleTag = style ? normalized(style) : undefined;
  const bodyFeatures = requestedFeatures(prompt, "body");
  const bodyCandidates = catalog
    .filter(
      (entry) =>
        entry.kind === "body" &&
        (!styleTag || entry.styleTags.includes(styleTag)) &&
        bodyFeatures.every((tag) => entry.featureTags.includes(tag)),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  const body = bodyCandidates[stableIndex(seed, "body", bodyCandidates.length)];
  const anchorProfile = body?.anchorProfile ?? "standard-front-v1";

  const sets = requestedKinds(prompt).map((kind): PlannedAvatarSet => {
    const features = requestedFeatures(prompt, kind);
    const candidates = catalog
      .filter(
        (entry) =>
          entry.kind === kind &&
          (kind === "body" ||
            entry.anchorProfile === anchorProfile ||
            entry.compatibleAnchorProfiles.includes(anchorProfile)) &&
          (!styleTag || entry.styleTags.includes(styleTag)) &&
          features.every((tag) => entry.featureTags.includes(tag)),
      )
      .sort((left, right) => left.id.localeCompare(right.id));
    const selected =
      kind === "body"
        ? body
        : candidates[stableIndex(seed, kind, candidates.length)];
    const colorOverrides: Record<string, string> = {};
    if (kind === "eyes") {
      const eyeColor = colorNear(prompt, "eyes");
      if (
        eyeColor &&
        (!selected || selected.recolorableChannels.includes("iris"))
      )
        colorOverrides.iris = eyeColor;
    }
    if (kind === "hair") {
      const hairColor = colorNear(prompt, "hair");
      if (
        hairColor &&
        (!selected || selected.recolorableChannels.includes("hair"))
      )
        colorOverrides.hair = hairColor;
    }
    return selected
      ? {
          kind,
          source: "catalog",
          catalogEntryId: selected.id,
          anchorProfile,
          requestedFeatures: features,
          colorOverrides,
        }
      : {
          kind,
          source: "generate",
          anchorProfile,
          requestedFeatures: features,
          colorOverrides,
          generationPrompt: generationPrompt(
            kind,
            prompt,
            anchorProfile,
            features,
          ),
        };
  });
  return { seed: seed >>> 0, anchorProfile, sets };
};
