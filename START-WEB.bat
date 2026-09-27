@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo     MINJI'S SNACK RUN - WEB STARTER
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js 22.13 or newer, then try again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run detected. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Review the error above.
    pause
    exit /b 1
  )
)

echo.
echo Starting Minji's Snack Run in your browser...
call npx expo start --web

endlocal
