param(
  [int] $Port = 3000,
  [string] $Proxy = "",
  [int] $WaitSeconds = 180,
  [switch] $UbuntuBase,
  [switch] $DisableWebSearch
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$InitialEnvNames = @{}
Get-ChildItem Env: | ForEach-Object { $InitialEnvNames[$_.Name] = $true }

function Import-EnvFile {
  param([string] $Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Write-Host "Loading env file: $Path"
  $lines = Get-Content -Encoding UTF8 $Path
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
      continue
    }

    $match = [regex]::Match($trimmed, "^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
    if (-not $match.Success) {
      continue
    }

    $name = $match.Groups[1].Value
    $value = $match.Groups[2].Value.Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($InitialEnvNames.ContainsKey($name)) {
      continue
    }
    if ([string]::IsNullOrWhiteSpace($value)) {
      continue
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Ensure-EnvFile {
  param(
    [string] $Path,
    [string] $ExamplePath
  )

  if ((Test-Path $Path) -or -not (Test-Path $ExamplePath)) {
    return
  }

  Copy-Item -LiteralPath $ExamplePath -Destination $Path
  Write-Host "Created env file: $Path"
  Write-Host "Fill API keys in this file before model generation."
}

Ensure-EnvFile (Join-Path $Root ".env") (Join-Path $Root ".env.example")
Ensure-EnvFile (Join-Path $Root "cyber-fate-dev\.env.local") (Join-Path $Root "cyber-fate-dev\.env.example")

Import-EnvFile (Join-Path $Root ".env")
Import-EnvFile (Join-Path $Root ".env.local")
Import-EnvFile (Join-Path $Root "cyber-fate-dev\.env")
Import-EnvFile (Join-Path $Root "cyber-fate-dev\.env.local")

if (-not $PSBoundParameters.ContainsKey("Port") -and $env:APP_PORT) {
  $Port = [int] $env:APP_PORT
}

$env:APP_PORT = "$Port"
if ($UbuntuBase) {
  $env:DOCKERFILE = "Dockerfile.ubuntu"
} elseif (-not $env:DOCKERFILE) {
  $env:DOCKERFILE = "Dockerfile"
}

function Set-EnvDefault {
  param(
    [string] $Name,
    [string] $Value
  )

  if (-not [Environment]::GetEnvironmentVariable($Name, "Process")) {
    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
  }
}

function Add-NoProxyHosts {
  param([string[]] $Hosts)

  foreach ($name in @("NO_PROXY", "no_proxy")) {
    $current = [Environment]::GetEnvironmentVariable($name, "Process")
    if ([string]::IsNullOrWhiteSpace($current)) {
      $current = "localhost,127.0.0.1,::1"
    }

    $items = @($current.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    foreach ($hostName in $Hosts) {
      if ($items -notcontains $hostName) {
        $items += $hostName
      }
    }
    [Environment]::SetEnvironmentVariable($name, ($items -join ","), "Process")
  }
}

function Use-DockerResearchDefaults {
  if ($DisableWebSearch) {
    $env:ENABLE_WEB_SEARCH = "false"
    return
  }

  if (-not $InitialEnvNames.ContainsKey("ENABLE_WEB_SEARCH")) {
    $env:ENABLE_WEB_SEARCH = "true"
  }

  Set-EnvDefault "WEB_RESEARCH_PROVIDER" "searxng"

  if (-not $InitialEnvNames.ContainsKey("SEARXNG_BASE_URL")) {
    $env:SEARXNG_BASE_URL = "http://searxng:8080"
  }

  if (-not $InitialEnvNames.ContainsKey("DATABASE_URL") -and
      ($env:DATABASE_URL -match "@(127\.0\.0\.1|localhost):" -or
       [string]::IsNullOrWhiteSpace($env:DATABASE_URL))) {
    $dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "cyber_fate" }
    $dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "cyber_fate" }
    $dbPassword = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "cyber_fate_local" }
    $env:DATABASE_URL = "postgresql://${dbUser}:${dbPassword}@postgres:5432/${dbName}"
  }

  Add-NoProxyHosts @("postgres", "searxng")
}

Use-DockerResearchDefaults

function Convert-LocalProxyForDockerBuild {
  param([string] $ProxyUrl)

  if ([string]::IsNullOrWhiteSpace($ProxyUrl)) {
    return $ProxyUrl
  }

  try {
    $uri = [Uri] $ProxyUrl
    if ($uri.Host -in @("127.0.0.1", "localhost")) {
      return "$($uri.Scheme)://host.docker.internal:$($uri.Port)"
    }
  } catch {
    return $ProxyUrl
  }

  return $ProxyUrl
}

if ($Proxy) {
  $dockerBuildProxy = Convert-LocalProxyForDockerBuild $Proxy
  $env:CYBER_FATE_LOCAL_PROXY = $Proxy
  $env:HTTP_PROXY = $dockerBuildProxy
  $env:HTTPS_PROXY = $dockerBuildProxy
  $env:http_proxy = $dockerBuildProxy
  $env:https_proxy = $dockerBuildProxy
  if (-not $env:NO_PROXY) {
    $env:NO_PROXY = "localhost,127.0.0.1,::1,postgres,searxng"
  }
  if (-not $env:no_proxy) {
    $env:no_proxy = $env:NO_PROXY
  }
  Add-NoProxyHosts @("postgres", "searxng")
}

function Test-DockerEngine {
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = & docker version --format "{{.Server.Version}}" 2>&1
    if ($LASTEXITCODE -ne 0) {
      return $false
    }

    $serverVersion = ($output | Select-Object -First 1)
    return (-not [string]::IsNullOrWhiteSpace($serverVersion))
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Start-DockerDesktopIfNeeded {
  if (Test-DockerEngine) {
    return
  }

  $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Write-Host "Docker Engine is not ready. Starting Docker Desktop..."
    Start-Process -FilePath $dockerDesktop | Out-Null
  } else {
    Write-Host "Docker Desktop was not found at $dockerDesktop"
  }

  $deadline = (Get-Date).AddSeconds($WaitSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DockerEngine) {
      Write-Host "Docker Engine is ready."
      return
    }
    Start-Sleep -Seconds 3
  }

  Write-Host ""
  Write-Host "Docker Engine is still unavailable."
  Write-Host "Open Docker Desktop manually and wait until it says the engine is running, then rerun this script."
  Write-Host "If you use a network proxy, configure it in Docker Desktop: Settings -> Resources -> Proxies."
  exit 1
}

function Test-ProxyUrlListening {
  param([string] $ProxyUrl)

  if ([string]::IsNullOrWhiteSpace($ProxyUrl)) {
    return $true
  }

  try {
    $uri = [Uri] $ProxyUrl
    if ($uri.Host -notin @("127.0.0.1", "localhost")) {
      return $true
    }

    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -eq $uri.Port -and $_.LocalAddress -in @("127.0.0.1", "0.0.0.0", "::", "::1") }

    return ($null -ne $connections)
  } catch {
    return $true
  }
}

