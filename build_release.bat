@echo off
REM Plan-PM Release Builder (Offline Deployment)
REM This script saves Docker images to files for transfer to the factory server.

echo.
echo ============================================
echo    Plan-PM Release Builder
echo ============================================
echo.

if not exist release mkdir release

echo [1/3] Ensuring latest images are built...
docker-compose -f docker-compose.prod.yml --env-file .env.docker build

echo [2/3] Saving Docker images to ./release folder...
echo    - Saving planpm-app...
docker save -o release/planpm-app.tar planpm_app

echo    - Saving supabase-postgres...
docker save -o release/supabase-db.tar supabase/postgres:15.1.1.78

echo    - Saving supabase-gotrue...
docker save -o release/supabase-auth.tar supabase/gotrue:v2.99.0

echo    - Saving supabase-postgrest...
docker save -o release/supabase-rest.tar postgrest/postgrest:v11.2.2

echo    - Saving supabase-storage...
docker save -o release/supabase-storage.tar supabase/storage-api:v0.46.4

echo    - Saving supabase-kong...
docker save -o release/supabase-kong.tar kong:3.0

echo    - Saving supabase-studio...
docker save -o release/supabase-studio.tar supabase/studio:latest

echo    - Saving supabase-meta...
docker save -o release/supabase-meta.tar supabase/postgres-meta:v0.84.2

echo [3/3] Copying deployment scripts...
copy docker-compose.prod.yml release\docker-compose.yml
copy .env.docker release\.env
copy deploy.bat release\run_app.bat
copy scripts\init-admin.sh release\init-admin.sh
copy install_factory.bat release\install_factory.bat
xcopy /E /I supabase release\supabase

echo.
echo ============================================
echo    Release Build Complete!
echo ============================================
echo.
echo The './release' folder contains everything needed for the factory server.
echo Transfer this folder to the server and run 'run_app.bat'.
echo.
pause
