# CubeKorean 部署说明

## 1. 线上信息

| 项目 | 值 |
|---|---|
| 现有生产域名 | `https://korean.amolabs.top` |
| 新独立域名 | `https://cubekorean.top`（DNS 已 Active，Worker 绑定后才可访问） |
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
  → cube-korean Worker 已绑定的域名
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

构建变量 `CUBE_WORKER_NAME` 决定生成配置中的 Worker 名；未设置时仍为 `cube-korean`。后续创建测试 Worker `cube-korean-dev` 时，在该项目的 Cloudflare Builds 构建变量中设置 `CUBE_WORKER_NAME=cube-korean-dev`；正式 Worker 设置为 `cube-korean`。构建后应检查 `dist/server/wrangler.json` 的 `name` 与 Cloudflare 项目名一致。此变量只选择部署目标，不会自动创建 Worker、切换 Git 分支或绑定域名。

## 3. 日常发布

发布前在本机执行：

```bash
npm run test:all
```

浏览器端测试需要本机安装Chrome。真实发音还需分别在Mac Chrome与Safari试听，自动化只能确认静态MP3、连续切换与备用语音调用链正常。

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

## 5. 接入独立域名 `cubekorean.top`

`cubekorean.top` 在阿里云注册，已添加到当前 Cloudflare 账户且域名状态为 Active。域名 DNS Active 只代表 Cloudflare 已接管解析，不代表网站已绑定成功。计划将它绑定到正式 Worker `cube-korean`；原地址 `korean.amolabs.top` 后续绑定到独立的测试 Worker `cube-korean-dev`，两个域名才会分别显示 `release` 与 `develop` 分支的版本。分支与 Worker 的迁移尚需在 GitHub 和 Cloudflare 完成。

1. 若需复现域名接入：在 Cloudflare `Domains → Onboard a domain` 添加 `cubekorean.top`；到阿里云**域名控制台**的 `域名列表 → cubekorean.top → 管理 → DNS 管理 → DNS 修改`，将 DNS 服务器设置为 Cloudflare 为**该域名**分配的两条 Nameserver，并删除其他 Nameserver。此操作不是在阿里云“云解析 DNS”中添加 NS 解析记录。如原域名启用了 DNSSEC，先在阿里云移除旧 DS 记录。等待 Cloudflare 域名状态变为 Active。
2. 在 Cloudflare 打开 `Workers & Pages → cube-korean → Domains`，选择 `Add → Custom Domain`，填写 `cubekorean.top` 并确认。若界面没有独立的 `Domains` 页，使用 `Settings → Domains & Routes → Add → Custom Domain`。Cloudflare 会自动创建该 Worker 的 DNS 记录并签发 HTTPS 证书，不要手工创建指向 Worker 的 CNAME。
3. 等 Worker 的自定义域名状态变为 Active，访问 `https://cubekorean.top`，验证首页、开始关卡、韩语输入和音频播放。再检查 `cube-korean → Deployments` 中生产版本正常。
4. 学习记录保存在浏览器当前域名的 `localStorage`，不会随域名切换自动迁移。已有用户先在旧站“备份与恢复”下载 JSON，再在新站恢复。原地址计划用作测试环境，不应配置到正式域名的 301 跳转。

`www.cubekorean.top` 是不同主机名。如需支持 `www`，另行绑定为自定义域名，或配置指向 `https://cubekorean.top` 的重定向。

## 6. 手动发布与预览

仅在自动构建不可用时使用本机 Wrangler 登录态：

```bash
npm run deploy
```

创建非生产预览版本：

```bash
npm run deploy:preview
```

这两个命令都会先重新构建，避免上传过期的 `dist` 内容。

## 7. 回滚

优先在 Cloudflare Dashboard 的 `cube-korean → Deployments` 中选择上一个正常版本并执行回滚。随后在 GitHub 中修复或撤销有问题的提交，再推送 `main`，让自动部署回到可追踪状态。

不要通过修改 `amo-tech-lab` 的部署或域名来处理 CubeKorean 故障；两个项目的配置和回滚记录彼此独立。

## 8. 故障排查

- 构建失败：查看 Cloudflare 对应部署的 Build log，并在本机运行 `npm test` 复现。
- 提示缺少入口：确认 Deploy command 包含 `--config dist/server/wrangler.json`。
- 页面可打开但静态资源失败：确认构建产物同时包含 `dist/server` 与 `dist/client`。
- 自定义域名 Pending：检查 `Domains` 中的域名状态和 DNS 冲突记录，等待证书签发后再重试。
- 新域名显示 Invalid nameservers：对照阿里云域名控制台与 Cloudflare 分配的两条 Nameserver，确认没有多余地址；检查阿里云旧 DS 记录，并等待 DNS 服务器修改传播。
- 推送后没有构建：确认提交已进入 `main`，并检查项目的 Git repository 与 Build watch paths。
- Cloudflare 显示 Git 账户已断开：在项目 `Settings → Builds` 点击 `Manage`，前往 GitHub 重新确认 Cloudflare Workers and Pages App 的访问权限；确认 `cube-korean` 仍在授权仓库列表后返回并刷新。
