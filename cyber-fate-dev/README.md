# Cyber Fate / 赛博天命局

本项目是一个本地可运行的赛博玄学命运白皮书生成器。用户填写昵称、出生日期、出生时间精度、出生地、当前城市、关心领域、空间偏好与当前问题后，系统会生成一份结构化报告，并提供在线预览、打印页和 PDF 下载。

报告仅供娱乐与自我观察，不作为医学、法律、投资或人生重大决策依据。

## 已完成能力

- Next.js App Router + TypeScript + Tailwind CSS。
- 访谈式 intake 页面，使用 React Hook Form + Zod 校验。
- 生成进度页，展示 Interviewer / Researcher / Fusion / Copywriter / Reviewer 五个步骤。
- PerceptLeap API 多角色管线：Interviewer / Researcher / Fusion / Copywriter / Reviewer 生成结构化报告，可选 Image Director 生成封面图提示词与图像。
- 本地备用管线：无 API key 或 API 调用失败时仍能生成完整报告。
- 基础命理 signal：星座、生肖公历近似、五行规则侧写、稳定易经 seed、风水取象。
- 本地知识库读取：`content/metaphysics/*.md`。
- 印章系统：按模块与关注领域选择印章。
- 报告预览页：`/report/[id]`。
- 打印页：`/report/[id]/print`。
- PDF 下载接口：`/api/reports/[id]/pdf`，使用 Playwright；若 Playwright 浏览器未安装，会尝试本机 Chrome/Edge。
- 测试覆盖核心 schema、signals、本地备用管线、PerceptLeap JSON 解析、印章与 PDF HTML renderer。

## 本地启动

注意：源码目录是 `F:\project\suanming\cyber-fate-dev`。如果你在上一层 `F:\project\suanming`，请使用 Docker 启动，或先执行：

```powershell
cd .\cyber-fate-dev
```

Ubuntu 虚拟机中推荐在上一层项目根目录运行：

```bash
bash start-ubuntu.sh
```

如果需要代理：

```bash
bash start-ubuntu.sh --proxy http://127.0.0.1:10809
```

如果 Ubuntu apt 源报 `403 Forbidden` 或 `InRelease` 签名异常，上一层的 `start-ubuntu.sh` 会默认备份并修复 Ubuntu 源。可指定镜像：

```bash
bash start-ubuntu.sh --apt-mirror https://mirrors.aliyun.com/ubuntu
```

如果系统没有全局 `pnpm`，可以直接使用 Node 自带的 Corepack：

```bash
corepack pnpm install
corepack pnpm dev
```

打开：

```text
http://localhost:3000
```

也可以直接看样例报告：

```text
http://localhost:3000/report/sample
```

## Docker 一键启动

如果只想一键安装并启动，在上一层目录 `F:\project\suanming` 运行：

```powershell
.\start-docker.ps1
```

如果 PowerShell 拦截脚本：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-docker.ps1
```

也可以手动运行：

```powershell
docker compose up --build
```

启动后访问：

```text
http://localhost:3000
```

如果 Docker 报 `dockerDesktopLinuxEngine` 连接错误，先启动 Docker Desktop，再重试。若 3000 端口被占用，可在上一层目录运行：

```powershell
.\start-docker.ps1 -Port 3001
```

如果本地使用代理，脚本里要填的是“本机代理客户端监听端口”，不是远端节点配置。Clash 常见是 `7890`/`7897`，v2rayN 常见 HTTP 端口是 `10809`。

例如本机 HTTP 代理是 `http://127.0.0.1:7890`：

```powershell
.\start-docker.ps1 -Proxy http://127.0.0.1:7890
```

第一次拉取 Playwright 基础镜像时，建议同时在 Docker Desktop 设置代理：
当前 Dockerfile 使用 `node:22-bookworm-slim`，并在容器内安装 Debian 的 `chromium` 用于 PDF；不再依赖 Playwright 的 MCR 基础镜像。

如果 Docker Hub 拉 `node:22-bookworm-slim` 仍然超时，并且本机已有 `ubuntu:22.04` 镜像，可在上一层目录运行备用路线：

```powershell
.\start-docker.ps1 -Proxy http://127.0.0.1:10809 -UbuntuBase
```

```text
Docker Desktop -> Settings -> Resources -> Proxies
```

后台运行：

```powershell
docker compose up -d --build
```

停止：

```powershell
docker compose down
```

## 常用命令

