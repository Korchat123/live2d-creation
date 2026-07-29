import { expect, test } from "@playwright/test";

test.skip(
  !process.env["RUN_RENDERER_GOLDEN"],
  "Run in the browser-render CI job with approved WebGL workers.",
);

test("minimal avatar remains stable through context recovery", async ({
  page,
}) => {
  await page.goto("/renderer-pixi/minimal-avatar.html");
  await expect(page.locator("canvas")).toHaveScreenshot("minimal-avatar.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    canvas?.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    canvas?.dispatchEvent(new Event("webglcontextrestored"));
  });
  await expect(page.locator("canvas")).toHaveScreenshot(
    "minimal-avatar-recovered.png",
    { animations: "disabled", maxDiffPixelRatio: 0.01 },
  );
});
