import { expect, test } from "@playwright/test";

test("renders the Builder without the retired Phase P2 controls", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Prompt, review, then build your 2D avatar.",
    }),
  ).toBeVisible();
  await expect(page.locator("#automatic-progress li")).toHaveCount(4);
  await expect(page.locator("#layer-lab")).toBeHidden();
  await expect(page.locator("#project-review")).toHaveCount(0);
});

test("keeps the prompt workspace usable when ComfyUI is not configured", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#generation-status")).toContainText(
    "No checkpoint is allowlisted",
  );
  await page.locator("#character-prompt").fill("blue-haired librarian");
  await expect(page.locator("#concept-prompt-plan")).toContainText(
    "blue-haired librarian",
  );
  await expect(page.locator("#generate-concept")).toBeDisabled();
});

test("Motion Lab fails safely without a validated project", async ({
  page,
}) => {
  await page.goto("/motion.html");
  await expect(page.getByRole("heading", { name: "Motion Lab" })).toBeVisible();
  await expect(page.locator("#motion-status")).toHaveText(
    "No validated project found. Return to Builder, create the parts, then validate it.",
  );
  await expect(page.locator("#motion-canvas")).toBeVisible();
  await page.getByRole("link", { name: "Return to Builder" }).click();
  await expect(page).toHaveURL(/\/$/u);
});
