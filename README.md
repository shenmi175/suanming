# Cyber Fate Docker 启动

应用源码在 `cyber-fate-dev/`。你现在如果位于 `F:\project\suanming`，不要运行 `pnpm install`，因为这一层没有 `package.json`。

## Ubuntu 虚拟机原生启动

如果你把项目放到 Ubuntu 虚拟机里，可以不走 Docker，直接运行：

```bash
bash start-ubuntu.sh
```

带代理：

```bash
bash start-ubuntu.sh --proxy http://127.0.0.1:10809
```

如果 npm 官方源较慢：

```bash
bash start-ubuntu.sh --proxy http://127.0.0.1:10809 --npm-registry https://registry.npmmirror.com
```

如果安装 Playwright Chromium 时遇到 Ubuntu apt 源 `403 Forbidden`、`InRelease 签名不再生效` 或 TUNA/HK 源异常，脚本会默认备份并修复 Ubuntu 源到：

```text
https://mirrors.aliyun.com/ubuntu
```

也可以手动指定：

```bash
bash start-ubuntu.sh --apt-mirror https://archive.ubuntu.com/ubuntu
```

不想让脚本改 apt 源时：

```bash
bash start-ubuntu.sh --no-fix-apt-sources
```

改端口：

```bash
bash start-ubuntu.sh --port 3001
```

开发模式：

```bash
bash start-ubuntu.sh --dev
```

脚本会安装 Node.js 22、pnpm、项目依赖，并在没有系统 Chromium/Chrome 时安装 Playwright Chromium。启动后在虚拟机内访问 `http://localhost:3000`；宿主机访问需要确认虚拟机网络和端口转发设置。

## Docker 一键启动

在 `F:\project\suanming` 运行：

```powershell
.\start-docker.ps1
```

如果 PowerShell 拦截脚本执行，用这一条：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-docker.ps1
```

也可以双击或运行：

```bat
start-docker.cmd
```

启动后打开：

```text
http://localhost:3000
```

如果看到类似下面的错误，说明 Docker Desktop 没有启动，先打开 Docker Desktop，等左下角显示 engine running 后再执行启动命令：

```text
error during connect: ... dockerDesktopLinuxEngine ... The system cannot find the file specified
```

脚本会尝试自动打开 Docker Desktop 并等待 engine 就绪。若仍失败，通常是 Docker Desktop 没完全启动、未切到 Linux containers，或 WSL/虚拟化异常。

## 网络代理

这里需要填写“本机代理客户端监听端口”，不是远端节点的地址/端口。

例如 Clash 常见本机 HTTP/Mixed 端口是 `7890` 或 `7897`，v2rayN 常见 HTTP 端口是 `10809`，SOCKS 端口是 `10808`。优先使用 HTTP 代理端口。

如果你本机 HTTP 代理地址是 `http://127.0.0.1:7890`，可以这样启动：

```powershell
.\start-docker.ps1 -Proxy http://127.0.0.1:7890
```

脚本会自动把这个地址转换成 Docker build/runtime 可访问的 `host.docker.internal:<port>`。如果后续日志里出现容器内连接 `host.docker.internal:<port>` 被拒绝，请在代理客户端中开启“允许局域网连接 / Allow LAN”或把监听地址改为 `0.0.0.0`。

也可以手动设置环境变量：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
docker compose up --build
```

注意：拉取基础镜像这一步由 Docker Desktop daemon 完成，最好同时在 Docker Desktop 里配置代理：

```text
Docker Desktop -> Settings -> Resources -> Proxies
```

Docker Desktop 的代理地址建议写：

```text
http://host.docker.internal:7890
```

如果你的代理客户端只开启 SOCKS，没有 HTTP 代理，Docker 拉镜像可能仍会失败。请在代理客户端里开启 HTTP/Mixed 监听端口，或使用支持 HTTP proxy 的本地端口。

当前 Dockerfile 使用 `node:22-bookworm-slim`，并在容器内安装 Debian 的 `chromium` 用于 PDF。这样避开了 Playwright 的 MCR 基础镜像；如果 Docker Hub 仍然超时，需要继续检查 Docker Desktop 代理或配置 Docker registry mirror。

如果 Docker Hub 仍然超时，而你本机已有 `ubuntu:22.04` 镜像，可以走备用构建路线：

```powershell
.\start-docker.ps1 -Proxy http://127.0.0.1:10809 -UbuntuBase
```

这会使用 `cyber-fate-dev/Dockerfile.ubuntu`，避开 `node:22-bookworm-slim` 的基础镜像拉取，改为在 Ubuntu 容器里安装 Node 22 和 Playwright Chromium。

如果 3000 端口被占用：

```powershell
.\start-docker.ps1 -Port 3001
```

## 手动 Docker 命令

```powershell
docker compose up --build
```

后台运行：

```powershell
docker compose up -d --build
```

停止：

```powershell
docker compose down
```

清空本地报告数据：

```powershell
docker compose down -v
```

## 改端口

```powershell
.\start-docker.ps1 -Port 3001
```

或：

```powershell
$env:APP_PORT=3001
docker compose up --build
```

## API 生成模式

默认是本地备用模式，不需要 API key。

启用 PerceptLeap：

```powershell
$env:CYBER_FATE_LLM_MODE="perceptleap"
$env:ENABLE_PERCEPTLEAP="true"
$env:PERCEPTLEAP_API_KEY="sk-..."
$env:PERCEPTLEAP_PROXY_URL="http://host.docker.internal:10809"
docker compose up --build
```

如需同时生成封面图：

```powershell
$env:ENABLE_PERCEPTLEAP_IMAGE="true"
```

如要启用 OpenAI：

```powershell
$env:ENABLE_OPENAI="true"
$env:CYBER_FATE_LLM_MODE="openai-agents"
$env:OPENAI_API_KEY="sk-..."
docker compose up --build
```

报告数据保存在 Docker volume：`cyber_fate_reports`。
