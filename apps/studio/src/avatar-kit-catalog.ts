import type { ExportedProject, ExpressionName } from "./authoring.js";
import {
  minimumAvatarSetKinds,
  type AvatarKitCatalogEntry,
  type AvatarKitPlan,
  type AvatarSetKind,
} from "./avatar-kit-planner.js";

export type StarterAvatarCatalogEntry = AvatarKitCatalogEntry &
  Readonly<{ label: string }>;

const entry = (
  id: string,
  label: string,
  kind: AvatarSetKind,
  featureTags: readonly string[] = [],
  recolorableChannels: readonly string[] = [],
): StarterAvatarCatalogEntry => ({
  id,
  label,
  kind,
  anchorProfile: "standard-front-v1",
  compatibleAnchorProfiles: ["standard-front-v1"],
  styleTags: ["vtuber", "anime", "soft-anime"],
  featureTags,
  recolorableChannels,
});

export const starterAvatarCatalog: readonly StarterAvatarCatalogEntry[] = [
  entry("body-standard", "Standard", "body"),
  entry("body-petite", "Petite", "body", ["petite"]),
  entry("body-tall", "Tall", "body", ["tall"]),
  entry("body-slender", "Slender", "body", ["slender", "slim"]),
  entry("body-athletic", "Athletic", "body", ["athletic"]),
  entry("body-curvy", "Curvy", "body", ["curvy"]),
  entry("body-chibi", "Chibi", "body", ["chibi"]),
  entry("face-oval", "Oval redraw", "face", ["oval"]),
  entry("face-round", "Round redraw", "face", ["round"]),
  entry("face-heart", "Heart redraw", "face", ["heart", "sharp"]),
  entry("face-oval-slim", "Oval slim", "face", ["oval", "slim"]),
  entry("face-round-cute", "Rounded cute", "face", ["round", "cute"]),
  entry("face-oval-soft", "Oval soft", "face", ["oval", "soft"]),
  entry("face-round-small", "Rounded small", "face", ["round", "small"]),
  entry("face-heart-slim", "Heart slim", "face", ["heart", "slim"]),
  entry("face-rounded-small", "Rounded petite", "face", ["round", "petite"]),
  entry("face-squared-young", "Squared young", "face", ["square"]),
  entry("face-elongated", "Elongated", "face", ["elongated"]),
  entry("face-heart-deep", "Heart deep", "face", ["heart"]),
  entry("face-oval-pointed", "Oval pointed", "face", ["oval", "sharp"]),
  entry("face-oval-pointed-soft", "Oval pointed soft", "face", [
    "oval",
    "sharp",
  ]),
  entry("face-rounded-wide", "Rounded wide", "face", ["round", "wide"]),
  entry("face-sharp-oval", "Sharp oval", "face", ["oval", "sharp"]),
  entry("face-elongated-soft", "Elongated soft", "face", ["elongated", "soft"]),
  entry("eyes-almond", "Almond", "eyes", [], ["iris"]),
  entry("eyes-round", "Round", "eyes", [], ["iris"]),
  entry("eyes-upturned", "Upturned", "eyes", [], ["iris"]),
  entry("eyes-big-round", "Big round", "eyes", ["round"], ["iris"]),
  entry("eyes-droopy", "Mature droopy", "eyes", ["droopy"], ["iris"]),
  entry("eyes-soft-oval", "Soft oval", "eyes", ["soft"], ["iris"]),
  entry("eyes-puppy", "Puppy", "eyes", ["puppy"], ["iris"]),
  entry("eyes-sly-cat", "Sly cat", "eyes", ["cat"], ["iris"]),
  entry("eyes-doe", "Wide doe", "eyes", ["doe"], ["iris"]),
  entry("eyes-gentle", "Gentle elongated", "eyes", ["gentle"], ["iris"]),
  entry("mouth-gentle", "Gentle", "mouth"),
  entry("mouth-cheerful", "Cheerful", "mouth"),
  entry("mouth-neutral", "Neutral", "mouth", ["neutral"]),
  entry("mouth-frown", "Frown", "mouth", ["frown"]),
  entry("mouth-pout", "Pout", "mouth", ["pout"]),
  entry("mouth-vampire", "Vampire", "mouth", ["vampire"]),
  entry("hair-long", "Long", "hair", ["long"], ["hair"]),
  entry("hair-short", "Short", "hair", ["short"], ["hair"]),
  entry("hair-bob", "Bob", "hair", ["bob", "short"], ["hair"]),
  entry("hair-twin-tail", "Twin tail", "hair", ["twin-tail", "long"], ["hair"]),
  entry("hair-pixie", "Pixie", "hair", ["pixie", "short"], ["hair"]),
  entry(
    "hair-layered-bob",
    "Layered bob",
    "hair",
    ["bob", "layered"],
    ["hair"],
  ),
  entry(
    "hair-layered-long",
    "Layered long",
    "hair",
    ["long", "layered"],
    ["hair"],
  ),
  entry("hair-tight-curls", "Tight curls", "hair", ["curly"], ["hair"]),
  entry("outfit-tshirt", "T-shirt", "outfit", ["shirt"], ["fabric"]),
  entry(
    "outfit-hoodie",
    "Hoodie and skirt",
    "outfit",
    ["hoodie", "skirt"],
    ["fabric"],
  ),
  entry("outfit-sweater", "Knit sweater", "outfit", ["sweater"], ["fabric"]),
  entry(
    "outfit-overalls",
    "Casual overalls",
    "outfit",
    ["overalls"],
    ["fabric"],
  ),
  entry(
    "outfit-blouse-skirt",
    "Blouse and pleated skirt",
    "outfit",
    ["blouse", "skirt"],
    ["fabric"],
  ),
  entry("outfit-aline-dress", "A-line dress", "outfit", ["dress"], ["fabric"]),
  entry("ears-cat", "Cat ears", "animal-ears", ["cat"], ["fur"]),
  entry("ears-fox", "Fox ears", "animal-ears", ["fox"], ["fur"]),
  entry("ears-rabbit", "Rabbit ears", "animal-ears", ["rabbit"], ["fur"]),
  entry("tail-cat", "Cat tail", "tail", ["cat"], ["fur"]),
  entry("tail-fox", "Fox tail", "tail", ["fox"], ["fur"]),
  entry("headwear-witch", "Witch hat", "headwear", ["witch"], ["fabric"]),
  entry("headwear-crown", "Crown", "headwear", ["crown", "tiara"], ["metal"]),
  entry("prop-cane", "Ornate cane", "prop", ["cane", "staff"], ["metal"]),
  entry("prop-wand", "Magic wand", "prop", ["wand"], ["metal"]),
  entry("prop-sword", "Decorative sword", "prop", ["sword"], ["metal"]),
  entry("prop-spear", "Decorative spear", "prop", ["spear"], ["metal"]),
  entry("prop-umbrella", "Umbrella", "prop", ["umbrella"], ["fabric"]),
  entry("accessory-glasses", "Glasses", "accessory", ["glasses"], ["metal"]),
  entry(
    "accessory-choker",
    "Choker",
    "accessory",
    ["choker", "necklace"],
    ["fabric"],
  ),
] as const;

