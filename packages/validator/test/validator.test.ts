import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  BUNDLE_LIMITS,
  validateBundle,
  type BundleSource,
} from "../src/index.js";

const encoder = new TextEncoder();
const image = encoder.encode("safe image bytes");
const hash = createHash("sha256").update(image).digest("hex");
const manifest = (overrides: Record<string, unknown> = {}) => ({
  manifestVersion: "1.0",
  id: "test-avatar",
  name: "Test Avatar",
  canvas: { width: 64, height: 64 },
  assets: [
    { id: "face", type: "image", path: "layers/face.png", sha256: hash },
  ],
  parameters: [],
  capabilities: {},
  ...overrides,
});
const source = (
  value = manifest(),
  files: BundleSource["files"] = [{ path: "layers/face.png", bytes: image }],
): BundleSource => ({
  manifestBytes: encoder.encode(JSON.stringify(value)),
  files,
});
const codes = async (value: BundleSource) => {
  const result = await validateBundle(value);
  return result.ok ? [] : result.diagnostics.map((item) => item.code);
};

describe("validateBundle", () => {
  it("returns a transactional copy that can be disposed", async () => {
    const bytes = image.slice();
    const result = await validateBundle(
      source(manifest(), [{ path: "layers/face.png", bytes }]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    bytes[0] = 0;
    expect(result.bundle.getFile("layers/face.png")).toEqual(image);
    result.bundle.dispose();
    expect(result.bundle.disposed).toBe(true);
    expect(() => result.bundle.getFile("layers/face.png")).toThrow("disposed");
  });

  it("rejects missing and undeclared files", async () => {
    expect(await codes(source(manifest(), []))).toContain("MISSING_FILE");
    expect(
      await codes(
        source(manifest(), [
          { path: "layers/face.png", bytes: image },
          { path: "extra.png", bytes: image },
        ]),
      ),
    ).toContain("UNDECLARED_FILE");
  });

  it("rejects traversal, duplicate paths, and case collisions", async () => {
    expect(
      await codes(source(manifest(), [{ path: "../face.png", bytes: image }])),
    ).toContain("INVALID_PATH");
    expect(
      await codes(
        source(manifest(), [
          { path: "layers/face.png", bytes: image },
          { path: "layers/face.png", bytes: image },
        ]),
      ),
    ).toContain("DUPLICATE_PATH");
    expect(
      await codes(
        source(manifest(), [
          { path: "layers/face.png", bytes: image },
          { path: "LAYERS/FACE.PNG", bytes: image },
        ]),
      ),
    ).toContain("CASE_COLLISION");
  });

  it("rejects invalid checksums and unknown versions", async () => {
    const badHash = manifest({
      assets: [
        {
          id: "face",
          type: "image",
          path: "layers/face.png",
          sha256: "0".repeat(64),
        },
      ],
    });
    expect(await codes(source(badHash))).toContain("CHECKSUM_MISMATCH");
    expect(await codes(source(manifest({ manifestVersion: "2.0" })))).toContain(
      "UNSUPPORTED_VERSION",
    );
    expect(await codes(source(manifest({ manifestVersion: "1.1" })))).toEqual(
      [],
    );
  });

  it("rejects oversized input before parsing or retaining it", async () => {
    expect(
      await codes({
        manifestBytes: new Uint8Array(BUNDLE_LIMITS.maxManifestBytes + 1),
        files: [],
      }),
    ).toEqual(["MANIFEST_TOO_LARGE"]);
    expect(
      await codes(
        source(manifest(), [
          {
            path: "layers/face.png",
            bytes: new Uint8Array(BUNDLE_LIMITS.maxFileBytes + 1),
          },
        ]),
      ),
    ).toContain("FILE_TOO_LARGE");
  });

  it("supports explicit cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await codes(source(manifest()))).toEqual([]);
    const result = await validateBundle(source(manifest()), {
      signal: controller.signal,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("CANCELLED");
  });
});
