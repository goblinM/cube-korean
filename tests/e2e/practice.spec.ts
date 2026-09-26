import { expect, test, type Page } from "@playwright/test";
import { dailyFoodChapter } from "../../app/data/lessons/daily-food";

const lessonWordIds = [
  "coffee", "water", "milk", "juice", "tea",
  "green-tea", "black-tea", "cola", "soda", "beer",
  "wine", "soju", "latte", "americano", "espresso",
  "hot-chocolate", "ice", "cup", "straw", "bottle",
];

type SeedOptions = {
  phase?: "copy" | "listen" | "retry";
  startPhase?: "copy" | "listen";
  groupIndex?: number;
  position?: number;
  firstListenCorrect?: number;
  completedFirstListenCorrect?: number;
  nativeKeyboard?: boolean;
  muted?: boolean;
  autoConfirm?: boolean;
  lessonId?: string;
};

async function seedPractice(page: Page, options: SeedOptions = {}) {
  const groupIndex = options.groupIndex ?? 0;
  const wordIds = options.lessonId
    ? dailyFoodChapter.lessons.find((lesson) => lesson.id === options.lessonId)?.words.map((word) => word.id) ?? lessonWordIds
    : lessonWordIds;
  const queue = wordIds.slice(groupIndex * 5, groupIndex * 5 + 5);
  await page.addInitScript(({ checkpoint, preferences }) => {
    if (sessionStorage.getItem("cubekorean.e2e-seeded") === "true") return;
    localStorage.clear();
    localStorage.setItem("cubekorean.practice-guide.v1", "seen");
    localStorage.setItem("cubekorean.preferences.v1", JSON.stringify(preferences));
    localStorage.setItem("cubekorean.checkpoint.v1", JSON.stringify(checkpoint));
    sessionStorage.setItem("cubekorean.e2e-seeded", "true");
  }, {
    preferences: { version: 1, showEnglish: true, nativeKeyboard: options.nativeKeyboard ?? false, muted: options.muted ?? true, autoConfirm: options.autoConfirm ?? false },
    checkpoint: {
      version: 1,
      practiceMode: "lesson",
      selectedChapterId: "daily-food",
      selectedLessonId: options.lessonId ?? "cafe-drinks",
      reviewWordIds: [],
      session: {
        phase: options.phase ?? "copy",
        startPhase: options.startPhase,
        queue,
        position: options.position ?? 0,
        originalWordIds: queue,
        mistakeIds: [],
        firstListenCorrect: options.firstListenCorrect ?? 0,
        currentHadError: false,
        currentErrorCount: 0,
        allWordIds: wordIds,
        groupIndex,
        groupSize: 5,
        completedFirstListenCorrect: options.completedFirstListenCorrect ?? 0,
        completedMistakeIds: [],
      },
    },
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "退出练习" })).toBeVisible();
}

test("首次访问按屏幕默认输入方式且不会自动唤起手机系统键盘", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始本关" }).click();

  const isMobile = testInfo.project.name === "mobile-chrome";
  const input = page.getByLabel("输入韩语拼写");
  if (isMobile) {
    await expect(page.getByRole("button", { name: "使用系统韩语键盘" })).toBeVisible();
    await expect(input).toHaveAttribute("readonly", "");
    await expect(page.locator(".keyboard")).toBeVisible();
    await expect(input).not.toBeFocused();
  } else {
    await expect(page.getByRole("button", { name: "显示页面键盘" })).toBeVisible();
    await expect(input).not.toHaveAttribute("readonly", "");
  }
});