const safeCatalogToken = /^[a-z0-9][a-z0-9-]{0,63}$/u;

export const validateAvatarKitCatalog = (
  catalog: readonly AvatarKitCatalogEntry[],
): void => {
  if (catalog.length < minimumAvatarSetKinds.length || catalog.length > 256)
    throw new Error("The avatar-kit catalog size is invalid.");
  const ids = new Set<string>();
  catalog.forEach((candidate) => {
    if (
      !safeCatalogToken.test(candidate.id) ||
      !safeCatalogToken.test(candidate.anchorProfile) ||
      candidate.compatibleAnchorProfiles.length > 32 ||
      candidate.styleTags.length > 32 ||
      candidate.featureTags.length > 32 ||
      candidate.recolorableChannels.length > 16 ||
      [
        ...candidate.compatibleAnchorProfiles,
        ...candidate.styleTags,
        ...candidate.featureTags,
        ...candidate.recolorableChannels,
      ].some((value) => !safeCatalogToken.test(value))
    )
      throw new Error(`Invalid avatar-kit catalog entry: ${candidate.id}.`);
    if (ids.has(candidate.id))
      throw new Error(`Duplicate avatar-kit catalog entry: ${candidate.id}.`);
    ids.add(candidate.id);
  });
  for (const kind of minimumAvatarSetKinds.filter((kind) => kind !== "outfit"))
    if (!catalog.some((candidate) => candidate.kind === kind))
      throw new Error(`The avatar-kit catalog is missing ${kind}.`);
};

