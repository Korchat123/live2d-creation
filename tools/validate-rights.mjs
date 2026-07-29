import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(
  root,
  "assets/reference-avatar/LICENSES/rights.json",
);
const reportPath = resolve(root, "artifacts/rights-review.json");
const allowedReviewStatuses = new Set(["incomplete", "blocked", "approved"]);
const allowedAssetStatuses = new Set(["unresolved", "approved", "rejected"]);

export function validateRights(manifest) {
  const errors = [];
  const blockers = [];
  const object = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  if (!object(manifest))
    return {
      errors: ["Manifest must be an object."],
      blockers: [],
      exportEligible: false,
    };
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must equal 1.");
  if (typeof manifest.collection !== "string" || !manifest.collection)
    errors.push("collection must be a non-empty string.");
  if (!object(manifest.review)) errors.push("review must be an object.");
  else if (!allowedReviewStatuses.has(manifest.review.status))
    errors.push("review.status is invalid.");
  if (!object(manifest.emptyState))
    errors.push("emptyState must be an object.");
  if (!Array.isArray(manifest.assets)) errors.push("assets must be an array.");

  if (Array.isArray(manifest.assets)) {
    if (manifest.assets.length === 0) {
      if (manifest.emptyState?.declared !== true)
        errors.push(
          "An empty inventory must declare emptyState.declared=true.",
        );
      blockers.push(
        "No assets exist; ownership and redistribution are unreviewed.",
      );
    } else if (manifest.emptyState?.declared !== false) {
      errors.push("emptyState.declared must be false when assets exist.");
    }

    for (const [index, asset] of manifest.assets.entries()) {
      const label = `assets[${index}]`;
      if (!object(asset)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      for (const field of [
        "id",
        "path",
        "kind",
        "source",
        "author",
        "copyrightOwner",
        "license",
        "modifications",
        "permissions",
        "evidence",
        "review",
      ]) {
        if (!(field in asset)) errors.push(`${label}.${field} is required.`);
      }
      if (!allowedAssetStatuses.has(asset.review?.status))
        errors.push(`${label}.review.status is invalid.`);
      if (asset.review?.status !== "approved")
        blockers.push(`${label} is not approved.`);
      if (!Array.isArray(asset.evidence) || asset.evidence.length === 0)
        blockers.push(`${label} has no review evidence.`);
      for (const permission of [
        "sourceUse",
        "modification",
        "redistribution",
        "commercialUse",
      ]) {
        if (asset.permissions?.[permission] !== true)
          blockers.push(`${label}.permissions.${permission} is not confirmed.`);
      }
    }
  }

  if (manifest.review?.status !== "approved")
    blockers.push("Collection review is not approved.");

  return {
    errors: [...new Set(errors)],
    blockers: [...new Set(blockers)],
    exportEligible: errors.length === 0 && blockers.length === 0,
  };
}

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    console.error(`Unable to read rights manifest: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const result = validateRights(manifest);
  const report = {
    schemaVersion: 1,
    manifest: "assets/reference-avatar/LICENSES/rights.json",
    ...result,
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (result.errors.length > 0) {
    console.error("Rights manifest validation failed.");
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    result.exportEligible
      ? "Rights manifest valid and export eligible."
      : `Rights manifest valid; export blocked (${result.blockers.length} blocker(s)).`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