```bash
corepack pnpm dev
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

安装 Playwright 浏览器：

```bash
corepack pnpm exec playwright install chromium
```

如果浏览器下载受网络影响失败，PDF 生成器会自动尝试：

- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- `C:\Program Files\Microsoft\Edge\Application\msedge.exe`
- `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`

也可以手动指定：

```env
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

## 环境变量

复制 `.env.example` 为 `.env.local`，默认不用填写 API key：

```env
OPENAI_API_KEY=
OPENAI_MODEL_DEFAULT=
OPENAI_MODEL_INTERVIEWER=
OPENAI_MODEL_RESEARCHER=
OPENAI_MODEL_FUSION=
OPENAI_MODEL_COPYWRITER=
OPENAI_MODEL_REVIEWER=
CYBER_FATE_LLM_MODE=mock
ENABLE_OPENAI=false
PERCEPTLEAP_API_KEY=
PERCEPTLEAP_BASE_URL=https://api.perceptleap.com/v1
PERCEPTLEAP_TEXT_MODEL=gpt-5.4
PERCEPTLEAP_IMAGE_MODEL=gpt-image-2
PERCEPTLEAP_IMAGE_SIZE=1024x1024
PERCEPTLEAP_IMAGE_QUALITY=low
ENABLE_PERCEPTLEAP=false
ENABLE_PERCEPTLEAP_IMAGE=false
PERCEPTLEAP_PROXY_URL=
ENABLE_WEB_SEARCH=false
OPENAI_VECTOR_STORE_ID=
APP_BASE_URL=http://localhost:3000
```

## 生成模式切换

默认是本地备用模式：

```env
ENABLE_OPENAI=false
ENABLE_PERCEPTLEAP=false
CYBER_FATE_LLM_MODE=mock
```

启用 PerceptLeap API 多角色模式：

```env
CYBER_FATE_LLM_MODE=perceptleap
ENABLE_PERCEPTLEAP=true
PERCEPTLEAP_API_KEY=sk-...
PERCEPTLEAP_TEXT_MODEL=gpt-5.4
```

启用 PerceptLeap 图像生成：

```env
ENABLE_PERCEPTLEAP_IMAGE=true
PERCEPTLEAP_IMAGE_MODEL=gpt-image-2
PERCEPTLEAP_IMAGE_QUALITY=low
```

如果本机或虚拟机需要代理，优先设置专用代理变量：

```env
PERCEPTLEAP_PROXY_URL=http://127.0.0.1:10809
```

Docker 内访问宿主机代理时通常使用：

```env
PERCEPTLEAP_PROXY_URL=http://host.docker.internal:10809
```

启用 OpenAI Agents SDK 模式：

```env
ENABLE_OPENAI=true
CYBER_FATE_LLM_MODE=openai-agents
OPENAI_API_KEY=sk-...
OPENAI_MODEL_DEFAULT=gpt-4.1-mini
```

启用 OpenAI Responses 结构化输出模式：

```env
ENABLE_OPENAI=true
CYBER_FATE_LLM_MODE=openai-direct
OPENAI_API_KEY=sk-...
OPENAI_MODEL_COPYWRITER=gpt-4.1-mini
```

如果 PerceptLeap 或 OpenAI 调用失败，API 会自动降级到本地备用管线，并在报告 reviewer issues 中记录原因。

## 本地存储限制

第一版没有数据库。用户生成的报告会保存到：

```text
.cyber-fate-data/reports/*.json
```

删除该目录会清空本地生成记录；`/report/sample` 不受影响。

## 主要目录

```text
src/app/                    页面与 API routes
src/components/             UI、报告预览、印章组件
src/lib/fate/               星座、生肖、五行、易象、风水、印章
src/lib/research/           本地知识库读取
src/lib/report/             report schema、构建器、存储
src/lib/agents/             Agents SDK 定义与 pipeline 入口
src/lib/llm/                PerceptLeap/OpenAI client、模型配置、本地备用 pipeline
src/lib/pdf/                HTML renderer 与 Playwright PDF
content/metaphysics/        本地玄学知识库
tests/                      Vitest 测试
```

## 当前边界

- 生肖按公历年份近似，未处理农历新年/立春边界。
- 五行是象征性规则侧写，不是专业八字排盘。
- 风水建议在没有户型图、坐向与现场测量时只做空间取象。
- PerceptLeap mode 负责真实文本/可选图像生成；OpenAI mode 保留官方 SDK/Agents SDK 接入点；本地备用管线用于离线演示和失败降级。
