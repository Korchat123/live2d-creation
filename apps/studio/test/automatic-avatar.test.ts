import { describe, expect, it } from "vitest";
import {
  parseAutomaticAvatarProject,
  serializeAutomaticAvatarProject,
} from "../src/automatic-avatar.js";

const image = "data:image/png;base64,AAAA";
const requiredLayers = [
  "face base",
  "left eye white",
  "right eye white",
  "left pupil iris",
  "right pupil iris",
  "left upper eyelid",
  "right upper eyelid",
  "left lower eyelid",
  "right lower eyelid",
  "mouth closed lips",
  "mouth interior",
  "torso",
];

const project = {
  version: 1 as const,
  updatedAt: 7,
  source: image,
  layers: Object.fromEntries(requiredLayers.map((name) => [name, image])),
  generatedArtwork: {},
  expressionArtwork: {},
  missingArtwork: [],
  limitations: [],
};

describe("automatic Open Avatar projects", () => {
  it("round-trips a bounded generated project", () => {
    expect(
      parseAutomaticAvatarProject(serializeAutomaticAvatarProject(project)),
    ).toEqual(project);
  });

  it("rejects missing motion layers and remote images", () => {
    expect(() =>
      parseAutomaticAvatarProject(
        JSON.stringify({ ...project, layers: { "face base": image } }),
      ),
    ).toThrow("missing required motion parts");
    expect(() =>
      parseAutomaticAvatarProject(
        JSON.stringify({
          ...project,
          source: "https://example.com/avatar.png",
        }),
      ),
    ).toThrow("Invalid project source image");
  });

  it("rejects unknown expression keys and oversized metadata", () => {
    expect(() =>
      parseAutomaticAvatarProject(
        JSON.stringify({
          ...project,
          expressionArtwork: { "run command": image },
        }),
      ),
    ).toThrow("unknown expression state");
    expect(() =>
      parseAutomaticAvatarProject(
        JSON.stringify({ ...project, limitations: ["x".repeat(1001)] }),
      ),
    ).toThrow("Invalid limitations");
  });
});
