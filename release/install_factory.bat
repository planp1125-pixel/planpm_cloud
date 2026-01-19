@echo off
REM Plan-PM Offline Installation Script
REM Run this on the factory server to load images and start the app.

echo.
echo ============================================
echo    Plan-PM Factory Installer
echo ============================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/2] Loading Docker images (this may take a few minutes)...
echo    - Loading planpm-app...
docker load -i planpm-app.tar

echo    - Loading supabase-postgres...
docker load -i supabase-db.tar

echo    - Loading supabase-gotrue...
docker load -i supabase-auth.tar

echo    - Loading supabase-postgrest...
docker load -i supabase-rest.tar

echo    - Loading supabase-storage...
docker load -i supabase-storage.tar

echo    - Loading supabase-kong...
docker load -i supabase-kong.tar

echo.
echo [2/2] Starting application...
call run_app.bat

echo.
echo ============================================
echo    Installation Complete!
echo ============================================
pause
