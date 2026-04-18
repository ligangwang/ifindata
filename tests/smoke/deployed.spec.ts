import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/api/health`);
  expect(response.ok()).toBeTruthy();

  const health = await response.json();
  expect(health.status).toBe("ok");
  expect(health.service).toBe("ifindata-web");
});

test("homepage renders predictions feed", async ({ page }) => {
  await page.goto("/");

  // Verify navigation is present
  await expect(page.getByRole("link", { name: "Feed", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Predict/i })).toBeVisible();
  
  // Verify simplified predictions feed is on the page
  await expect(page.getByRole("button", { name: "All", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Live", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Final", exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /prediction for/i }).or(page.getByText("No predictions yet.")).first(),
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
