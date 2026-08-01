#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

const value = (name, fallback) =>
  process.argv
    .find((argument) => argument.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;

const output = value("output");
if (!output) throw new Error("Pass --output=<explicit PNG path>.");
const url = value("url", "http://127.0.0.1:5173");
const prompt = value(
  "prompt",
  "original adult anime catgirl with long black hair streaked blue, amber eyes, cat hoodie jacket, white pleated mini skirt",
);
const style = value("style", "vtuber");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#generate-concept").waitFor({ state: "visible" });
  await page.locator("#character-prompt").fill(prompt);
  await page.locator("#avatar-style").selectOption(style);
  await page.locator("#generate-concept").click();
  await page.waitForFunction(
    () => {
      const status =
        globalThis.document.querySelector("#generation-status")?.textContent;
      return (
        status?.includes("saved") ||
        status?.includes("failed") ||
        status?.includes("unavailable") ||
        status?.includes("rejected") ||
        status?.includes("finish within")
      );
    },
    undefined,
    { timeout: 10 * 60 * 1000 },
  );
  const status = await page.locator("#generation-status").innerText();
  if (!status.includes("saved")) throw new Error(status);
  await page.waitForFunction(
    () => {
      const image = globalThis.document.querySelector("#concept-output");
      return (
        image instanceof globalThis.HTMLImageElement &&
        !image.hidden &&
        image.src
      );
    },
    undefined,
    { timeout: 30_000 },
  );
  const bytes = await page
    .locator("#concept-output")
    .evaluate(async (image) =>
      Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())),
    );
  const buffer = Buffer.from(bytes);
  await writeFile(output, buffer);
  process.stdout.write(
    `${JSON.stringify(
      {
        output,
        bytes: buffer.byteLength,
        sha256: createHash("sha256").update(buffer).digest("hex"),
        model: await page.locator("#concept-checkpoint").inputValue(),
        style,
        status,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await browser.close();
}
