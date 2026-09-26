import { expect, test } from "@playwright/test";

test("测试环境发布索引限制、SEO基础文件和安全响应头", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["x-robots-tag"]).toContain("noindex");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["x-frame-options"]).toBe("DENY");
  expect(home.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://cubekorean.top");

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).short_name).toBe("CubeKorean");
});

test("本机存储拒绝写入时继续展示课程并提示数据边界", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "开始本关" })).toBeVisible();
  await expect(page.getByText("当前无法保存学习进度")).toBeVisible();
  await page.getByRole("button", { name: "开始本关" }).click();
  await expect(page.getByLabel("输入韩语拼写")).toBeVisible();
});