test("释义下拉可切换韩中英、韩中、韩英，并在刷新后保留", async ({ page }) => {
  await seedPractice(page);
  const mode = page.getByRole("combobox", { name: "释义显示模式" });
  const translation = page.locator(".translation");
  await expect(mode).toHaveValue("ko-zh-en");
  await expect(translation.getByText("咖啡")).toBeVisible();
  await expect(translation.getByText("coffee")).toBeVisible();

  await mode.selectOption("ko-zh");
  await expect(translation.getByText("咖啡")).toBeVisible();
  await expect(translation.getByText("coffee")).toHaveCount(0);

  await mode.selectOption("ko-en");
  await expect(translation.getByText("咖啡")).toHaveCount(0);
  await expect(translation.getByText("coffee")).toBeVisible();
  await page.reload();
  await expect(mode).toHaveValue("ko-en");
  await expect(page.locator(".translation").getByText("coffee")).toBeVisible();
});

test("页面韩语键盘提供独立按键音开关并保存选择", async ({ page }) => {
  await seedPractice(page);
  const keySound = page.getByRole("button", { name: /按键音/ });
  await expect(keySound).toHaveAttribute("aria-pressed", "true");
  await keySound.click();
  await expect(keySound).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "ㅋ", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /按键音/ })).toHaveAttribute("aria-pressed", "false");
});

test("今日词数在首次拼写时计入，未完成整关退出后仍保留且同词不重复", async ({ page }) => {
  await seedPractice(page);
  await page.getByRole("button", { name: "ㅋ", exact: true }).click();
  await page.getByRole("button", { name: "退出练习" }).click();
  await expect(page.getByLabel("今日学习 1 词")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("button", { name: "退出练习" })).toBeVisible();
  await page.getByRole("button", { name: "退出练习" }).click();
  await expect(page.getByLabel("今日学习 1 词")).toHaveCount(1);
  await page.getByRole("button", { name: "开始本关" }).click();
  await page.getByRole("button", { name: "ㅋ", exact: true }).click();
  await page.getByRole("button", { name: "退出练习" }).click();
  await expect(page.getByLabel("今日学习 1 词")).toHaveCount(1);
});

test("听写答错未完成整关也计入今日词数并进入错词本", async ({ page }) => {
  await seedPractice(page, { phase: "listen" });
  await page.getByRole("button", { name: "ㄴ", exact: true }).click();
  await page.getByRole("button", { name: /检查答案/ }).click();
  await page.getByRole("button", { name: "退出练习" }).click();
  await expect(page.getByLabel("今日学习 1 词")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "错词本 1" })).toBeVisible();
});

test("练习页可切换直接听写并恢复，退出后仍能续练或改回默认模式", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("group", { name: "选择练习方式" })).toHaveCount(0);
  await page.getByRole("button", { name: "开始本关" }).click();
  await page.getByRole("button", { name: "调整练习" }).click();
  await page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "直接听写" }).click();
  await expect(page.getByText("前面已完成的组和整关进度会保留", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "应用选择" }).click();
  await expect(page.locator(".mode-pill")).toContainText("听音拼写");
  await expect(page.locator(".word-display")).not.toContainText("커피");
  await page.reload();
  await expect(page.locator(".mode-pill")).toContainText("听音拼写");
  await page.getByRole("button", { name: "退出练习" }).click();
  await page.getByRole("button", { name: "开始本关" }).click();
  await expect(page.locator(".mode-pill")).toContainText("听音拼写");
  await page.getByRole("button", { name: "调整练习" }).click();
  await page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "看词＋听写" }).click();
  await page.getByRole("button", { name: "应用选择" }).click();
  await expect(page.locator(".mode-pill")).toContainText("看词拼写");
});

test("已通关关卡可只重练指定五词组，不重写整关成绩", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cubekorean.progress.v1", JSON.stringify({ version: 1, lessons: {
      "cafe-drinks": { attempts: 1, bestAccuracy: 100, lastAccuracy: 100, mistakeIds: [], completedAt: new Date().toISOString() },
    }, mistakes: {} }));
  });
  await page.goto("/");
  await expect(page.getByRole("group", { name: "选择重练分组" })).toHaveCount(0);
  await page.getByRole("button", { name: "再次练习" }).click();
  await page.getByRole("button", { name: "调整练习" }).click();
  await page.getByRole("group", { name: "选择重练分组" }).getByRole("button", { name: "第3组 · 5词" }).click();
  await page.getByRole("button", { name: "应用选择" }).click();
  await expect(page.getByRole("progressbar", { name: "本轮学习进度" })).toHaveAttribute("aria-valuemax", "5");
  await expect(page.locator(".counter")).toContainText("第 3/4 组");
  await page.reload();
  await expect(page.locator(".counter")).toContainText("第 3/4 组");
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.progress.v1") ?? "{}"));
  expect(progress.lessons["cafe-drinks"].attempts).toBe(1);
});

