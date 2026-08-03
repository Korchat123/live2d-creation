import { expect, it } from "vitest";
import {
  planAvatarKit,
  type AvatarKitCatalogEntry,
} from "../src/avatar-kit-planner.js";

const entry = (
  id: string,
  kind: AvatarKitCatalogEntry["kind"],
  featureTags: readonly string[] = [],
): AvatarKitCatalogEntry => ({
  id,
  kind,
  anchorProfile: "standard-front-v1",
  compatibleAnchorProfiles: ["standard-front-v1"],
  styleTags: ["vtuber"],
  featureTags,
  recolorableChannels:
    kind === "eyes" ? ["iris"] : kind === "hair" ? ["hair"] : [],
});

const catalog = [
  entry("body-a", "body"),
  entry("face-a", "face"),
  entry("face-b", "face"),
  entry("face-heart", "face", ["heart"]),
  entry("eyes-a", "eyes"),
  entry("eyes-b", "eyes"),
  entry("mouth-a", "mouth"),
  entry("hair-long", "hair", ["long"]),
  entry("hair-short", "hair", ["short"]),
  entry("outfit-a", "outfit"),
  entry("cat-ears-a", "animal-ears", ["cat"]),
] as const;

it("builds a seeded compatible kit and applies prompt color channels", () => {
  const first = planAvatarKit(
    "cat girl with amber eyes and long black hair",
    42,
    catalog,
    "vtuber",
  );
  const repeated = planAvatarKit(
    "cat girl with amber eyes and long black hair",
    42,
    catalog,
    "vtuber",
  );
  expect(repeated).toEqual(first);
  expect(
    first.sets.find(({ kind }) => kind === "eyes")?.colorOverrides,
  ).toEqual({
    iris: "amber",
  });
  expect(first.sets.find(({ kind }) => kind === "hair")).toMatchObject({
    catalogEntryId: "hair-long",
    colorOverrides: { hair: "black" },
  });
  expect(first.sets.find(({ kind }) => kind === "animal-ears")).toMatchObject({
    source: "catalog",
    catalogEntryId: "cat-ears-a",
  });
});

it("selects the PDF-derived heart face when the prompt requests it", () => {
  const plan = planAvatarKit(
    "anime girl with a heart-shaped face",
    3,
    catalog,
    "vtuber",
  );
  expect(plan.sets.find(({ kind }) => kind === "face")).toMatchObject({
    source: "catalog",
    catalogEntryId: "face-heart",
    requestedFeatures: ["heart"],
  });
});

it("requests generation only for a missing compatible set", () => {
  const withoutCatEars = catalog.filter(({ kind }) => kind !== "animal-ears");
  const plan = planAvatarKit(
    "cat girl with amber eyes",
    7,
    withoutCatEars,
    "vtuber",
  );
  const ears = plan.sets.find(({ kind }) => kind === "animal-ears");
  expect(ears).toMatchObject({
    source: "generate",
    anchorProfile: "standard-front-v1",
    requestedFeatures: ["cat"],
  });
  expect(ears?.generationPrompt).toContain(
    "Create only one animal-ears avatar set",
  );
  expect(ears?.generationPrompt).toContain(
    "do not generate a complete character",
  );
  expect(plan.sets.filter(({ source }) => source === "generate")).toHaveLength(
    1,
  );
});

it("does not mix entries from an incompatible anatomy profile", () => {
  const incompatibleEyes: AvatarKitCatalogEntry = {
    ...entry("eyes-wide-head", "eyes"),
    anchorProfile: "wide-head-v1",
    compatibleAnchorProfiles: ["wide-head-v1"],
  };
  const plan = planAvatarKit(
    "black hair and green eyes",
    9,
    catalog.filter(({ kind }) => kind !== "eyes").concat(incompatibleEyes),
    "vtuber",
  );
  expect(plan.sets.find(({ kind }) => kind === "eyes")).toMatchObject({
    source: "generate",
    anchorProfile: "standard-front-v1",
  });
});
