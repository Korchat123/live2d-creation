#!/usr/bin/env node

import { chromium } from "@playwright/test";

const outputArgument = process.argv.find((value) =>
  value.startsWith("--output="),
);
const output = outputArgument?.slice("--output=".length);
if (!output) throw new Error("Pass an explicit --output project path.");

const prompt =
  process.argv.find((value) => value.startsWith("--prompt="))?.slice(9) ??
  "original anime cat girl with long black hair streaked blue, amber eyes, cat hoodie jacket, white mini skirt";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.locator("#character-prompt").fill(prompt);
  await page.locator("#generate-concept").click();

  let previous = "";
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45 * 60 * 1000) {
    const providerStatus = await page.locator("#generation-status").innerText();
    const pipelineState = await page.locator("#automatic-state").innerText();
    const pipelineStatus = await page.locator("#automatic-status").innerText();
    const current = `${pipelineState}: ${pipelineStatus} | ${providerStatus}`;
    if (current !== previous) {
      process.stdout.write(`${new Date().toISOString()} ${current}\n`);
      previous = current;
    }
    if (pipelineState === "Ready") {
      const downloadPromise = page.waitForEvent("download");
      await page.locator("#download-automatic-project").click();
      const download = await downloadPromise;
      await download.saveAs(output);
      process.stdout.write(`Saved ${output}\n`);
      process.exitCode = 0;
      break;
    }
    if (pipelineState === "Needs retry" || pipelineState === "Rejected")
      throw new Error(current);
    await page.waitForTimeout(2000);
  }
  if (!(await page.locator("#download-automatic-project").isEnabled()))
    throw new Error("One-click generation did not finish within 45 minutes.");
} finally {
  await browser.close();
}
