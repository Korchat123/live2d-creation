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

test("keeps a portrait concept preview inside its safe stage", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#concept-output").evaluate((element) => {
    const imageElement = element as HTMLImageElement;
    imageElement.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='896' height='1152'%3E%3Crect width='896' height='1152' fill='white'/%3E%3C/svg%3E";
    imageElement.hidden = false;
  });
  const stage = await page.locator(".concept-image-stage").boundingBox();
  const imageBox = await page.locator("#concept-output").boundingBox();
  const candidate = await page.locator(".concept-candidate").boundingBox();
  expect(stage).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(candidate).not.toBeNull();
  expect(imageBox!.x).toBeGreaterThanOrEqual(stage!.x);
  expect(imageBox!.y).toBeGreaterThanOrEqual(stage!.y);
  expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(
    stage!.x + stage!.width + 1,
  );
  expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(
    stage!.y + stage!.height + 1,
  );
  expect(stage!.x + stage!.width).toBeLessThanOrEqual(
    candidate!.x + candidate!.width + 1,
  );
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
    page.getByRole("button", { name: "Generate Open Avatar" }),
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
