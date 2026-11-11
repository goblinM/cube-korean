# CubeKorean

CubeKorean 是面向具备少量韩语基础学习者的生活词汇拼写网站。产品通过魔方关卡组织内容，以“看词拼写 → 听音拼写 → 错词重练”强化声音、含义与韩文拼写之间的联系。

- 项目类型：Web 前端应用
- 技术栈：React 19、TypeScript、Vinext、Vite、Cloudflare Workers、预生成韩语MP3
- 创建日期：2026-09-03
- 当前状态：十大生活主题课程已完成，共100关×20词、2000词，并已接入共享韩语音频、错词本和专项复习

首页的「键盘练习」提供跨主题韩语照打。每轮默认 30 词，可自定义 1–100 词。手机可直接点页面键盘，电脑可按图示 QWERTY 键位，也可切换韩语输入法。练习页显示课程图标与中英文释义，首页模式切换保持位置稳定，顶部工具、主题选择与关卡列表采用紧凑尺寸，两种模式的标题字号保持一致。下一键提示可关闭，完成一轮后可继续或结束。照打词数单独保存在本机。

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

开发服务正常时会显示 `http://localhost:3000/`。生产构建验证使用：

```bash
npm run build
```

## 项目导航

首次接手请依次阅读：

1. `AGENTS.md`
2. `docs/PROJECT_ONBOARDING.md`
3. `docs/PRD.md`
4. `docs/MVP.md`
5. `docs/ARCHITECTURE.md`

当前任务和已知测试缺口分别记录在 `docs/TODO.md` 与 `docs/DEBUG.md`。

上线试用、`develop → release` 发布流程、Cloudflare 双环境变量、GitHub 分支保护和人工验收事项见 [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md)。
