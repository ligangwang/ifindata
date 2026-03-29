import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/api/health`);
  expect(response.ok()).toBeTruthy();

  const health = await response.json();
  expect(health.status).toBe("ok");
  expect(health.service).toBe("ifindata-web");
});

test("homepage exposes the loved-company MVP flow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /See the market as a graph of business models, sectors, and company relationships/i,
    }),
  ).toBeVisible();

  const loveButton = page.getByRole("button", { name: /Love Microsoft/i });
  await expect(loveButton).toBeVisible();
  await loveButton.click();

  await expect(page.getByTestId("auth-prompt")).toBeVisible();
  await expect(
    page.getByText("Sign in to save loved companies", { exact: true }),
  ).toBeVisible();
});

test("staging banner is present only when expected", async ({ page }) => {
  await page.goto("/");

  const expectBanner = process.env.PLAYWRIGHT_EXPECT_STAGING_BANNER === "1";
  const banner = page.getByTestId("staging-banner");

  if (expectBanner) {
    await expect(banner).toBeVisible();
  } else {
    await expect(banner).toHaveCount(0);
  }
});