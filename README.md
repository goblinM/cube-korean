# CubeKorean

CubeKorean 是面向具备少量韩语基础学习者的生活词汇拼写网站。产品通过魔方关卡组织内容，以“看词拼写 → 听音拼写 → 错词重练”强化声音、含义与韩文拼写之间的联系。

- 项目类型：Web 前端应用
- 技术栈：React 19、TypeScript、Vinext、Vite、Cloudflare Workers/Sites、Web Speech API
- 创建日期：2026-09-03
- 当前状态：P1 功能已实现；“日常饮食”10关×20词、顺序解锁和本机进度已接入，等待跨设备人工回归

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