validateAvatarKitCatalog(starterAvatarCatalog);

export const missingCatalogKinds = (
  plan: AvatarKitPlan,
): readonly AvatarSetKind[] =>
  plan.sets
    .filter(({ source }) => source === "generate")
    .map(({ kind }) => kind);

const colorValues: Readonly<Record<string, string>> = {
  "light blue": "#74c9ff",
  "dark blue": "#173c75",
  "light green": "#81d49b",
  "dark green": "#234f38",
  "rose gold": "#c98f85",
  black: "#171923",
  white: "#f1f2ff",
  amber: "#e6a62e",
  blue: "#3388e8",
  green: "#48b870",
  red: "#d74b57",
  pink: "#e985ac",
  purple: "#7652bd",
  violet: "#7756ca",
  silver: "#bac5d6",
  gold: "#d4ad42",
  brown: "#704634",
  gray: "#697484",
  grey: "#697484",
  orange: "#dc7434",
};

export const catalogColor = (
  value: string | undefined,
  fallback: string,
): string => (value ? (colorValues[value.toLowerCase()] ?? value) : fallback);

const createCanvas = (width = 896, height = 1152): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

type Painter = (context: CanvasRenderingContext2D) => void;

const paintLayer = (
  paint: Painter,
): Readonly<{ artwork: string; mask: string }> => {
  const artwork = createCanvas();
  const context = artwork.getContext("2d");
  if (!context) throw new Error("Canvas artwork is unavailable.");
  context.lineCap = "round";
  context.lineJoin = "round";
  paint(context);
  const mask = createCanvas();
  const maskContext = mask.getContext("2d");
  if (!maskContext) throw new Error("Canvas masks are unavailable.");
  maskContext.drawImage(artwork, 0, 0);
  maskContext.globalCompositeOperation = "source-in";
  maskContext.fillStyle = "#ffffff";
  maskContext.fillRect(0, 0, mask.width, mask.height);
  return {
    artwork: artwork.toDataURL("image/png"),
    mask: mask.toDataURL("image/png"),
  };
};

const faceAssetModules = import.meta.glob<string>(
  "../../../assets/avatar-kit/catalog-v1/faces/*.png",
  { eager: true, query: "?url", import: "default" },
);
const faceAssetUrls: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(faceAssetModules).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -4),
    url,
  ]),
);

const loadBitmapLayer = async (
  source: string,
): Promise<Readonly<{ artwork: string; mask: string }>> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () =>
      reject(new Error("Could not load catalog artwork."));
    candidate.src = source;
  });
  if (image.naturalWidth !== 896 || image.naturalHeight !== 1152)
    throw new Error(
      "Catalog artwork does not use the standard 896x1152 canvas.",
    );
  const artwork = createCanvas();
  const artworkContext = artwork.getContext("2d");
  const mask = createCanvas();
  const maskContext = mask.getContext("2d");
  if (!artworkContext || !maskContext)
    throw new Error("Could not prepare catalog bitmap artwork.");
  artworkContext.drawImage(image, 0, 0);
  maskContext.drawImage(image, 0, 0);
  maskContext.globalCompositeOperation = "source-in";
  maskContext.fillStyle = "#ffffff";
  maskContext.fillRect(0, 0, mask.width, mask.height);
  return {
    artwork: artwork.toDataURL("image/png"),
    mask: mask.toDataURL("image/png"),
  };
};

const ellipse = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  fill: string,
  stroke = "#392c3a",
  lineWidth = 6,
): void => {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  if (lineWidth > 0) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
};

const polygon = (
  context: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  fill: string,
  stroke = "#392c3a",
  lineWidth = 6,
): void => {
  const first = points[0];
  if (!first) return;
  context.beginPath();
  context.moveTo(first[0], first[1]);
  points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  if (lineWidth > 0) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
};

const selectedId = (plan: AvatarKitPlan, kind: AvatarSetKind): string =>
  plan.sets.find((set) => set.kind === kind)?.catalogEntryId ??
  starterAvatarCatalog.find((candidate) => candidate.kind === kind)?.id ??
  "";

const selectedColor = (
  plan: AvatarKitPlan,
  kind: AvatarSetKind,
  channel: string,
  fallback: string,
): string =>
  catalogColor(
    plan.sets.find((set) => set.kind === kind)?.colorOverrides[channel],
    fallback,
  );

