#!/usr/bin/env bash
set -Eeuo pipefail

PORT="${PORT:-3000}"
PROXY="${HTTP_PROXY:-}"
MODE="production"
NPM_REGISTRY="${NPM_REGISTRY:-}"
APT_MIRROR="${APT_MIRROR:-https://mirrors.aliyun.com/ubuntu}"
FIX_APT_SOURCES="${FIX_APT_SOURCES:-1}"
INSTALL_BROWSER=1

usage() {
  cat <<'EOF'
Cyber Fate Ubuntu runner

Usage:
  bash start-ubuntu.sh [options]

Options:
  --port <port>             Port to bind. Default: 3000
  --proxy <url>             HTTP proxy, for example http://127.0.0.1:10809
  --npm-registry <url>      Optional npm registry, for example https://registry.npmmirror.com
  --apt-mirror <url>        Ubuntu apt mirror. Default: https://mirrors.aliyun.com/ubuntu
  --no-fix-apt-sources      Do not rewrite broken Ubuntu apt sources when apt-get update fails
  --dev                     Run Next.js dev server instead of production build/start
  --skip-browser            Skip Playwright Chromium installation
  -h, --help                Show this help

Examples:
  bash start-ubuntu.sh
  bash start-ubuntu.sh --port 3001
  bash start-ubuntu.sh --proxy http://127.0.0.1:10809
  bash start-ubuntu.sh --proxy http://127.0.0.1:10809 --npm-registry https://registry.npmmirror.com
  bash start-ubuntu.sh --apt-mirror https://archive.ubuntu.com/ubuntu
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="${2:?Missing value for --port}"
      shift 2
      ;;
    --proxy)
      PROXY="${2:?Missing value for --proxy}"
      shift 2
      ;;
    --npm-registry)
      NPM_REGISTRY="${2:?Missing value for --npm-registry}"
      shift 2
      ;;
    --apt-mirror)
      APT_MIRROR="${2:?Missing value for --apt-mirror}"
      shift 2
      ;;
    --no-fix-apt-sources)
      FIX_APT_SOURCES=0
      shift
      ;;
    --dev)
      MODE="development"
      shift
      ;;
    --skip-browser)
      INSTALL_BROWSER=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/cyber-fate-dev"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "Cannot find $APP_DIR/package.json"
  echo "Run this script from the suanming project root, or keep cyber-fate-dev next to this script."
  exit 1
fi

ensure_env_file() {
  local file="$1"
  local example="$2"
  if [[ -f "$file" || ! -f "$example" ]]; then
    return
  fi

  cp "$example" "$file"
  echo "Created env file: $file"
  echo "Fill API keys in this file before model generation."
}

load_env_file() {
  local file="$1"
  local line name value
  if [[ ! -f "$file" ]]; then
    return
  fi

  echo "Loading env file: $file"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    name="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    [[ -z "$value" ]] && continue
    [[ -n "${!name:-}" ]] && continue
    export "$name=$value"
  done < "$file"
}

ensure_env_file "$ROOT_DIR/.env" "$ROOT_DIR/.env.example"
ensure_env_file "$APP_DIR/.env.local" "$APP_DIR/.env.example"

load_env_file "$ROOT_DIR/.env"
load_env_file "$ROOT_DIR/.env.local"
load_env_file "$APP_DIR/.env"
load_env_file "$APP_DIR/.env.local"

if [[ -n "${APP_PORT:-}" && "$PORT" == "3000" ]]; then
  PORT="$APP_PORT"
fi

if [[ -n "$PROXY" ]]; then
  export HTTP_PROXY="$PROXY"
  export HTTPS_PROXY="$PROXY"
  export http_proxy="$PROXY"
  export https_proxy="$PROXY"
  export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,::1}"
  export no_proxy="${no_proxy:-$NO_PROXY}"
fi

