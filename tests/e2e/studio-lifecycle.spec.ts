import { expect, test } from "@playwright/test";

test("renders, accepts human input, resizes, and disposes safely", async ({
  page,
}) => {
  const pixiWarnings: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "warning" &&
      message.text().includes("TextureSource managed by Assets")
    )
      pixiWarnings.push(message.text());
  });
  await page.goto("/");

  await expect(page.locator("#status")).toHaveText("Renderer ready");
  await page.locator("#x").fill("0.5");
  await expect(page.locator("#xv")).toHaveText("0.50");
  await expect(page.locator("#last")).toHaveText("human: set gaze");

  await page.setViewportSize({ width: 900, height: 700 });
  await expect(page.locator("#avatar")).toBeVisible();

  await page.locator("#dispose").click();
  await expect(page.locator("#status")).toHaveText("Renderer disposed");
  await page.locator("#dispose").click();
  await expect(page.locator("#status")).toHaveText("Renderer disposed");
  await expect.poll(() => pixiWarnings).toEqual([]);
});
