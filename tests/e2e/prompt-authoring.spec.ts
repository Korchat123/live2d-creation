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

test("restores and displays a pending Z-Image reference candidate", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    async ({ embeddedImage }) => {
      const modulePath = "/src/reference-review.ts";
      const review = await import(modulePath);
      const hash = "b".repeat(64);
      const state = review.addReferenceCandidate(
        review.createReferenceReviewState(1),
        {
          image: embeddedImage,
          width: 768,
          height: 1152,
          prompt: "front-facing anime catgirl",
          provenance: {
            provider: "comfyui",
            templateId: "open-avatar-z-image-turbo-v1",
            checkpoint: "z_image_turbo_bf16.safetensors",
            partCheckpoint: "animagine-xl-4.0-opt.safetensors",
            seed: 42,
            artifactSha256: hash,
          },
        },
        2,
      );
      await new review.IndexedDbReferenceReviewStore().save(state);
    },
    { embeddedImage: image },
  );

  await page.reload();
  await expect(page.locator("#concept-output")).toBeVisible();
  await expect(page.locator("#concept-provenance")).toHaveAttribute(
    "data-hash",
    "b".repeat(64),
  );
  await expect(page.locator("#accept-concept")).toBeEnabled();
});

test("restores an accepted neutral master and starts the automatic build only on resume", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    async ({ embeddedImage }) => {
      const modulePath = "/src/reference-review.ts";
      const review = await import(modulePath);
      const hash = "a".repeat(64);
      let state = review.createReferenceReviewState(1);
      state = review.addReferenceCandidate(
        state,
        {
          image: embeddedImage,
          width: 896,
          height: 1152,
          prompt: "front-facing anime librarian",
          provenance: {
            provider: "fake",
            templateId: "open-avatar-concept-v1",
            checkpoint: "fake-approved.safetensors",
            seed: 7,
            artifactSha256: hash,
          },
        },
        2,
      );
      state = review.acceptReferenceCandidate(state, hash, 3);
      await new review.IndexedDbReferenceReviewStore().save(state);
    },
    { embeddedImage: image },
  );

  await page.reload();
  await expect(page.locator("#concept-output")).toBeVisible();
  await expect(page.locator("#concept-provenance")).toHaveAttribute(
    "data-hash",
    "a".repeat(64),
  );
  await expect(page.locator("#generation-status")).toContainText(
    "Accepted neutral master restored",
  );
  await expect(page.locator("#accept-concept")).toHaveText(
    "Resume accepted reference",
  );
  await expect(page.locator('[data-stage="concept"]')).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.locator('[data-stage="parts"]')).not.toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(page.locator("#project-review")).toHaveCount(0);

  await page.locator("#accept-concept").click();
  await expect(page.locator("#automatic-state")).toHaveText("Building");
  await expect(page.locator('[data-stage="parts"]')).toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(page.locator("#project-review")).toHaveCount(0);
});

test("presents gated reference review and restores a generated project", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Prompt, combine saved parts, then test your 2D avatar.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate reference" }),
  ).toBeVisible();
  await expect(page.locator('[data-stage="concept"]')).toHaveText(
    "Interpret the prompt or approve a generated reference",
  );
  await expect(page.locator('[data-stage="parts"]')).toHaveText(
    "Select compatible saved sets and generate only catalog misses",
  );
  await expect(page.locator("#project-review")).toHaveCount(0);
  await expect(page.locator("#layer-lab")).toBeHidden();
  await expect(page.locator("#concept-checkpoint")).toBeVisible();
  await expect(page.locator("#accept-concept")).toBeVisible();
  await expect(page.locator("#accept-concept")).toBeDisabled();
  await expect(page.locator("#reject-concept")).toBeVisible();
  await expect(page.locator("#reject-concept")).toBeDisabled();
  await expect(page.locator(".prompt-plan")).toBeVisible();
  await expect(page.locator('[data-stage="parts"]')).not.toHaveAttribute(
    "data-state",
    "active",
  );

  await page
    .getByLabel("Character description")
    .fill("blue-haired woman with a navy jacket");
  await expect(page.locator("#automatic-status")).toContainText(
    "Generate a reference",
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
  await expect(page.locator("#readiness li")).toHaveCount(1);
  await expect(page.locator("#readiness li strong")).toHaveText("review");
});

test("assembles a recolored anatomy-compatible saved kit without ComfyUI", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Character description")
    .fill("cat girl with amber eyes and long black hair wearing a hoodie");
  await page.locator("#avatar-style").selectOption("vtuber");
  await page.locator("#avatar-kit-seed").fill("42");
  await page.locator("#plan-avatar-kit").click();

  await expect(page.locator("#avatar-kit-preview")).toBeVisible();
  await expect(page.locator("#avatar-kit-status")).toContainText(
    "Saved avatar assembled",
  );
  await expect(page.getByLabel("Hairstyle saved shape")).toHaveValue(
    "hair-long",
  );
  await expect(page.getByLabel("Animal ears saved shape")).toHaveValue(
    "ears-cat",
  );

  await page.locator("#use-avatar-kit").click();
  await expect(page.locator("#automatic-state")).toHaveText("Ready");
  await expect(page.locator("#open-automatic-motion")).toBeEnabled();
  await page.locator("#open-automatic-motion").click();
  await expect(page).toHaveURL(/\/motion\.html$/u);
  await expect(page.locator("#motion-status")).toContainText(
    "Motion preview is live",
  );
  await expect(page.locator("#readiness li strong")).toHaveText("review");
});
