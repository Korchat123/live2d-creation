import { expect, test } from "@playwright/test";

const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const requiredLayers = [
  "face base",
  "left eye white",
  "right eye white",
  "left pupil iris",
  "right pupil iris",
  "left upper eyelid",
  "right upper eyelid",
  "left lower eyelid",
  "right lower eyelid",
  "mouth closed lips",
  "mouth interior",
  "torso",
];

const generatedProject = JSON.stringify({
  version: 1,
  updatedAt: 7,
  source: image,
  layers: Object.fromEntries(requiredLayers.map((name) => [name, image])),
  generatedArtwork: {},
  expressionArtwork: {},
  missingArtwork: [],
  limitations: [],
});

test("presents one-click generation and restores a generated project", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Prompt once. Get a ready-to-use 2D avatar.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate Live2D avatar" }),
  ).toBeVisible();
  await expect(page.locator("#project-review")).toBeHidden();
  await expect(page.locator("#layer-lab")).toBeHidden();
  await expect(page.locator("#concept-checkpoint")).toBeHidden();
  await expect(page.locator("#accept-concept")).toBeHidden();

  await page
    .getByLabel("Character description")
    .fill("blue-haired woman with a navy jacket");
  await expect(page.locator("#automatic-status")).toContainText(
    "Enter a prompt",
  );

  await page.locator("#upload-automatic-project").setInputFiles({
    name: "avatar.open-avatar-project.json",
    mimeType: "application/json",
    buffer: Buffer.from(generatedProject),
  });
  await expect(page.locator("#automatic-state")).toHaveText("Ready");
  await expect(page.locator("#download-automatic-project")).toBeEnabled();
  await expect(page.locator("#open-automatic-motion")).toBeEnabled();
  await expect(page.locator('[data-stage="project"]')).toHaveAttribute(
    "data-state",
    "complete",
  );
  await page.locator("#open-automatic-motion").click();
  await expect(page).toHaveURL(/\/motion\.html$/u);
  await expect(page.locator("#motion-status")).toContainText(
    "Motion preview is live",
  );
});
