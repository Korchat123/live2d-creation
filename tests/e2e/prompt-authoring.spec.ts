import { expect, test } from "@playwright/test";

const acceptedConcept = {
  image:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  width: 768,
  height: 768,
  prompt: "blue-haired librarian",
  provenance: {
    provider: "fake",
    templateId: "open-avatar-concept-v1",
    checkpoint: "v1-5-pruned-emaonly.safetensors",
    seed: 7,
    artifactSha256: "0".repeat(64),
  },
};

test("accepts, reviews, and restores a private prompt-first project", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Generate a character concept" }),
  ).toBeVisible();
  await expect(page.locator("#generation-status")).toContainText(
    "No checkpoint is allowlisted",
  );
  await page
    .getByLabel("Character description")
    .fill("blue-haired woman with a navy jacket");
  await page.getByText("Review interpreted generation request").click();
  await expect(page.locator("#concept-prompt-plan")).toContainText(
    "blue-haired woman with a navy jacket",
  );
  await expect(page.locator("#concept-prompt-plan")).toContainText(
    "complete head",
  );

  await page
    .locator("#prompt-workspace")
    .evaluate(
      (element, detail) =>
        element.dispatchEvent(
          new CustomEvent("avatarconceptaccepted", { detail }),
        ),
      acceptedConcept,
    );
  await expect(page.locator("#project-review")).toBeVisible();
  await page.getByLabel("Character name").fill("Aoi");
  await page.getByLabel("Visual style").fill("clean anime line art");
  await page.getByLabel("Palette").fill("navy and muted blue");
  await page.getByLabel("Outfit rules").fill("navy librarian jacket");
  await page
    .getByLabel("Identity-locked features")
    .fill("round glasses, blue hair, oval face");

  for (const name of ["leftEye", "rightEye", "nose", "mouth", "chin", "neck"]) {
    await page.locator(`[data-landmark="${name}"][data-axis="x"]`).fill("0.5");
    await page.locator(`[data-landmark="${name}"][data-axis="y"]`).fill("0.5");
  }
  await expect(page.locator("#project-review-status")).toHaveText(
    "Character bible complete. Ready for project review.",
  );
  await page.locator('[data-part-id="accessory"]').check();

  await page.reload();
  await expect(page.locator("#project-review")).toBeVisible();
  await expect(page.getByLabel("Character name")).toHaveValue("Aoi");
  await expect(page.locator('[data-part-id="accessory"]')).toBeChecked();
  await expect(page.locator("#landmark-status")).toHaveText(
    "6/6 landmarks marked.",
  );
});