const renderStarterLayers = async (
  plan: AvatarKitPlan,
): Promise<
  Readonly<Record<string, Readonly<{ artwork: string; mask: string }>>>
> => {
  const layers: Record<
    string,
    Readonly<{ artwork: string; mask: string }>
  > = {};
  const add = (name: string, paint: Painter) => {
    layers[name] = paintLayer(paint);
  };
  const skin = "#f4c9bd";
  const skinShadow = "#dfa99f";
  const hair = selectedColor(plan, "hair", "hair", "#25355d");
  const iris = selectedColor(plan, "eyes", "iris", "#45a3cf");
  const bodyId = selectedId(plan, "body");
  const faceId = selectedId(plan, "face");
  const eyeId = selectedId(plan, "eyes");
  const hairId = selectedId(plan, "hair");
  const outfitId = selectedId(plan, "outfit");
  const outfit = selectedColor(plan, "outfit", "fabric", "#526da8");
  const petite = bodyId === "body-petite";
  const tall = bodyId === "body-tall";
  const shoulder =
    bodyId === "body-athletic" ? 166 : petite ? 132 : tall ? 160 : 148;
  const faceRx =
    faceId === "face-round" ? 127 : faceId === "face-heart" ? 112 : 120;
  const faceRy =
    faceId === "face-round" ? 132 : faceId === "face-heart" ? 151 : 143;
  const eyeRx = [
    "eyes-round",
    "eyes-big-round",
    "eyes-puppy",
    "eyes-doe",
  ].includes(eyeId)
    ? 42
    : eyeId === "eyes-sly-cat"
      ? 53
      : 49;
  const eyeRy =
    eyeId === "eyes-big-round"
      ? 34
      : eyeId === "eyes-puppy" || eyeId === "eyes-doe"
        ? 31
        : eyeId === "eyes-sly-cat"
          ? 19
          : eyeId === "eyes-droopy"
            ? 27
            : 24;
  const eyeY = eyeId === "eyes-upturned" ? 258 : 264;

  add("back hair", (context) => {
    ellipse(context, 448, 275, faceRx + 47, faceRy + 68, hair);
    if (
      [
        "hair-long",
        "hair-twin-tail",
        "hair-layered-long",
        "hair-tight-curls",
      ].includes(hairId)
    ) {
      ellipse(context, 360, 490, 76, 275, hair);
      ellipse(context, 536, 490, 76, 275, hair);
    }
    if (hairId === "hair-twin-tail") {
      ellipse(context, 270, 480, 72, 250, hair);
      ellipse(context, 626, 480, 72, 250, hair);
    }
  });
  add("left leg", (context) =>
    polygon(
      context,
      [
        [355, 735],
        [435, 735],
        [425, 1010],
        [365, 1010],
      ],
      skin,
    ),
  );
  add("right leg", (context) =>
    polygon(
      context,
      [
        [461, 735],
        [541, 735],
        [531, 1010],
        [471, 1010],
      ],
      skin,
    ),
  );
  add("left footwear", (context) =>
    polygon(
      context,
      [
        [352, 982],
        [430, 982],
        [446, 1066],
        [340, 1066],
      ],
      "#202533",
    ),
  );
  add("right footwear", (context) =>
    polygon(
      context,
      [
        [466, 982],
        [544, 982],
        [556, 1066],
        [450, 1066],
      ],
      "#202533",
    ),
  );
  add("torso", (context) =>
    polygon(
      context,
      [
        [448 - shoulder, 430],
        [448 + shoulder, 430],
        [554, 760],
        [342, 760],
      ],
      "#d6d9e7",
    ),
  );
  add("left arm and hand", (context) => {
    polygon(
      context,
      [
        [304, 450],
        [350, 470],
        [315, 752],
        [270, 730],
      ],
      "#cbd2df",
    );
    ellipse(context, 287, 756, 25, 36, skin);
  });
  add("right arm and hand", (context) => {
    polygon(
      context,
      [
        [592, 450],
        [546, 470],
        [581, 752],
        [626, 730],
      ],
      "#cbd2df",
    );
    ellipse(context, 609, 756, 25, 36, skin);
  });
  add("neck", (context) =>
    polygon(
      context,
      [
        [410, 370],
        [486, 370],
        [496, 466],
        [400, 466],
      ],
      skin,
    ),
  );
  add("face base", (context) => {
    ellipse(context, 448, 275, faceRx, faceRy, skin);
    ellipse(context, 326, 285, 19, 35, skinShadow, "#392c3a", 4);
    ellipse(context, 570, 285, 19, 35, skinShadow, "#392c3a", 4);
  });
  const eye = (side: "left" | "right", x: number) => {
    add(`${side} eye white`, (context) =>
      ellipse(context, x, eyeY, eyeRx, eyeRy, "#fffaf0", "#473342", 4),
    );
    add(`${side} pupil iris`, (context) => {
      ellipse(context, x, eyeY + 2, 17, 22, iris, "#302735", 4);
      ellipse(context, x, eyeY + 4, 7, 12, "#181621", "#181621", 0);
    });
    add(`${side} eye highlight`, (context) =>
      ellipse(context, x - 6, eyeY - 7, 5, 7, "#ffffff", "#ffffff", 0),
    );
    add(`${side} upper eyelid`, (context) => {
      context.beginPath();
      context.moveTo(x - eyeRx, eyeY);
      context.quadraticCurveTo(x, eyeY - eyeRy - 9, x + eyeRx, eyeY);
      context.strokeStyle = "#3c2a39";
      context.lineWidth = 8;
      context.stroke();
    });
    add(`${side} lower eyelid`, (context) => {
      context.beginPath();
      context.moveTo(x - eyeRx + 7, eyeY + 8);
      context.quadraticCurveTo(x, eyeY + eyeRy + 4, x + eyeRx - 7, eyeY + 8);
      context.strokeStyle = "#8d5960";
      context.lineWidth = 4;
      context.stroke();
    });
    add(`${side} eyebrow`, (context) => {
      context.beginPath();
      context.moveTo(x - 35, eyeY - 64);
      context.quadraticCurveTo(x, eyeY - 78, x + 35, eyeY - 62);
      context.strokeStyle = hair;
      context.lineWidth = 9;
      context.stroke();
    });
  };
  eye("left", 384);
  eye("right", 512);
  add("mouth interior", (context) =>
    ellipse(context, 448, 350, 35, 25, "#602d42", "#4b2638", 4),
  );
  add("tongue", (context) =>
    ellipse(context, 448, 362, 23, 9, "#e68b99", "#b75d73", 2),
  );
  add("teeth", (context) =>
    polygon(
      context,
      [
        [421, 341],
        [475, 341],
        [466, 350],
        [430, 350],
      ],
      "#fff9ed",
      "#fff9ed",
      0,
    ),
  );
  add("mouth closed lips", (context) => {
    context.beginPath();
    context.moveTo(417, 349);
    const mouthId = selectedId(plan, "mouth");
    const curve =
      mouthId === "mouth-cheerful"
        ? 365
        : mouthId === "mouth-frown"
          ? 337
          : mouthId === "mouth-neutral"
            ? 349
            : 357;
    context.quadraticCurveTo(448, curve, 479, 349);
    if (mouthId === "mouth-pout") context.arc(448, 350, 10, 0, Math.PI * 2);
    context.strokeStyle = "#9b4e62";
    context.lineWidth = 7;
    context.stroke();
  });
  add("outfit front", (context) => {
    const dress = outfitId === "outfit-aline-dress";
    const skirt =
      dress ||
      outfitId === "outfit-hoodie" ||
      outfitId === "outfit-blouse-skirt";
    polygon(
      context,
      [
        [326, 438],
        [570, 438],
        [552, 735],
        [344, 735],
      ],
      outfit,
    );
    polygon(
      context,
      [
        [300, 450],
        [356, 462],
        [320, 720],
        [265, 704],
      ],
      outfit,
    );
    polygon(
      context,
      [
        [596, 450],
        [540, 462],
        [576, 720],
        [631, 704],
      ],
      outfit,
    );
    if (skirt)
      polygon(
        context,
        [
          [344, 700],
          [552, 700],
          [620, dress ? 875 : 820],
          [276, dress ? 875 : 820],
        ],
        outfit,
      );
    if (outfitId === "outfit-overalls") {
      context.fillStyle = "#526b8e";
      context.fillRect(370, 520, 156, 230);
      context.lineWidth = 15;
      context.strokeStyle = "#526b8e";
      context.beginPath();
      context.moveTo(380, 520);
      context.lineTo(350, 445);
      context.moveTo(516, 520);
      context.lineTo(546, 445);
      context.stroke();
    }
    if (outfitId === "outfit-hoodie") {
      context.strokeStyle = "#e6e8f1";
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(448, 450);
      context.lineTo(448, 715);
      context.stroke();
      context.strokeRect(382, 610, 132, 72);
    }
    if (outfitId === "outfit-sweater") {
      context.strokeStyle = "#d9deea";
      context.lineWidth = 5;
      for (let x = 360; x <= 536; x += 22) {
        context.beginPath();
        context.moveTo(x, 470);
        context.lineTo(x, 710);
        context.stroke();
      }
    }
    if (outfitId === "outfit-blouse-skirt") {
      context.fillStyle = "#f1f2f7";
      context.fillRect(350, 448, 196, 245);
      context.strokeStyle = "#30384d";
      context.lineWidth = 4;
      for (let x = 310; x < 590; x += 35) {
        context.beginPath();
        context.moveTo(448, 700);
        context.lineTo(x, 815);
        context.stroke();
      }
    }
  });
  add("front hair", (context) => {
    polygon(
      context,
      [
        [329, 220],
        [360, 120],
        [448, 92],
        [536, 120],
        [567, 220],
        [520, 192],
        [492, 245],
        [448, 180],
        [410, 248],
        [377, 190],
      ],
      hair,
    );
    if (
      ["hair-bob", "hair-short", "hair-layered-bob", "hair-pixie"].includes(
        hairId,
      )
    ) {
      ellipse(context, 336, 310, 28, hairId === "hair-bob" ? 100 : 68, hair);
      ellipse(context, 560, 310, 28, hairId === "hair-bob" ? 100 : 68, hair);
    }
  });
  const ears = plan.sets.find(({ kind }) => kind === "animal-ears");
  if (ears) {
    add("headwear", (context) => {
      const earColor = selectedColor(plan, "animal-ears", "fur", hair);
      if (ears.requestedFeatures.includes("rabbit")) {
        ellipse(context, 378, 80, 30, 88, earColor);
        ellipse(context, 518, 80, 30, 88, earColor);
      } else {
        polygon(
          context,
          [
            [326, 172],
            [356, 54],
            [416, 148],
          ],
          earColor,
        );
        polygon(
          context,
          [
            [480, 148],
            [540, 54],
            [570, 172],
          ],
          earColor,
        );
      }
    });
  }
  const tail = plan.sets.find(({ kind }) => kind === "tail");
  const accessory = plan.sets.find(({ kind }) => kind === "accessory");
  if (tail || accessory)
    add("accessory", (context) => {
      if (tail) {
        context.beginPath();
        context.moveTo(555, 710);
        context.bezierCurveTo(730, 650, 760, 830, 650, 900);
        context.strokeStyle = hair;
        context.lineWidth = tail.requestedFeatures.includes("fox") ? 55 : 30;
        context.stroke();
      }
      if (accessory?.catalogEntryId === "accessory-glasses") {
        context.strokeStyle = "#454b5d";
        context.lineWidth = 6;
        context.strokeRect(336, 235, 92, 58);
        context.strokeRect(468, 235, 92, 58);
        context.beginPath();
        context.moveTo(428, 256);
        context.lineTo(468, 256);
        context.stroke();
      } else if (accessory) {
        context.beginPath();
        context.arc(448, 406, 48, 0.1, Math.PI - 0.1);
        context.strokeStyle = "#292431";
        context.lineWidth = 12;
        context.stroke();
      }
    });
  const prop = plan.sets.find(({ kind }) => kind === "prop");
  if (prop)
    add("held prop", (context) => {
      const propId = prop.catalogEntryId ?? "";
      context.strokeStyle = "#aeb8c8";
      context.fillStyle = "#aeb8c8";
      context.lineWidth = 12;
      if (propId === "prop-umbrella") {
        context.beginPath();
        context.arc(190, 405, 145, Math.PI, Math.PI * 2);
        context.lineTo(335, 405);
        context.lineTo(45, 405);
        context.closePath();
        context.fillStyle = "#526da8";
        context.fill();
        context.strokeStyle = "#30384d";
        context.lineWidth = 7;
        context.stroke();
        context.beginPath();
        context.moveTo(190, 405);
        context.lineTo(190, 920);
        context.quadraticCurveTo(190, 985, 235, 970);
        context.strokeStyle = "#aeb8c8";
        context.lineWidth = 12;
        context.stroke();
      } else {
        const sword = propId === "prop-sword";
        const spear = propId === "prop-spear";
        context.beginPath();
        context.moveTo(225, spear ? 190 : 315);
        context.lineTo(225, 950);
        context.stroke();
        if (sword) {
          context.beginPath();
          context.moveTo(180, 390);
          context.lineTo(270, 390);
          context.strokeStyle = "#d4ad42";
          context.stroke();
        } else if (spear) {
          polygon(
            context,
            [
              [225, 115],
              [190, 205],
              [260, 205],
            ],
            "#d9e2ef",
            "#667487",
            5,
          );
        } else {
          ellipse(
            context,
            225,
            300,
            propId === "prop-wand" ? 22 : 42,
            propId === "prop-wand" ? 22 : 42,
            "#d4ad42",
            "#667487",
            6,
          );
        }
      }
    });
  const faceAsset = faceAssetUrls[faceId];
  if (faceAsset) layers["face base"] = await loadBitmapLayer(faceAsset);
  return layers;
};

