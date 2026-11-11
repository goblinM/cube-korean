import { expect, test } from "@playwright/test";
import { decomposeHangulToKeystrokes } from "../../app/features/spelling/hangul";

test("按键提示、纠错、换轮与本机词数偏好", async ({ page }, testInfo) => {
  await page.goto("/zh");
  await page.getByRole("button", { name: "键盘练习" }).click();
  await page.getByRole("button", { name: "自定义" }).click();
  const size = page.getByRole("spinbutton");
  await size.fill("0");
  const start = page.getByRole("button", { name: "开始打字" });
  await expect(start).toBeDisabled();
  await size.fill("2");
  await start.click();
  const field = page.getByRole("textbox", { name: "输入目标词" });
  await expect(field).toHaveAttribute("inputmode", "none");
  const previous = new Set<string>();
  for (let done = 0; done < 2; done++) {
    await expect(page.getByText("已完成 " + done + "/2")).toBeVisible();
    const target = await page.locator("h1").innerText();
    expect(previous.has(target)).toBe(false);
    previous.add(target);
    const keys = decomposeHangulToKeystrokes(target);
    if (done === 0) {
      const wrong = keys[0] === "ㄱ" ? "ㅍ" : "ㄱ";
      await page.getByRole("button", { name: wrong, exact: true }).click();
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await page.locator(".delete").click();
      await page.getByRole("button", { name: "下一键提示" }).click();
      await expect(page.locator("[data-next]")).toHaveCount(0);
      await page.getByRole("button", { name: "下一键提示" }).click();
    }
    for (const key of keys) {
      const button = page.getByRole("button", { name: key, exact: true });
      await expect(button).toHaveAttribute("data-next", "true");
      if (testInfo.project.name === "desktop-chrome") {
        await field.focus();
        await page.keyboard.press((await button.locator("small").innerText()).toLowerCase());
      } else await button.click();
    }
  }
  await expect(page.getByText("本轮 2 词 · 累计照打 2 词")).toBeVisible();
  await page.getByRole("button", { name: "下一轮 · 2 词" }).click();
  await expect(page.getByText("键盘练习 · 第 2 轮")).toBeVisible();
  expect(previous.has(await page.locator("h1").innerText())).toBe(false);
  await page.getByRole("button", { name: "退出练习" }).click();
  await page.reload();
  await expect(size).toHaveValue("2");
  await page.getByRole("button", { name: "课程练习" }).click();
  await expect(page.getByRole("button", { name: "开始本关" })).toBeVisible();
});

test("韩语 IME 仅在组合结束后计一次", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Typing practice" }).click();
  await page.getByRole("button", { name: "Start typing" }).click();
  await page.getByRole("button", { name: "Use system Korean keyboard" }).click();
  const field = page.getByRole("textbox");
  const target = await page.locator("h1").innerText();
  await field.dispatchEvent("compositionstart");
  await field.fill(target);
  await expect(page.getByText("0/30 complete")).toBeVisible();
  await field.dispatchEvent("compositionend", { data: target });
  await expect(page.getByText("1/30 complete")).toBeVisible();
  await expect(field).toHaveValue("");
});

test("模式切换位置稳定，释义和键盘在手机首屏可见", async ({ page }, testInfo) => {
  const sizes = testInfo.project.name === "mobile-chrome"
    ? [{ width: 393, height: 852 }, { width: 414, height: 896 }, { width: 360, height: 780 }]
    : [{ width: 1440, height: 900 }];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto("/zh");
    const toggle = page.getByRole("button", { name: "键盘练习", exact: true });
    await expect(toggle).toBeEnabled();
    await page.getByRole("button", { name: "课程练习", exact: true }).click();
    const before = await toggle.boundingBox();
    await toggle.click();
    const after = await toggle.boundingBox();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
    expect(Math.abs(before!.x - after!.x)).toBeLessThan(1);
    const start = page.getByRole("button", { name: "开始打字" });
    expect((await start.boundingBox())!.y + (await start.boundingBox())!.height).toBeLessThan(size.height);
    await page.getByRole("button", { name: "自定义" }).click();
    expect((await toggle.boundingBox())!.y).toBeCloseTo(after!.y);
    await page.screenshot({ path: testInfo.outputPath("setup-" + size.width + ".png") });
    await start.click();
    await expect(page.locator(".emoji-card")).toBeVisible();
    await expect(page.locator(".translation strong")).not.toBeEmpty();
    await expect(page.locator(".translation span")).not.toBeEmpty();
    const keyboard = await page.locator(".keyboard").boundingBox();
    expect(keyboard!.y + keyboard!.height).toBeLessThanOrEqual(size.height);
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(size.width);
    await page.screenshot({ path: testInfo.outputPath("practice-" + size.width + ".png") });
  }
});
