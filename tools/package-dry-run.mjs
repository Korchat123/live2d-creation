import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const outputDirectory = join("artifacts", `phase-0-${sha}`);

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });
execFileSync("git", [
  "archive",
  "--format=zip",
  `--output=${join(outputDirectory, "source.zip")}`,
  sha,
]);
writeFileSync(
  join(outputDirectory, "artifact-metadata.json"),
  `${JSON.stringify({ phase: "0", commit: sha, source: basename(process.cwd()) }, null, 2)}\n`,
);
console.log(`Created dry-run artifact for ${sha} in ${outputDirectory}`);