if [[ "$EUID" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo -E"
fi

need_command() {
  command -v "$1" >/dev/null 2>&1
}

ubuntu_codename() {
  . /etc/os-release
  echo "${VERSION_CODENAME:-noble}"
}

repair_ubuntu_apt_sources() {
  local codename timestamp source_file
  codename="$(ubuntu_codename)"
  timestamp="$(date +%Y%m%d%H%M%S)"

  echo "Repairing Ubuntu apt sources with mirror: $APT_MIRROR"
  echo "Existing Ubuntu source files will be backed up with suffix .cyber-fate-$timestamp.bak"

  shopt -s nullglob
  for source_file in /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; do
    if [[ -f "$source_file" ]] && grep -Eqi 'ubuntu\.com/ubuntu|archive\.ubuntu|mirrors\..*/ubuntu|mirrors\.tuna\.tsinghua\.edu\.cn/ubuntu|hk\.archive\.ubuntu\.com' "$source_file"; then
      $SUDO cp "$source_file" "$source_file.cyber-fate-$timestamp.bak"
      if [[ "$source_file" == "/etc/apt/sources.list" ]]; then
        echo "# Disabled by Cyber Fate runner on $timestamp; see backup next to this file." | $SUDO tee "$source_file" >/dev/null
      else
        $SUDO mv "$source_file" "$source_file.disabled-by-cyber-fate-$timestamp"
      fi
    fi
  done
  shopt -u nullglob

  $SUDO tee /etc/apt/sources.list.d/cyber-fate-ubuntu.sources >/dev/null <<EOF
Types: deb
URIs: $APT_MIRROR
Suites: $codename $codename-updates $codename-backports $codename-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF
}

apt_get_update() {
  if $SUDO apt-get update; then
    return
  fi

  if [[ "$FIX_APT_SOURCES" != "1" ]]; then
    echo "apt-get update failed and --no-fix-apt-sources is set."
    return 1
  fi

  repair_ubuntu_apt_sources
  $SUDO apt-get update
}

apt_get_install() {
  apt_get_update
  $SUDO apt-get install -y --no-install-recommends "$@"
}

node_major() {
  if need_command node; then
    node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0
  else
    echo 0
  fi
}

install_node_if_needed() {
  local major
  major="$(node_major)"
  if [[ "$major" -ge 22 ]]; then
    return
  fi

  echo "Installing Node.js 22..."
  apt_get_install ca-certificates curl gnupg

  curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
  $SUDO bash /tmp/nodesource_setup.sh
  $SUDO apt-get install -y --no-install-recommends nodejs
}

configure_npm() {
  if [[ -n "$PROXY" ]]; then
    npm config set proxy "$PROXY" >/dev/null
    npm config set https-proxy "$PROXY" >/dev/null
  fi

  if [[ -n "$NPM_REGISTRY" ]]; then
    npm config set registry "$NPM_REGISTRY" >/dev/null
  fi
}

install_pnpm_if_needed() {
  if need_command pnpm; then
    return
  fi

  echo "Installing pnpm 11.0.9..."
  if [[ -n "$PROXY" ]]; then
    $SUDO npm config set proxy "$PROXY" >/dev/null
    $SUDO npm config set https-proxy "$PROXY" >/dev/null
  fi
  if [[ -n "$NPM_REGISTRY" ]]; then
    $SUDO npm config set registry "$NPM_REGISTRY" >/dev/null
  fi
  $SUDO npm install -g pnpm@11.0.9
}

install_project_dependencies() {
  cd "$APP_DIR"
  echo "Installing project dependencies..."
  pnpm install --frozen-lockfile
}

install_browser_if_needed() {
  if [[ "$INSTALL_BROWSER" -eq 0 ]]; then
    return
  fi

  cd "$APP_DIR"
  if need_command chromium || need_command chromium-browser || need_command google-chrome || need_command google-chrome-stable; then
    echo "System Chromium/Chrome found. Skipping Playwright browser download."
    return
  fi

  echo "Installing Playwright Chromium and required system libraries..."
  apt_get_update
  pnpm exec playwright install --with-deps chromium
}

start_app() {
  cd "$APP_DIR"

  export FRONTEND_PORT="$PORT"
  export BACKEND_PORT="${BACKEND_PORT:-4000}"
  export APP_BASE_URL="http://localhost:$PORT"
  export BACKEND_API_BASE_URL="${BACKEND_API_BASE_URL:-http://127.0.0.1:$BACKEND_PORT}"
  export NEXT_PUBLIC_BACKEND_PORT="${NEXT_PUBLIC_BACKEND_PORT:-$BACKEND_PORT}"
  export ENABLE_OPENAI="${ENABLE_OPENAI:-false}"
  export ENABLE_PERCEPTLEAP="${ENABLE_PERCEPTLEAP:-true}"
  export CYBER_FATE_LLM_MODE="${CYBER_FATE_LLM_MODE:-perceptleap}"

  echo ""
  echo "Cyber Fate frontend will listen on:"
  echo "  http://0.0.0.0:$PORT"
  echo "Cyber Fate backend will listen on:"
  echo "  http://0.0.0.0:$BACKEND_PORT"
  echo "From the Ubuntu VM itself:"
  echo "  http://localhost:$PORT"
  echo ""

  if [[ "$MODE" == "development" ]]; then
    pnpm dev
  else
    pnpm build
    pnpm start
  fi
}

echo "Cyber Fate Ubuntu runner"
echo "Project root: $ROOT_DIR"
echo "App dir: $APP_DIR"
echo "Mode: $MODE"
if [[ -n "$PROXY" ]]; then
  echo "Proxy: $PROXY"
fi
if [[ -n "$NPM_REGISTRY" ]]; then
  echo "NPM registry: $NPM_REGISTRY"
fi
echo "APT mirror: $APT_MIRROR"
if [[ "$FIX_APT_SOURCES" == "1" ]]; then
  echo "APT source repair: enabled"
else
  echo "APT source repair: disabled"
fi

install_node_if_needed
configure_npm
install_pnpm_if_needed
install_project_dependencies
install_browser_if_needed
start_app
