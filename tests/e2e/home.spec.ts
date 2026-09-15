import { expect, test } from "@playwright/test";

test("首页展示今日学习词数，齿轮入口打开学习数据与设置", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    localStorage.setItem("cubekorean.activity.v1", JSON.stringify({
      version: 1,
      days: { [key]: { sessions: 2, words: 25, accuracyTotal: 180 } },
    }));
  });
  await page.goto("/");

  const todayWords = page.getByLabel("今日学习 25 词");
  await expect(todayWords).toContainText("今日学习25词");
  if (testInfo.project.name === "desktop-chrome") await expect(todayWords).toBeVisible();
  else await expect(todayWords).toBeHidden();
  await expect(page.locator(".daily-status")).not.toContainText("/1轮");

  const settings = page.getByRole("button", { name: "打开学习数据与设置" });
  await expect(settings).toBeVisible();
  await expect(settings.locator("svg")).toHaveCount(1);
  await settings.click();
  await expect(page.getByRole("heading", { name: "学习数据" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "每日目标" })).toBeVisible();
});

test("三种常见手机尺寸首屏完整显示开始本关", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "只验证移动端布局");
  for (const viewport of [
    { width: 393, height: 852 },
    { width: 414, height: 896 },
    { width: 360, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const button = page.getByRole("button", { name: "开始本关" });
    await expect(button).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
      buttonBottom: document.querySelector(".primary")?.getBoundingClientRect().bottom ?? Infinity,
    }));
    expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.buttonBottom).toBeLessThanOrEqual(layout.viewportHeight);
  }
});