test("练习设置取消或按 Escape 不改变当前答题位置", async ({ page }) => {
  await seedPractice(page, { position: 2 });
  await page.getByRole("button", { name: "调整练习" }).click();
  const dialogBox = await page.getByRole("dialog", { name: "调整本关练习" }).boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox && viewport && dialogBox.x >= 0 && dialogBox.y >= 0
    && dialogBox.x + dialogBox.width <= viewport.width + 1
    && dialogBox.y + dialogBox.height <= viewport.height + 1).toBeTruthy();
  await expect(page.getByRole("group", { name: "选择重练分组" })).toHaveCount(0);
  await page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "直接听写" }).click();
  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.locator(".counter")).toContainText("3 / 5");
  await expect(page.locator(".mode-pill")).toContainText("看词拼写");
  await page.getByRole("button", { name: "调整练习" }).click();
  await expect(page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "看词＋听写" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "调整本关练习" })).toHaveCount(0);
  await expect(page.locator(".counter")).toContainText("3 / 5");
});

test("第一组直接听写完成后第二组改看词仍留在第二组", async ({ page }) => {
  await seedPractice(page, { phase: "listen", startPhase: "listen", groupIndex: 1, position: 2, completedFirstListenCorrect: 5 });
  await page.getByRole("button", { name: "调整练习" }).click();
  await page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "看词＋听写" }).click();
  await expect(page.getByText("当前第 2 组的第 1 个词重新开始", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "应用选择" }).click();
  await expect(page.locator(".mode-pill")).toContainText("看词拼写");
  await expect(page.locator(".counter")).toContainText("第 2/4 组 · 1 / 5");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.checkpoint.v1") ?? "{}").session.completedFirstListenCorrect)).toBe(5);
  await page.reload();
  await expect(page.locator(".counter")).toContainText("第 2/4 组 · 1 / 5");
});

test("调整练习时系统键盘输入框保持失焦", async ({ page }) => {
  await seedPractice(page, { nativeKeyboard: true });
  await page.getByRole("button", { name: "调整练习" }).click();
  await expect(page.getByRole("button", { name: "关闭练习设置" }).last()).toBeFocused();
  await page.getByRole("group", { name: "选择练习方式" }).getByRole("button", { name: "直接听写" }).click();
  await expect(page.getByRole("textbox", { name: "输入韩语拼写" })).not.toBeFocused();
});

test("指定组结算只显示五词且不触发整关 Coffee Tip", async ({ page }) => {
  await page.addInitScript(() => {
    const wordIds = ["coffee", "water", "milk", "juice", "tea", "green-tea", "black-tea", "cola", "soda", "beer", "wine", "soju", "latte", "americano", "espresso", "hot-chocolate", "ice", "cup", "straw", "bottle"];
    const completedAt = new Date().toISOString();
    const lessons = Object.fromEntries(["cafe-drinks", "breakfast", "meals"].map((id) => [id, {
      attempts: 1, bestAccuracy: 100, lastAccuracy: 100, mistakeIds: [], completedAt,
    }]));
    localStorage.setItem("cubekorean.progress.v1", JSON.stringify({ version: 1, lessons, mistakes: {} }));
    localStorage.setItem("cubekorean.checkpoint.v1", JSON.stringify({
      version: 1, practiceMode: "lesson", selectedChapterId: "daily-food", selectedLessonId: "cafe-drinks", reviewWordIds: [],
      session: {
        phase: "results", startPhase: "listen", groupOnly: true, queue: wordIds.slice(10, 15), position: 0,
        originalWordIds: wordIds.slice(10, 15), mistakeIds: [], firstListenCorrect: 5,
        currentHadError: false, currentErrorCount: 0, allWordIds: wordIds, groupIndex: 2,
        groupSize: 5, completedFirstListenCorrect: 0, completedMistakeIds: [],
      },
    }));
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "第 3 组重练完成！" })).toBeVisible();
  await expect(page.locator(".result-stats")).toContainText("5");
  await expect(page.getByLabel("学习里程碑与自愿支持")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.progress.v1") ?? "{}").lessons["cafe-drinks"].attempts)).toBe(1);
});

