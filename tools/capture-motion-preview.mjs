#!/usr/bin/env node

import { chromium } from "@playwright/test";

const argument = (name) =>
  process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
const project = argument("project");
const output = argument("output");
if (!project || !output)
  throw new Error("Pass explicit --project and --output paths.");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
  });
  await page.goto("http://127.0.0.1:5173", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#upload-automatic-project").setInputFiles(project);
  await page.locator("#open-automatic-motion").click();
  await page.waitForURL("**/motion.html");
  await page
    .locator("#motion-status")
    .filter({ hasText: "Motion preview is live" })
    .waitFor({ timeout: 60_000 });
  await page.locator(".motion-grid").screenshot({ path: output });
  process.stdout.write(`Saved ${output}\n`);
} finally {
  await browser.close();
}
