#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const outputArgument = process.argv.find((value) =>
  value.startsWith("--output="),
);
const output = outputArgument?.slice("--output=".length);
if (!output) throw new Error("Pass an explicit --output project path.");

const prompt =
  process.argv.find((value) => value.startsWith("--prompt="))?.slice(9) ??
  "original anime cat girl with long black hair streaked blue, amber eyes, cat hoodie jacket, white mini skirt";
const style =
  process.argv.find((value) => value.startsWith("--style="))?.slice(8) ??
  "vtuber";
if (!new Set(["vtuber", "anime", "soft-anime"]).has(style))
  throw new Error("--style must be vtuber, anime, or soft-anime.");

const downloadStoredProject = async (page) => {
  const downloadPromise = page.waitForEvent("download");
  await page.evaluate(async () => {
    const contents = await new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open("open-avatar-generated", 1);
      request.onerror = () =>
        reject(new Error("Could not open avatar storage."));
      request.onsuccess = () => {
        const database = request.result;
        const stored = database
          .transaction("projects", "readonly")
          .objectStore("projects")
          .get("active");
        stored.onerror = () => {
          database.close();
          reject(new Error("Could not read the generated project."));
        };
        stored.onsuccess = () => {
          database.close();
          resolve(stored.result);
        };
      };
    });
    if (typeof contents !== "string")
      throw new Error("The generated project was not stored.");
    const anchor = globalThis.document.createElement("a");
    anchor.href = URL.createObjectURL(
      new Blob([contents], { type: "application/json" }),
    );
    anchor.download = "generated.open-avatar-project.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  });
  const download = await downloadPromise;
  await download.saveAs(output);
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#character-prompt").fill(prompt);
  await page.locator("#avatar-style").selectOption(style);
  await page.locator("#generate-concept").click();

  let previous = "";
  let accepted = false;
  let completed = false;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45 * 60 * 1000) {
    if (new URL(page.url()).pathname === "/motion.html") {
      const motionStatus = await page.locator("#motion-status").innerText();
      if (motionStatus.includes("Motion preview is live")) {
        await downloadStoredProject(page);
        const bytes = await readFile(output);
        const project = JSON.parse(bytes.toString("utf8"));
        process.stdout.write(
          `${JSON.stringify(
            {
              output,
              bytes: bytes.byteLength,
              sha256: createHash("sha256").update(bytes).digest("hex"),
              masks: Object.keys(project.layers ?? {}).length,
              generatedArtwork: Object.keys(project.generatedArtwork ?? {})
                .length,
              expressions: Object.keys(project.expressionArtwork ?? {}).length,
              missingArtwork: project.missingArtwork ?? [],
              limitations: project.limitations ?? [],
            },
            null,
            2,
          )}\n`,
        );
        completed = true;
        process.exitCode = 0;
        break;
      }
      if (
        motionStatus.includes("invalid") ||
        motionStatus.includes("No validated")
      )
        throw new Error(motionStatus);
      await page.waitForTimeout(2000);
      continue;
    }
    const providerStatus = await page.locator("#generation-status").innerText();
    const pipelineState = await page.locator("#automatic-state").innerText();
    const pipelineStatus = await page.locator("#automatic-status").innerText();
    const current = `${pipelineState}: ${pipelineStatus} | ${providerStatus}`;
    if (current !== previous) {
      process.stdout.write(`${new Date().toISOString()} ${current}\n`);
      previous = current;
    }
    if (!accepted && (await page.locator("#accept-concept").isEnabled())) {
      await page.locator("#accept-concept").click();
      accepted = true;
      process.stdout.write(
        `${new Date().toISOString()} Accepted the generated neutral master.\n`,
      );
    }
    if (pipelineState === "Needs retry" || pipelineState === "Rejected")
      throw new Error(current);
    await page.waitForTimeout(2000);
  }
  if (!completed)
    throw new Error("One-click generation did not finish within 45 minutes.");
} finally {
  await browser.close();
}
