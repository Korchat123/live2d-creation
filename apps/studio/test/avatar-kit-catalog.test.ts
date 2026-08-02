import { expect, it } from "vitest";
import {
  catalogColor,
  missingCatalogKinds,
  starterAvatarCatalog,
  validateAvatarKitCatalog,
} from "../src/avatar-kit-catalog.js";
import {
  minimumAvatarSetKinds,
  planAvatarKit,
} from "../src/avatar-kit-planner.js";

it("provides multiple compatible saved choices for every minimum set", () => {
  for (const kind of minimumAvatarSetKinds) {
    const entries = starterAvatarCatalog.filter((entry) => entry.kind === kind);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(
      entries.every((entry) => entry.anchorProfile === "standard-front-v1"),
    ).toBe(true);
  }
});

it("rejects duplicate or malformed catalog metadata", () => {
  expect(() =>
    validateAvatarKitCatalog([
      ...starterAvatarCatalog,
      starterAvatarCatalog[0]!,
    ]),
  ).toThrow("Duplicate");
  expect(() =>
    validateAvatarKitCatalog(
      starterAvatarCatalog.map((entry, index) =>
        index === 0 ? { ...entry, anchorProfile: "../escape" } : entry,
      ),
    ),
  ).toThrow("Invalid avatar-kit catalog entry");
});

it("resolves named prompt colors without changing unknown explicit colors", () => {
  expect(catalogColor("amber", "#000000")).toBe("#e6a62e");
  expect(catalogColor("#123456", "#000000")).toBe("#123456");
  expect(catalogColor(undefined, "#abcdef")).toBe("#abcdef");
});

it("reports only requested sets absent from the reviewed catalog", () => {
  const common = planAvatarKit(
    "cat girl with amber eyes and long black hair wearing a hoodie",
    42,
    starterAvatarCatalog,
    "vtuber",
  );
  expect(missingCatalogKinds(common)).toEqual([]);

  const savedProp = planAvatarKit(
    "woman holding an ornate cane",
    42,
    starterAvatarCatalog,
    "vtuber",
  );
  expect(savedProp.sets.find(({ kind }) => kind === "prop")).toMatchObject({
    source: "catalog",
    catalogEntryId: "prop-cane",
  });
  expect(missingCatalogKinds(savedProp)).toEqual([]);

  const unusual = planAvatarKit(
    "woman holding a scythe",
    42,
    starterAvatarCatalog,
    "vtuber",
  );
  expect(missingCatalogKinds(unusual)).toEqual(["prop"]);
});
