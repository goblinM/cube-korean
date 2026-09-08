# CubeKorean 架构

## 当前技术边界

- 类型：Web前端应用；
- 运行：React 19 + TypeScript + Vinext/Vite；
- 部署：Cloudflare Worker兼容输出，通过Sites发布；
- 发音：浏览器Web Speech API；
- 数据：十大生活主题共100关×20词位于 `app/data/lessons/`，由 `course.ts` 建立跨关卡索引；迁移词条保留稳定ID；
- 持久化：`app/features/progress/local-progress.ts` 通过版本化 `localStorage` 保存关卡进度、掌握度、复习时间与逐词错误记录；
- 后端和数据库：MVP不启用，`.openai/hosting.json` 中D1/R2均为空。

## 目标模块边界

```text
页面与关卡组件
  ↓
学习会话（轮次、题目、结果、错词）
  ↓
拼写领域规则（音节拆解、前缀判断、错误定位）
  ├── 课程数据（大关卡/小关卡/词汇）
  ├── 本机进度仓储（localStorage）
  └── 发音适配器（SpeechSynthesis）
```

当前已落地拼写判断、页面键盘音节组合、学习会话、课程校验、本机进度、语音适配器和10×10×20课程数据模块；页面组件负责将这些模块编排为交互流程。

## 建议目录

```text
app/
├── components/       # 魔方、练习卡、键盘、结果组件
├── data/lessons/     # 版本化课程数据
├── features/lessons/ # 关卡选择和解锁
├── features/spelling/# 韩语拆解与拼写判断纯函数
├── features/progress/# 学习状态与本机存储
├── features/speech/  # 韩语TTS能力检测与安全降级
├── page.tsx
└── globals.css
tests/                # 核心领域和流程测试
```

不创建通用模板中的 `src/`，避免与现有 `app/` 入口形成双重结构。

## 外部依赖和回退

| 依赖 | 用途 | 本地是否必须 | 不可用表现 |
|---|---|---|---|
| Web Speech API | 韩语TTS | 否 | 显示不可用提示，拼写功能继续工作 |
| localStorage | MVP进度 | 否 | 无法跨刷新保留进度，应显示可恢复提示 |
| Cloudflare Sites | 线上发布 | 否 | 不影响本地开发 |

## 架构原则

- MVP保持单体前端，不提前引入服务端；
- 拼写判断必须是可独立测试的纯函数；
- 课程内容与UI解耦；
- 复习间隔按学习中1天、熟悉3天、连续高正确率掌握7天计算；
- 只有多设备同步或内容运营需求成立后才评估数据库和后台。
