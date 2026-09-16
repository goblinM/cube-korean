# CubeKorean 上线与试用跟进

本文记录 `develop → release` 发布链路、Cloudflare 环境配置和试用阶段的后续工作。代码与自动化完成不等于生产发布；所有外部控制台项目必须按本清单核验。

## 环境对应

| 环境 | Git 分支 | Worker | 域名 | 索引策略 |
|---|---|---|---|---|
| 测试 | `develop` | `cube-korean-dev` | `https://korean.amolabs.top` | `noindex` |
| 正式 | `release` | `cube-korean` | `https://cubekorean.top` | 允许索引 |

两个 Cloudflare Workers Builds 项目都使用：

```text
Build command: npm run build
Deploy command: npx wrangler deploy --config dist/server/wrangler.json
Root directory: /
```

测试项目设置 `CUBE_WORKER_NAME=cube-korean-dev`、`NEXT_PUBLIC_ALLOW_INDEXING=false`；正式项目设置 `CUBE_WORKER_NAME=cube-korean`、`NEXT_PUBLIC_ALLOW_INDEXING=true`。不要让 `main`、其他功能分支或测试 Worker 更新正式域名。

## GitHub 合并保护

`.github/workflows/ci.yml` 会在 `develop`、`release` 的推送与 PR 上执行：

- ESLint；
- 单元、课程和流程测试；
- Vinext/Cloudflare 生产构建；
- Chrome 桌面与 390×844 移动端 Playwright 回归。

在 GitHub Rulesets 或 Branch protection 中保护 `release`：只允许 PR 合并，要求 `Lint, test and build` 与 `Browser regression` 两项检查通过，并禁止直接推送。日常功能先进入 `develop`，测试域验收后再创建 `develop → release` PR。

## 一次发布的顺序

1. 在本地运行 `npm run test:all`。
2. 提交并推送 `develop`，等待 GitHub CI 全部通过。
3. 在 Cloudflare 确认 `cube-korean-dev` 已部署该提交。
4. 在 `korean.amolabs.top` 验证首页、移动端首屏、页面键盘、系统韩语 IME、发音、刷新恢复、错词复习和数据备份。
5. 验证测试站响应包含 `X-Robots-Tag: noindex`，`robots.txt` 禁止抓取。
6. 创建 `develop → release` PR，等待 CI 再次通过后合并。
7. 在 Cloudflare 确认 `cube-korean` 已部署 release 的准确提交。
8. 在 `cubekorean.top` 验证 HTTPS、安全响应头、`robots.txt`、`sitemap.xml`、分享元数据、音频和核心学习链路。
9. 如发布异常，在 Cloudflare Deployments 回滚到上一个正常版本，然后在 `develop` 修复并重新走完整流程。

## 已实现的上线保护

- 页面级错误恢复入口；
- 浏览器拒绝 `localStorage` 时退回当前标签页内存，并明确提示刷新后可能丢失进度；
- 正式 canonical、Open Graph、Twitter Card、Web App Manifest、robots 和 sitemap；
- 测试域由 Worker 按实际主机名返回禁止抓取的 `robots.txt` 与 `X-Robots-Tag`，不依赖易配错的构建变量；
- HSTS、frame 限制、MIME 嗅探保护、Referrer Policy、Permissions Policy；
- 韩语音频浏览器缓存一周，Cloudflare CDN 继续提供边缘缓存；
- Worker 已支持 `www.cubekorean.top → cubekorean.top` 的 308 跳转，仍需在 Cloudflare 添加 `www` DNS/路由后才会生效。

## 上线前人工验收

- [ ] iPhone Safari：首次进入不自动弹系统键盘，页面键盘可完成一组练习；
- [ ] Android Chrome：页面键盘、系统键盘切换和首屏布局正常；
- [ ] Mac Safari 与 Chrome：自动发音、手动发音、连续切词都能听见；
- [ ] 支付宝和微信分别扫描对应二维码，确认收款方和支付页面；
- [ ] 禁止浏览器站点存储后，练习继续运行并显示数据无法保存提示；
- [ ] 下载学习备份，在另一个浏览器配置文件中恢复；
- [ ] Cloudflare 正式部署可一键回滚到前一个版本。

## 试用期后续开发

- [ ] 为词义、拼写和发音增加带词条 ID 的反馈入口；
- [ ] 按反馈频率安排韩语母语者审校，先处理高频主题与被报告词条；
- [ ] 开启 Cloudflare Web Analytics 与 Worker 错误日志，并补充隐私说明；
- [ ] 为测试站增加持续可见的环境标识；
- [ ] 生成兼容更多社交平台的 PNG 分享图和 Apple Touch Icon；
- [ ] 观察音频失败率、首屏加载时间、练习完成率和刷新恢复失败情况；
- [ ] 每次课程或音频内容更新后复查缓存版本策略，避免同 URL 长时间保留旧声音。