const expressionCanvas = (
  layers: Readonly<Record<string, Readonly<{ artwork: string; mask: string }>>>,
  name: ExpressionName,
): Promise<string> =>
  new Promise((resolve) => {
    const canvas = createCanvas();
    const context = canvas.getContext("2d");
    if (!context) return resolve(canvas.toDataURL("image/png"));
    if (name !== "open mouth") {
      const centers =
        name === "left wink"
          ? [384]
          : name === "right wink"
            ? [512]
            : [384, 512];
      context.strokeStyle = "#3c2a39";
      context.lineWidth = 9;
      context.lineCap = "round";
      centers.forEach((x) => {
        context.beginPath();
        context.moveTo(x - 44, 264);
        context.quadraticCurveTo(x, 286, x + 44, 264);
        context.stroke();
      });
      resolve(canvas.toDataURL("image/png"));
      return;
    }
    const names = ["mouth interior", "tongue", "teeth"];
    void Promise.all(
      names.map(
        (layerName) =>
          new Promise<HTMLImageElement | undefined>((done) => {
            const source = layers[layerName]?.artwork;
            if (!source) return done(undefined);
            const image = new Image();
            image.onload = () => done(image);
            image.onerror = () => done(undefined);
            image.src = source;
          }),
      ),
    )
      .then((images) => {
        images.forEach((image) => image && context.drawImage(image, 0, 0));
        resolve(canvas.toDataURL("image/png"));
      })
      .catch(() => resolve(canvas.toDataURL("image/png")));
  });