function Get-DockerDesktopProxyUrls {
  $settingsPath = Join-Path $env:APPDATA "Docker\settings-store.json"
  if (-not (Test-Path $settingsPath)) {
    return @()
  }

  try {
    $settings = Get-Content -Raw -Encoding UTF8 $settingsPath | ConvertFrom-Json
    return @($settings.OverrideProxyHTTP, $settings.OverrideProxyHTTPS) |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
      Select-Object -Unique
  } catch {
    return @()
  }
}

function Assert-ProxyConfiguration {
  $scriptProxy = if ($env:CYBER_FATE_LOCAL_PROXY) { $env:CYBER_FATE_LOCAL_PROXY } else { $env:HTTP_PROXY }
  if ($scriptProxy -and -not (Test-ProxyUrlListening $scriptProxy)) {
    Write-Host ""
    Write-Host "The proxy passed to this script is not listening: $scriptProxy"
    Write-Host "Check your local proxy client HTTP/Mixed port, then retry with:"
    Write-Host "  .\start-docker.ps1 -Proxy http://127.0.0.1:<port>"
    exit 1
  }

  $dockerProxyUrls = Get-DockerDesktopProxyUrls
  foreach ($dockerProxy in $dockerProxyUrls) {
    if (-not (Test-ProxyUrlListening $dockerProxy)) {
      Write-Host ""
      Write-Host "Docker Desktop is configured to use a proxy that is not listening: $dockerProxy"
      Write-Host "Docker must pull the base image before compose build args are applied."
      Write-Host "Fix it in Docker Desktop -> Settings -> Resources -> Proxies."
      Write-Host "Your machine currently has these common proxy ports listening:"
      Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in 7890,7897,10808,10809,7891,7892 } |
        Select-Object LocalAddress,LocalPort,OwningProcess |
        Format-Table -AutoSize
      Write-Host "For v2rayN, HTTP is commonly 10809. Example:"
      Write-Host "  HTTP proxy:  http://127.0.0.1:10809"
      Write-Host "  HTTPS proxy: http://127.0.0.1:10809"
      exit 1
    }
  }
}

Write-Host "Starting Cyber Fate on http://localhost:$Port"
Write-Host "Press Ctrl+C to stop. Reports are stored in cyber_fate_reports; Postgres data/cache in cyber_fate_postgres."
Write-Host "Dockerfile: $env:DOCKERFILE"
Write-Host "Docker stack: app + postgres + searxng"
Write-Host "Web research: $env:ENABLE_WEB_SEARCH"
if ($env:ENABLE_WEB_SEARCH -eq "true") {
  Write-Host "SearXNG inside Docker: $env:SEARXNG_BASE_URL"
}
if ($env:HTTP_PROXY) {
  if ($env:CYBER_FATE_LOCAL_PROXY) {
    Write-Host "Local proxy: $env:CYBER_FATE_LOCAL_PROXY"
    Write-Host "Docker build/runtime proxy: $env:HTTP_PROXY"
  } else {
    Write-Host "Proxy env is set for build/runtime: $env:HTTP_PROXY"
  }
}

Start-DockerDesktopIfNeeded
Assert-ProxyConfiguration

docker compose up --build
