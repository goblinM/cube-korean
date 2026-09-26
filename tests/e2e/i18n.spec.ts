import { expect, test } from "@playwright/test";

test.use({ locale: "ja-JP" });

test("fresh visits stay Chinese regardless of browser language", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
  await expect(page.getByRole("heading", { name: /听见生活/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("homepage language choice switches the whole interface and is remembered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "语言" }).selectOption("en");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await expect(page.getByRole("heading", { name: /Hear real Korean/ })).toBeVisible();
  await expect(page.getByText("Everyday Food", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Start level/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.preferences.v1") ?? "null")?.uiLocale)).toBe("en");

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.getByRole("heading", { name: /听见生活/ })).toBeVisible();
});

test("language switching preserves existing learning progress", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cubekorean.progress.v1", JSON.stringify({
      version: 1,
      lessons: {
        "cafe-drinks": { attempts: 1, bestAccuracy: 90, lastAccuracy: 90, mistakeIds: [], completedAt: "2026-09-25T00:00:00.000Z", mastery: "learning", reviewIntervalDays: 1, nextReviewAt: "2026-09-26T00:00:00.000Z" },
      },
      mistakes: {},
    }));
  });
  await page.goto("/");
  const before = await page.evaluate(() => localStorage.getItem("cubekorean.progress.v1"));
  await page.getByRole("combobox", { name: "语言" }).selectOption("en");
  const after = await page.evaluate(() => localStorage.getItem("cubekorean.progress.v1"));
  expect(after).toBe(before);
  await expect(page.getByRole("button", { name: /Practice again/ })).toBeVisible();
});

test("localized entry routes expose matching UI and install metadata", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await expect(page).toHaveTitle("CubeKorean · Korean spelling for everyday life");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest-en.webmanifest");
  const englishManifest = await page.request.get("/manifest-en.webmanifest");
  expect(englishManifest.ok()).toBeTruthy();
  await expect.poll(async () => (await englishManifest.json()).start_url).toBe("/en");

  await page.goto("/zh");
  await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
  await expect(page).toHaveTitle("CubeKorean · 韩语生活词汇听写");
});

test("English locale covers data, mistake book and active practice surfaces", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Open learning data and settings" }).click();
  await expect(page.getByRole("heading", { name: "Learning data" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backup and restore" })).toBeVisible();
  await page.getByRole("button", { name: "Back to course" }).click();

  await page.getByRole("button", { name: /Mistakes/ }).click();
  await expect(page.getByRole("heading", { name: "Mistake book" })).toBeVisible();
  await page.getByRole("button", { name: "Back to course" }).click();

  await page.getByRole("button", { name: /Start level/ }).click();
  await expect(page.locator(".mode-pill")).toContainText("Copy spelling");
  await expect(page.getByRole("button", { name: /Adjust practice/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Korean pronunciation" })).toBeVisible();
});
