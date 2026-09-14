import { expect, test, type Page } from "@playwright/test";
import { dailyFoodChapter } from "../../app/data/lessons/daily-food";

async function seedFinishedLesson(page: Page, completedLessonIds: string[], lessonId: string, wordIds: string[]) {
  await page.addInitScript(({ completedLessonIds, lessonId, wordIds }) => {
    const completedAt = new Date().toISOString();
    const lessons = Object.fromEntries(completedLessonIds.map((id) => [id, {
      attempts: 1, bestAccuracy: 100, lastAccuracy: 100, mistakeIds: [], completedAt,
    }]));
    localStorage.setItem("cubekorean.progress.v1", JSON.stringify({ version: 1, lessons, mistakes: {} }));
    localStorage.setItem("cubekorean.checkpoint.v1", JSON.stringify({
      version: 1, practiceMode: "lesson", selectedChapterId: "daily-food", selectedLessonId: lessonId, reviewWordIds: [],
      session: {
        phase: "results", queue: wordIds.slice(15), position: 0, originalWordIds: wordIds.slice(15),
        mistakeIds: [], firstListenCorrect: 5, currentHadError: false, currentErrorCount: 0,
        allWordIds: wordIds, groupIndex: 3, groupSize: 5, completedFirstListenCorrect: 15, completedMistakeIds: [],
      },
    }));
  }, { completedLessonIds, lessonId, wordIds });
}

test("学习数据页可主动查看双收款码并关闭支持面板", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开学习数据与设置" }).click();
  const openSupport = page.getByRole("button", { name: "查看支持方式" });
  await openSupport.click();

  const dialog = page.getByRole("dialog", { name: "请 CubeKorean 喝杯咖啡" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("支付宝扫一扫")).toBeVisible();
  await expect(dialog.getByText("微信扫一扫")).toBeVisible();
  for (const method of ["支付宝", "微信"]) {
    const image = dialog.getByRole("img", { name: `${method}收款二维码` });
    await expect(image).toBeVisible();
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(openSupport).toBeFocused();
});

for (const milestone of [3, 10]) {
  test(`第${milestone}个不同小关卡结算时提示支持，且可永久关闭`, async ({ page }) => {
    const completedLessonIds = dailyFoodChapter.lessons.slice(0, milestone - 1).map((lesson) => lesson.id);
    const lastLesson = dailyFoodChapter.lessons[milestone - 1];
    const wordIds = lastLesson.words.map((word) => word.id);
    await seedFinishedLesson(page, completedLessonIds, lastLesson.id, wordIds);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "本关完成！" })).toBeVisible();
    const tip = page.getByLabel("学习里程碑与自愿支持");
    await expect(tip).toContainText(`已经完成 ${milestone} 关`);
    await tip.getByRole("button", { name: "查看支持方式" }).click();
    await expect(page.getByRole("dialog", { name: "请 CubeKorean 喝杯咖啡" })).toBeVisible();
    await page.getByRole("button", { name: "关闭，继续学习" }).click();
    await tip.getByRole("button", { name: "不再提示" }).click();
    await expect(tip).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.coffee-tip.v1") ?? "{}").dismissed)).toBe(true);
    await expect(page.locator(".results-card .primary")).toBeEnabled();
  });
}

test("第二关已有通关记录时，重练结算也不显示 Coffee Tip", async ({ page }) => {
  const completedLessonIds = dailyFoodChapter.lessons.slice(0, 2).map((lesson) => lesson.id);
  const lesson = dailyFoodChapter.lessons[1];
  await seedFinishedLesson(page, completedLessonIds, lesson.id, lesson.words.map((word) => word.id));
  await page.goto("/");
  await expect(page.getByLabel("学习里程碑与自愿支持")).toHaveCount(0);
  await expect(page.locator(".results-card .primary")).toBeEnabled();
});
