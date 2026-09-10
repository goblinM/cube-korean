# CubeKorean 部署说明

## 1. 线上信息

| 项目 | 值 |
|---|---|
| 生产域名 | `https://korean.amolabs.top` |
| GitHub 仓库 | `https://github.com/goblinM/cube-korean` |
| 生产分支 | `main` |
| Cloudflare 项目 | `cube-korean` |
| 运行平台 | Cloudflare Workers |
| 首次部署日期 | 2026-09-10 |

`cube-korean` 与 `amo-tech-lab` 是两个独立的 GitHub 仓库和 Cloudflare 项目。任一仓库的提交只会触发自身项目的构建，不会更新另一个服务。

## 2. 自动部署链路

```text
推送到 GitHub main
  → Cloudflare Workers Builds 拉取 goblinM/cube-korean
  → npm run build
  → npx wrangler deploy --config dist/server/wrangler.json
  → 发布 cube-korean Worker
  → korean.amolabs.top
```

Cloudflare 构建配置：

| 配置项 | 值 |
|---|---|
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config dist/server/wrangler.json` |
| Production branch | `main` |
| 非生产分支构建 | 开启 |
| Cloudflare Access | 关闭 |

`npm run build` 会由 Vinext 和 Cloudflare Vite 插件生成 `dist/server/wrangler.json`、Worker 入口与静态资源。部署命令必须读取这份生成配置，否则 Wrangler 无法找到正确入口和资源目录。

## 3. 日常发布

发布前在本机执行：

```bash
npm test
```

测试通过后提交并推送：

```bash
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

推送后进入 `Cloudflare Dashboard → Workers & Pages → cube-korean → Deployments`，确认最新构建依次完成 Installing、Building 和 Deploying，并在生产域名验证首页、开始关卡、韩语输入和音频播放。

## 4. 首次接入复现步骤

1. 在 Cloudflare Dashboard 打开 `Workers & Pages`，选择 `Create application`。
2. 选择 `Continue with GitHub`，允许 Cloudflare GitHub App 访问 `goblinM/cube-korean`。
3. 选择 `cube-korean` 仓库，项目名填写 `cube-korean`。
4. Build command 填写 `npm run build`。
5. Deploy command 填写 `npx wrangler deploy --config dist/server/wrangler.json`。
6. Root directory 保持 `/`，生产分支选择 `main`。
7. 点击 `Deploy`，等待首次生产部署成功。
8. 进入项目的 `Domains`，添加自定义域名 `korean.amolabs.top`。
9. 域名与 Worker 同属当前 Cloudflare 账户时，由 Cloudflare 自动创建 DNS 路由并签发 HTTPS 证书；等待状态变为 Active。
10. 访问 `https://korean.amolabs.top` 验证服务。

## 5. 手动发布与预览

仅在自动构建不可用时使用本机 Wrangler 登录态：

```bash
npm run deploy
```

创建非生产预览版本：

```bash
npm run deploy:preview
```

这两个命令都会先重新构建，避免上传过期的 `dist` 内容。

## 6. 回滚

优先在 Cloudflare Dashboard 的 `cube-korean → Deployments` 中选择上一个正常版本并执行回滚。随后在 GitHub 中修复或撤销有问题的提交，再推送 `main`，让自动部署回到可追踪状态。

不要通过修改 `amo-tech-lab` 的部署或域名来处理 CubeKorean 故障；两个项目的配置和回滚记录彼此独立。

## 7. 故障排查

- 构建失败：查看 Cloudflare 对应部署的 Build log，并在本机运行 `npm test` 复现。
- 提示缺少入口：确认 Deploy command 包含 `--config dist/server/wrangler.json`。
- 页面可打开但静态资源失败：确认构建产物同时包含 `dist/server` 与 `dist/client`。
- 自定义域名 Pending：检查 `Domains` 中的域名状态和 DNS 冲突记录，等待证书签发后再重试。
- 推送后没有构建：确认提交已进入 `main`，并检查项目的 Git repository 与 Build watch paths。
