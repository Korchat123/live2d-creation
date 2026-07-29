import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const runGit = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const checksumLine = (hash, path) => `${hash}${"  "}${path}`;
const commit = runGit("rev-parse", "HEAD");
const outputArgument = process.argv.indexOf("--output");
const outputDirectory = resolve(
  outputArgument >= 0 && process.argv[outputArgument + 1]
    ? process.argv[outputArgument + 1]
    : join("artifacts", `release-metadata-${commit}`),
);

mkdirSync(outputDirectory, { recursive: true });

const archivePath = join(outputDirectory, `open-2d-avatar-${commit}.zip`);
execFileSync("git", [
  "archive",
  "--format=zip",
  `--output=${archivePath}`,
  commit,
]);

const trackedFiles = runGit("ls-files")
  .split(/\r?\n/u)
  .filter(Boolean)
  .sort()
  .map((path) => {
    const content = readFileSync(path);
    return { path, sha256: sha256(content), size: content.byteLength };
  });

const workspacePackages = runGit("ls-files", "**/package.json", "package.json")
  .split(/\r?\n/u)
  .filter(Boolean)
  .sort()
  .map((path) => ({ path, ...JSON.parse(readFileSync(path, "utf8")) }))
  .filter(({ name }) => typeof name === "string")
  .map(({ name, version, private: isPrivate, path }) => ({
    type: "library",
    name,
    version: version ?? "0.0.0",
    purl: `pkg:npm/${encodeURIComponent(name)}@${version ?? "0.0.0"}`,
    properties: [
      { name: "open-avatar:workspace-path", value: path },
      { name: "open-avatar:private", value: String(Boolean(isPrivate)) },
    ],
  }));

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
const externalPackages = [
  ...lockfile.matchAll(
    /^ {2}((?:@[^/\s]+\/)?[^@\s:]+)@([^:\s(]+)(?:\([^)]*\))?:$/gmu,
  ),
]
  .map(([, name, version]) => ({ name, version }))
  .filter(({ name }) => !name.startsWith("file:"))
  .sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      left.version.localeCompare(right.version),
  )
  .filter(
    (entry, index, entries) =>
      index === 0 ||
      entry.name !== entries[index - 1].name ||
      entry.version !== entries[index - 1].version,
  )
  .map(({ name, version }) => ({
    type: "library",
    name,
    version,
    purl: `pkg:npm/${encodeURIComponent(name)}@${version}`,
  }));

const archive = readFileSync(archivePath);
const checksums = [
  checksumLine(sha256(archive), archivePath.replaceAll("\\", "/")),
  ...trackedFiles.map((file) => checksumLine(file.sha256, file.path)),
].join("\n");
writeFileSync(join(outputDirectory, "checksums.sha256"), `${checksums}\n`);

writeFileSync(
  join(outputDirectory, "release-metadata.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      product: "Open 2D Avatar",
      commit,
      sourceArchive: {
        file: archivePath.replaceAll("\\", "/"),
        sha256: sha256(archive),
        size: archive.byteLength,
      },
      sourceFiles: trackedFiles,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  join(outputDirectory, "sbom.cdx.json"),
  `${JSON.stringify(
    {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      serialNumber: `urn:uuid:${sha256(commit).slice(0, 8)}-${sha256(commit).slice(8, 12)}-${sha256(commit).slice(12, 16)}-${sha256(commit).slice(16, 20)}-${sha256(commit).slice(20, 32)}`,
      version: 1,
      metadata: {
        component: {
          type: "application",
          name: "open-2d-avatar",
          version: commit,
        },
      },
      components: [...workspacePackages, ...externalPackages],
    },
    null,
    2,
  )}\n`,
);

console.log(`Created release metadata for ${commit} in ${outputDirectory}`);
