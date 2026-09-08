# CubeKorean 快速接手指引

## 1. 一分钟概览

CubeKorean 是面向具备少量基础学习者的韩语生活词汇拼写网站。当前已实现“日常饮食、日常出行”共20关×20词、顺序解锁、本机进度和错词本专项复习。核心价值是看词拼写、听音拼写和IME友好的即时纠错。当前版本不依赖后端。

## 2. 第一次运行与验证

```text
Node.js >=22.13.0 → npm install → npm run dev
→ 打开 http://localhost:3000/ → 点击“开始本关”
```

最小构建验证为 `npm run build`，完整当前测试为 `npm test`。测试覆盖真实首页、两套10×20课程、音节拆解、IME前缀、学习会话、错词复习、顺序解锁及本机持久化。

## 3. 真实入口

| 入口 | 路径 | 职责 |
|---|---|---|
| 页面入口 | `app/page.tsx` | 当前关卡页、练习状态与TTS调用 |
| 拼写规则 | `app/features/spelling/hangul.ts` | 音节拆解、IME前缀和最终答案判断 |
| 页面键盘 | `app/features/spelling/compose-hangul.ts` | 将字母按韩语输入规则组合为音节 |
| 学习会话 | `app/features/lessons/session.ts` | 看词、听写、错词重练与结果阶段切换 |
| 本机进度 | `app/features/progress/local-progress.ts` | 读取、校验和更新完成记录、掌握度及复习日期 |
| 发音适配 | `app/features/speech/korean-speech.ts` | 韩语TTS调用和无语音环境降级 |
| 课程数据 | `app/data/lessons/` | 两个大关卡、跨课程词汇索引及结构校验 |
| 页面样式 | `app/globals.css` | 地图、练习页和响应式布局 |
| 根布局 | `app/layout.tsx` | 页面语言、字体和元数据 |
| Worker入口 | `worker/index.ts` | 将请求交给Vinext App Router，并处理图片优化 |
| 部署构建 | `vite.config.ts` | 组合Vinext、Sites和Cloudflare插件 |

## 4. 当前核心链路

```text
app/page.tsx Home
  ↓ 点击“开始本关”设置 started
当前小关卡选择20个词
  ↓
看词 copy / 听音 listen 两轮状态
  ↓
features/spelling/hangul.ts 判断IME输入
  ↓
features/lessons/session.ts 推进阶段并记录错词
  ↓
features/progress/local-progress.ts 保存结果并解锁下一关
  ↓
speak 调用 SpeechSynthesisUtterance(ko-KR)
```

UI编排仍集中在一个组件中；拼写规则、学习会话及课程数据已经拆出。后续目标见 `ARCHITECTURE.md`。

## 5. 常见修改导航

| 修改目标 | 首先阅读 | 相关验证 | 文档影响 |
|---|---|---|---|
| 拼写规则 | `app/features/spelling/hangul.ts` | `tests/hangul-spelling.test.mjs` | `DEBUG.md`、必要时 `DECISIONS.md` |
| 课程词汇 | `app/data/lessons/` | `tests/course-validation.test.mjs` | `PRD.md`、`MVP.md` |
| 练习流程 | `Home`、`submit`、`nextWord` | 两轮、错词、结束状态 | `ARCHITECTURE.md` |
| 样式与移动端 | `app/globals.css` | 手机与桌面人工回归 | 必要时 `CHANGELOG.md` |
| 部署 | `.openai/hosting.json`、`vite.config.ts` | `npm run build` | `DEVELOPMENT.md` |

## 6. 数据与配置

当前课程数据位于 `app/data/lessons/`，没有业务环境变量、数据库、缓存或外部API。`.openai/hosting.json` 仅记录Sites项目及空D1/R2绑定。浏览器TTS不可用时必须安全返回，不能阻断练习。

## 7. 安全修改流程

```text
确认需求 → 搜索现有实现 → 补充失败用例 → 最小修改
→ 运行相关测试与构建 → 检查文档影响 → Review Diff
```

不要先重构再实现，不批量清理未触及技术债，不把MVP计划描述为已交付。

## 8. 高风险区域

| 路径 | 风险 | 修改前保护 |
|---|---|---|
| `app/page.tsx` | 学习状态、UI与TTS仍耦合，局部变量错误可能导致关卡崩溃 | 补交互测试并保持小步拆分 |
| `app/features/spelling/hangul.ts` | 复合元音、双收音和IME中间态复杂 | 扩展表格化用例后再修改 |
| 浏览器TTS | 跨设备声音和可用性不一致 | 设计无TTS回退 |

## 9. 当前开发入口

- 当前范围：`MVP.md`
- 当前任务：`TODO.md`
- 架构目标：`ARCHITECTURE.md`
- 已知问题：`DEBUG.md`
- 关键取舍：`DECISIONS.md`
- 推荐下一任务：根据真实学习反馈校订400词内容与错词移除阈值。
