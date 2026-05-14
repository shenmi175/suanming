@echo off
setlocal
cd /d "%~dp0"
if "%APP_PORT%"=="" set APP_PORT=3000
echo Starting Cyber Fate on http://localhost:%APP_PORT%
docker compose up --build
