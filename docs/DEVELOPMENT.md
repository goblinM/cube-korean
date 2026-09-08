# CubeKorean 开发指南

## 环境

- Node.js：`>=22.13.0`
- 包管理器：npm
- 当前未要求业务环境变量

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
- `npm test` 会先构建，再运行 `tests/*.test.mjs`；当前22项测试覆盖页面渲染、课程结构、韩语拼写与音节组合、TTS降级、学习会话、顺序解锁、掌握度和本机持久化。

## 调试顺序

```text
复现输入步骤 → 查看浏览器Runtime Error/Console
→ 定位 app/page.tsx 当前状态 → 检查IME组合过程
→ 运行相关测试 → npm run build → 记录到 DEBUG.md
```

## 发布

项目使用 `.openai/hosting.json` 声明Sites项目绑定。发布属于外部状态变更，应先完成构建验证并按Sites工作流保存、部署已验证版本。不得在文档中保存仓库凭证或Token。
