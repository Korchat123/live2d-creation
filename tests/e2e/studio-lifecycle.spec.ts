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
  await expect(page.locator("#semantic-actions button")).toHaveCount(11);
  await page.getByRole("button", { name: "sad" }).click();
  await expect(page.locator("#last")).toHaveText("human: play expression");
  await page.keyboard.press("KeyW");
  await expect(page.locator("#last")).toHaveText("human: play motion");
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

test("matches the approved first-party fixture render", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "The committed pixel baseline is reviewed on Chromium.",
  );
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto("/");
  await expect(page.locator("#status")).toHaveText("Renderer ready");

  await page.locator("#x").fill("0.5");
  await page.locator("#mouth").fill("0.65");
  await expect(page.locator("#stage")).toHaveScreenshot(
    "minimal-avatar-controls.png",
    { animations: "disabled" },
  );
});

test("loads the generated test avatar without replacing the fixture", async ({
  page,
}) => {
  await page.goto("/?avatar=generated");
  await expect(page.locator("#status")).toHaveText("Renderer ready");
  await expect(
    page.getByRole("heading", { name: "Generated test avatar" }),
  ).toBeVisible();
  await expect(page.locator("#avatar")).toBeVisible();
});
