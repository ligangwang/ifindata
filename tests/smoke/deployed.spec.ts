import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/api/health`);
  expect(response.ok()).toBeTruthy();

  const health = await response.json();
  expect(health.status).toBe("ok");
  expect(health.service).toBe("ifindata-web");
});

test("homepage exposes the graph exploration experience", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /TSMC Customer Ecosystem/i })).toBeVisible();
  await expect(page.getByLabel(/Search company/i)).toBeVisible();
  await expect(page.getByText(/1-hop graph/i)).toBeVisible();
  await expect(page.getByText(/Selected Company/i)).toBeVisible();
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