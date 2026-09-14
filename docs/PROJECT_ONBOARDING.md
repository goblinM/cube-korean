# CubeKorean 快速接手指引

## 1. 一分钟概览

CubeKorean 是面向具备少量基础学习者的韩语生活词汇拼写网站。当前已实现十大生活主题，共100关×20词、2000词，并提供顺序解锁、本机进度和错词本专项复习。核心价值是看词拼写、听音拼写和IME友好的即时纠错。当前版本不依赖后端。

## 2. 第一次运行与验证

```text
Node.js >=22.13.0 → npm install → npm run dev
→ 打开 http://localhost:3000/ → 点击“开始本关”
```

最小构建验证为 `npm run build`，函数及渲染测试为 `npm test`，Chrome桌面与390px移动端核心链路测试为 `npm run test:e2e`，完整验证为 `npm run test:all`。测试覆盖真实首页、十套10×20课程、音节拆解、IME前缀、学习会话、错词复习、顺序解锁、本机持久化、页面键盘、分组恢复及音频回退。

## 3. 真实入口

| 入口 | 路径 | 职责 |
|---|---|---|
| 页面入口 | `app/page.tsx` | 当前关卡页、练习状态与TTS调用 |
| 拼写规则 | `app/features/spelling/hangul.ts` | 音节拆解、IME前缀和最终答案判断 |
| 页面键盘 | `app/features/spelling/compose-hangul.ts` | 将字母按韩语输入规则组合为音节 |
| 学习会话 | `app/features/lessons/session.ts` | 看词、可选直接听写、指定五词组重练、错词重练与结果阶段切换 |
| 续学定位 | `app/features/lessons/recommendation.ts` | 切换主题时定位最近未完成关卡 |
| 本机进度 | `app/features/progress/local-progress.ts` | 读取、校验和更新完成记录、掌握度及复习日期 |
| 支持提示 | `app/features/progress/coffee-tip.ts` | 统计已完成的不同小关卡，在七个里程碑控制一次性提示、旧进度补发与本机退订 |
| 支持面板 | `app/components/coffee-support-dialog.tsx`、`public/support/` | 展示用户确认的支付宝与微信原始收款码；网站不处理支付状态 |
| 发音适配 | `app/features/speech/korean-speech.ts` | 预生成静态MP3播放、浏览器TTS备用和无语音环境降级 |
| 音频生成 | `tools/generate-korean-audio.mjs` | 发布前使用Azure Speech生成共享静态MP3和资源清单 |
| 课程数据 | `app/data/lessons/` | 十个大关卡、跨课程词汇索引及结构校验 |
| 页面样式 | `app/globals.css` | 地图、练习页和响应式布局 |
| 根布局 | `app/layout.tsx` | 页面语言、字体和元数据 |
| Worker入口 | `worker/index.ts` | 将请求交给Vinext App Router，并处理图片优化 |
| 部署构建 | `vite.config.ts` | 组合Vinext与Cloudflare插件 |

端到端测试通过 `CUBE_E2E=true` 关闭仅用于本地调试的Worker检查端口，产品服务端口和生产构建行为不变。

练习页的隐藏输入框承接系统韩语键盘输入；进入练习、切换单词或点击练习页其他区域后，页面会重新聚焦该输入框并保持当前滚动位置。页面键盘默认拼对即过，约350ms后切换下一词，可在练习页切换为手动确认；系统键盘仅在IME组合结束后的Enter提交。

## 4. 当前核心链路

```text
app/page.tsx Home
  ↓ 点击“开始本关”设置 started
当前小关卡选择20个词，并按5词拆为4组；地图直接进入练习，练习页“调整练习”可切换直接听写，已通关关卡可在此选任意一组重练
  ↓
默认每组依次完成看词 copy / 听音 listen / 错词 retry；直接听写跳过 copy。 “不会写？”提供规则说明和主动答案，听写求助计入错词；未求助时第一次答错提示 `1/2`，第二次答错提示 `2/2` 并显示答案
  ↓
features/spelling/hangul.ts 判断IME输入
  ↓
features/progress/learning-activity.ts 首次输入或主动查看答案就按本地日期记录该词；同日重复练习不重复加词数，整关结算只增加完成轮次
  ↓
features/lessons/session.ts 推进组内阶段，汇总四组正确率与错词；组间恢复点持续保存。仅切换练习方式时重开当前组，保留此前已完成组；改变重练范围时才从所选范围起点开始
  ↓
features/progress/local-progress.ts 首次听写错误即时收录，整关完成后保存结果并解锁下一关；指定组重练只结算该组，不覆盖整关成绩
  ↓ 已完成不同小关卡数达到3/10/25/39/55/74/100时，整关结算页可选显示Coffee Tip；第2关与指定组重练不触发，旧进度下次整关结算补发最近未见里程碑
  ↓
playKorean优先播放 `/audio/ko/{wordId}.mp3`，资源失败时回退SpeechSynthesisUtterance(ko-KR)
```

UI编排仍集中在一个组件中；拼写规则、学习会话及课程数据已经拆出。后续目标见 `ARCHITECTURE.md`。

## 5. 常见修改导航

| 修改目标 | 首先阅读 | 相关验证 | 文档影响 |
|---|---|---|---|
| 拼写规则 | `app/features/spelling/hangul.ts` | `tests/hangul-spelling.test.mjs` | `DEBUG.md`、必要时 `DECISIONS.md` |
| 课程词汇 | `app/data/lessons/` | `tests/course-validation.test.mjs` | `PRD.md`、`MVP.md` |
| 练习流程 | `Home`、`submit`、`nextWord` | 两轮、错词、结束状态 | `ARCHITECTURE.md` |
| 样式与移动端 | `app/globals.css` | 手机与桌面人工回归 | 必要时 `CHANGELOG.md` |
| 部署 | `package.json`、`vite.config.ts`、`docs/DEPLOYMENT.md` | `npm test`、Cloudflare构建状态 | `DEVELOPMENT.md`、`DEPLOYMENT.md` |

浏览器端改动还应执行 `npm run test:e2e`；测试使用本机Chrome分别覆盖桌面和390×844移动端，不写入真实学习数据。

## 6. 数据与配置

当前课程数据位于 `app/data/lessons/`，网站运行时没有业务环境变量、数据库、缓存或外部API。生产环境通过 GitHub `main` 自动部署到 Cloudflare Workers，具体配置见 `DEPLOYMENT.md`；GitHub仓库不保存 `.openai/hosting.json`，Cloudflare从仓库构建时也不依赖它。Azure只在发布前生成静态音频时通过被忽略的 `.audio.env` 使用；浏览器播放不可用时必须安全返回，不能阻断练习。

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
| 韩语音频 | 静态资源覆盖、浏览器自动播放策略和异常发音 | 校验音频清单、人工审音并保留非阻塞回退 |

## 9. 当前开发入口

- 当前范围：`MVP.md`
- 当前任务：`TODO.md`
- 架构目标：`ARCHITECTURE.md`
- 已知问题：`DEBUG.md`
- 关键取舍：`DECISIONS.md`
- 推荐下一任务：根据真实学习反馈逐章校订2000词内容与错词移除阈值。
- 测试用例：`TEST_CASES.md`
