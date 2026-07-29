import { readFile } from "node:fs/promises";

const capabilityPath = new URL(
  "../docs/protocol/capabilities.md",
  import.meta.url,
);
const checklistPath = new URL(
  "../docs/authoring/acceptance-checklist.md",
  import.meta.url,
);

const [capabilities, checklist] = await Promise.all([
  readFile(capabilityPath, "utf8"),
  readFile(checklistPath, "utf8"),
]);

const requiredPrefixes = [
  "EXP",
  "MOT",
  "GAZ",
  "BLK",
  "MOU",
  "POS",
  "INT",
  "RST",
  "RED",
  "HUM",
  "AIC",
  "HOV",
];
const headingPattern = /^### (CAP-[A-Z]{3}-\d{3})\s*$/gmu;
const rowPattern = /^\| (CAP-[A-Z]{3}-\d{3}) \|/gmu;
const headings = [...capabilities.matchAll(headingPattern)].map(
  (match) => match[1],
);
const rows = [...checklist.matchAll(rowPattern)].map((match) => match[1]);
const errors = [];

const duplicates = (values) => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
];

for (const id of duplicates(headings))
  errors.push(`Duplicate capability heading: ${id}`);
for (const id of duplicates(rows))
  errors.push(`Duplicate acceptance row: ${id}`);

for (const prefix of requiredPrefixes) {
  if (!headings.some((id) => id.startsWith(`CAP-${prefix}-`)))
    errors.push(`Missing required capability category: ${prefix}`);
}

for (const id of headings) {
  if (!rows.includes(id))
    errors.push(`Capability has no acceptance row: ${id}`);
}
for (const id of rows) {
  if (!headings.includes(id))
    errors.push(`Acceptance row has no capability heading: ${id}`);
}

if (
  !capabilities.includes("RMS-derived mouth openness only") ||
  !capabilities.includes("Visemes are deferred")
) {
  errors.push("The v1 RMS-only and deferred-viseme decision is missing.");
}

if (errors.length > 0) {
  console.error("Requirements traceability check failed.");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Requirements traceability check passed (${headings.length} capabilities).`,
  );
}
