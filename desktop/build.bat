@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 22 (
  echo Node.js 22 or newer is required.
  pause
  exit /b 1
)
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
call npm run dist:win
if errorlevel 1 goto failed
echo.
echo Build complete. The installer is in desktop\dist\
explorer "%CD%\dist"
pause
exit /b 0
:failed
echo Build failed. Check the error above.
pause
exit /b 1