test("页面键盘正确组合韩文，并在刷新后恢复到下一词", async ({ page }) => {
  await seedPractice(page);
  for (const key of ["ㅋ", "ㅓ", "ㅍ", "ㅣ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 커피");
  await expect(page.locator(".word-display .wrong")).toHaveCount(0);
  await page.getByRole("button", { name: /检查答案/ }).click();
  await expect(page.getByText("水", { exact: true })).toBeVisible({ timeout: 2_000 });
  await page.reload();
  await expect(page.getByText("水", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "本轮学习进度" })).toHaveAttribute("aria-valuenow", "2");
});

test("页面键盘拼写正确后自动确认并快速进入下一词", async ({ page }) => {
  await seedPractice(page, { autoConfirm: true });
  for (const key of ["ㅋ", "ㅓ", "ㅍ", "ㅣ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.getByText("정답이에요! 拼写正确", { exact: true })).toBeVisible();
  await expect(page.getByText("水", { exact: true })).toBeVisible({ timeout: 1_000 });
  await expect(page.getByRole("progressbar", { name: "本轮学习进度" })).toHaveAttribute("aria-valuenow", "2");
});

test("关闭拼对即过后保留手动检查", async ({ page }) => {
  await seedPractice(page, { autoConfirm: false });
  for (const key of ["ㅋ", "ㅓ", "ㅍ", "ㅣ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.getByText("咖啡", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /检查答案/ })).toBeEnabled();
});

test("系统韩语输入的组合中间态不会被提前标红", async ({ page }) => {
  await seedPractice(page, { nativeKeyboard: true });
  const input = page.getByRole("textbox", { name: "输入韩语拼写" });
  for (const value of ["ㅋ", "커", "커ㅍ", "커피"]) {
    await input.fill(value);
    await expect(page.locator(".word-display .wrong")).toHaveCount(0);
  }
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 커피");
  await input.press("Enter");
  await expect(page.getByText("水", { exact: true })).toBeVisible({ timeout: 1_000 });
});

test("系统键盘模式提供两套式实体键位对照且不替代系统输入", async ({ page }, testInfo) => {
  await seedPractice(page, { nativeKeyboard: true });
  const guide = page.getByRole("group", { name: "电脑韩语键位参考", includeHidden: true });
  await expect(guide.locator(".physical-key")).toHaveCount(26);
  await expect(guide.locator('.physical-key[aria-label="Q 对应 ㅂ；Shift 加 Q 对应 ㅃ"]')).toHaveCount(1);
  await expect(guide.locator('.physical-key[aria-label="E 对应 ㄷ；Shift 加 E 对应 ㄸ"]')).toHaveCount(1);
  await expect(guide.locator('.physical-key[aria-label="K 对应 ㅏ"]')).toHaveCount(1);
  if (testInfo.project.name === "desktop-chrome") {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(guide).toBeVisible();
    const checkButton = await page.getByRole("button", { name: /检查答案/ }).boundingBox();
    expect(checkButton && checkButton.y + checkButton.height).toBeLessThanOrEqual(800);
  } else await expect(guide).toBeHidden();

  const input = page.getByRole("textbox", { name: "输入韩语拼写" });
  await expect(input).not.toHaveAttribute("readonly");
  await input.fill("커피");
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 커피");
  await page.getByRole("button", { name: "显示页面键盘" }).click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ㅋ", exact: true })).toBeVisible();
});

test("달갸是달걀少收音的合法中间态", async ({ page }) => {
  await seedPractice(page, { lessonId: "breakfast", position: 2, autoConfirm: true });
  for (const key of ["ㄷ", "ㅏ", "ㄹ", "ㄱ", "ㅑ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 달갸");
  await expect(page.locator(".word-display .wrong, .feedback.error")).toHaveCount(0);
  await expect(page.getByText("鸡蛋", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ㄹ", exact: true }).click();
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 달걀");
  await expect(page.getByText("煎蛋", { exact: true })).toBeVisible({ timeout: 1_000 });

  await page.reload();
  await expect(page.getByText("煎蛋", { exact: true })).toBeVisible();
});

test("달가相对달걀的错误元音仍会标红", async ({ page }) => {
  await seedPractice(page, { lessonId: "breakfast", position: 2, autoConfirm: true });
  for (const key of ["ㄷ", "ㅏ", "ㄹ", "ㄱ", "ㅏ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 달가");
  await expect(page.locator(".word-display .wrong")).toHaveCount(1);
  await expect(page.locator(".feedback.error")).toBeVisible();
  await expect(page.getByText("鸡蛋", { exact: true })).toBeVisible();
});

test("双辅音可由页面键盘连续点击基础辅音组成", async ({ page }) => {
  await seedPractice(page, { groupIndex: 2, position: 2 });
  for (const key of ["ㄹ", "ㅏ", "ㄷ", "ㄷ", "ㅔ"]) await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.locator(".word-display")).toHaveAttribute("aria-label", "当前输入 라떼");
  await expect(page.locator(".word-display .wrong")).toHaveCount(0);
});

test("听写第一次错误不泄露答案，第二次才显示并立即进入错词本", async ({ page }) => {
  await seedPractice(page, { phase: "listen", nativeKeyboard: true });
  const input = page.getByRole("textbox", { name: "输入韩语拼写" });
  await input.fill("카피");
  await input.press("Enter");
  await expect(page.getByText(/1\/2/)).toBeVisible();
  await expect(page.getByText("提示答案 · 2/2", { exact: true })).toHaveCount(0);
  await input.press("Enter");
  await expect(page.getByText("提示答案 · 2/2", { exact: true })).toBeVisible();
  await expect(page.locator(".answer-reveal strong")).toHaveText("커피");
  const mistake = await page.evaluate(() => JSON.parse(localStorage.getItem("cubekorean.progress.v1") ?? "null")?.mistakes?.coffee);
  expect(mistake).toMatchObject({ lessonId: "cafe-drinks", errorCount: 1, correctReviews: 0 });
});

test("完成当前五词组后可进入第二组并持久化组位置", async ({ page }) => {
  await seedPractice(page, { phase: "listen", position: 4, firstListenCorrect: 4, nativeKeyboard: true });
  const input = page.getByRole("textbox", { name: "输入韩语拼写" });
  await input.fill("차");
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "第 1 组完成！" })).toBeVisible({ timeout: 2_000 });
  await page.getByRole("button", { name: /继续第 2 组/ }).click();
  await expect(page.getByText("绿茶", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("绿茶", { exact: true })).toBeVisible();
  await expect(page.getByText("第 2/4 组 ·", { exact: true })).toBeVisible();
});

test("页面键盘模式不会重新聚焦只读输入框", async ({ page }) => {
  await seedPractice(page);
  const input = page.getByRole("textbox", { name: "输入韩语拼写" });
  await expect(input).toHaveAttribute("readonly", "");
  await expect(input).toHaveAttribute("inputmode", "none");
  await page.getByRole("button", { name: "ㅋ", exact: true }).click();
  await expect(input).not.toBeFocused();
});
