import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("release metadata traces the checked commit with checksums and a CycloneDX SBOM", () => {
  const output = mkdtempSync(join(tmpdir(), "open-avatar-release-"));
  try {
    execFileSync(
      process.execPath,
      ["tools/create-release-metadata.mjs", "--output", output],
      {
        stdio: "pipe",
      },
    );
    const metadata = JSON.parse(
      readFileSync(join(output, "release-metadata.json"), "utf8"),
    );
    const sbom = JSON.parse(
      readFileSync(join(output, "sbom.cdx.json"), "utf8"),
    );
    const checksums = readFileSync(join(output, "checksums.sha256"), "utf8");

    assert.match(metadata.commit, /^[0-9a-f]{40}$/u);
    assert.equal(
      metadata.sourceFiles.some(({ path }) => path === "pnpm-lock.yaml"),
      true,
    );
    assert.match(checksums, /pnpm-lock\.yaml$/mu);
    assert.equal(sbom.bomFormat, "CycloneDX");
    assert.equal(sbom.specVersion, "1.5");
    assert.equal(
      sbom.components.some(({ name }) => name === "@open-avatar/runtime"),
      true,
    );
    assert.equal(
      sbom.components.some(({ name }) => name === "pixi.js"),
      true,
    );
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
