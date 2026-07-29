import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = resolve(root, "assets/fixtures/minimal-avatar");
const limits = {
  maxAssets: 8,
  maxAssetBytes: 16 * 1024,
  maxTotalBytes: 64 * 1024,
  maxCanvasDimension: 512,
};

const manifest = JSON.parse(
  await readFile(resolve(fixtureRoot, "avatar.json"), "utf8"),
);
const failures = [];
if (manifest.assets.length > limits.maxAssets)
  failures.push(`asset count exceeds ${limits.maxAssets}`);
if (
  manifest.canvas.width > limits.maxCanvasDimension ||
  manifest.canvas.height > limits.maxCanvasDimension
)
  failures.push(`canvas exceeds ${limits.maxCanvasDimension}px per dimension`);

let totalBytes = 0;
for (const asset of manifest.assets) {
  const size = (await stat(resolve(fixtureRoot, asset.path))).size;
  totalBytes += size;
  if (size > limits.maxAssetBytes)
    failures.push(`${asset.path} exceeds ${limits.maxAssetBytes} bytes`);
}
if (totalBytes > limits.maxTotalBytes)
  failures.push(`total asset bytes exceed ${limits.maxTotalBytes}`);

if (failures.length) {
  console.error("First-party avatar budget check failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `First-party avatar budget passed: ${manifest.assets.length} assets, ${totalBytes} bytes, ${manifest.canvas.width}x${manifest.canvas.height}.`,
  );
}
