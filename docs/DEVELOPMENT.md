# CubeKorean 开发指南

## 环境

- Node.js：`>=22.13.0`
- 包管理器：npm
- 网站运行不要求业务环境变量；只有发布前生成韩语MP3时需要临时提供 `AZURE_SPEECH_REGION` 和 `AZURE_SPEECH_KEY`

## 安装与运行

```bash
npm install
npm run dev
```

启动成功标志是终端输出本地地址，默认 `http://localhost:3000/`。

## 验证

```bash
npm run build
npm run lint
npm test
```

- `npm run build` 是当前已验证的最小构建检查；
- `npm run lint` 检查TypeScript、React和可访问性规则；
- `npm test` 会先构建，再运行 `tests/*.test.mjs`；当前测试覆盖页面渲染、三套课程结构、韩语拼写与音节组合、TTS降级、学习会话、错词复习、顺序解锁、掌握度和本机持久化。

## 韩语音频生成

先检查首关20词，不调用Azure：

```bash
npm run audio:pilot:dry
```

确认Azure Speech F0资源后，将 `.env.example` 复制为不会提交、也不会被Vite加载的 `.audio.env`，填写资源区域和密钥，再生成20词试音：

```bash
npm run audio:pilot
```

生成工具只读取环境变量，不在项目中保存密钥。20词人工审音通过前不要运行 `npm run audio:all`。详细验收和回滚方式见 `AUDIO_INTEGRATION_PLAN.md`。

## 调试顺序

```text
复现输入步骤 → 查看浏览器Runtime Error/Console
→ 定位 app/page.tsx 当前状态 → 检查IME组合过程
→ 运行相关测试 → npm run build → 记录到 DEBUG.md
```

## 发布

项目由GitHub仓库触发Cloudflare部署，构建不依赖 `.openai/hosting.json`。发布前应先完成构建验证；仓库凭证、Cloudflare Token和本机配置不得写入代码或文档。