export const buildStarterAvatarProject = async (
  plan: AvatarKitPlan,
): Promise<ExportedProject> => {
  if (
    minimumAvatarSetKinds.some(
      (kind) => !plan.sets.some((set) => set.kind === kind),
    )
  )
    throw new Error("The avatar kit is missing a minimum set.");
  const rendered = await renderStarterLayers(plan);
  const transparent = createCanvas().toDataURL("image/png");
  const expressionNames: readonly ExpressionName[] = [
    "open mouth",
    "blink",
    "left wink",
    "right wink",
  ];
  const expressionArtwork = Object.fromEntries(
    await Promise.all(
      expressionNames.map(
        async (name) => [name, await expressionCanvas(rendered, name)] as const,
      ),
    ),
  );
  return {
    version: 1,
    updatedAt: Date.now(),
    source: transparent,
    layers: Object.fromEntries(
      Object.entries(rendered).map(([name, value]) => [name, value.mask]),
    ),
    generatedArtwork: Object.fromEntries(
      Object.entries(rendered).map(([name, value]) => [name, value.artwork]),
    ),
    expressionArtwork,
    missingArtwork: [],
    limitations: [
      "Starter catalog artwork uses the standard-front-v1 anatomy profile and conservative motion.",
      ...missingCatalogKinds(plan).map((kind) =>
        kind === "outfit"
          ? "No reusable outfit is applied; the neutral fitting suit remains visible until a body-matched outfit is generated and reviewed."
          : `No reviewed ${kind} catalog match exists; a compatible saved fallback is shown until that set is generated and approved.`,
      ),
    ],
  };
};
