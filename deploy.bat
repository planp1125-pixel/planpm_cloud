@echo off
REM Plan-PM Local Server Deployment Script
REM Run this script to deploy Plan-PM with Docker

echo.
echo ============================================
echo    Plan-PM Local Server Deployment
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

echo.
echo [0/4] ensure firewall ports are open...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process PowerShell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0open_firewall.ps1""' -Verb RunAs"

echo [1/4] Stopping any existing containers...
docker-compose -f docker-compose.prod.yml --env-file .env.docker down >nul 2>&1

echo [2/4] Starting Plan-PM services...
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

echo [3/4] Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo [4/4] Creating default admin user...
powershell -Command "& { $headers = @{ 'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; 'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; 'Content-Type' = 'application/json' }; try { $result = Invoke-RestMethod -Uri 'http://localhost:54321/auth/v1/admin/users' -Method Post -Headers $headers -Body '{\"email\":\"admin@planpm.local\",\"password\":\"Admin@123*\",\"email_confirm\":true}' -ErrorAction SilentlyContinue; Write-Host 'Admin user created: ' $result.id } catch { Write-Host 'Admin user may already exist (this is OK)' } }"

REM Create admin profile and reload schema cache
docker exec planpm_supabase_db psql -U postgres -d postgres -c "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false; INSERT INTO public.profiles (id, username, display_name, role, permissions) SELECT id, 'admin', 'Administrator', 'admin', jsonb_build_object('dashboard', 'edit', 'maintenance_history', 'edit', 'update_maintenance', 'edit', 'instruments', 'edit', 'design_templates', 'edit', 'settings', 'edit', 'user_management', 'edit') FROM auth.users WHERE email = 'admin@planpm.local' ON CONFLICT (id) DO UPDATE SET role = 'admin', permissions = EXCLUDED.permissions;" >nul 2>&1

REM Fix Storage Permissions and Create Buckets
docker exec planpm_supabase_db psql -U postgres -d postgres -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres' SUPERUSER; ELSE ALTER ROLE supabase_storage_admin WITH SUPERUSER; END IF; END $$;" >nul 2>&1
docker exec planpm_supabase_db psql -U postgres -d postgres -c "GRANT ALL ON SCHEMA storage TO authenticated, anon, service_role; GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, anon, service_role; GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated, anon, service_role;" >nul 2>&1
docker exec planpm_supabase_db psql -U postgres -d postgres -c "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;" >nul 2>&1
docker exec planpm_supabase_db psql -U postgres -d postgres -c "INSERT INTO storage.buckets (id, name, public) VALUES ('instruments', 'instruments', true), ('avatars', 'avatars', true), ('instrument-images', 'instrument-images', true) ON CONFLICT (id) DO NOTHING;" >nul 2>&1

REM Fix Studio Admin Role
docker exec planpm_supabase_db psql -U postgres -c "ALTER ROLE supabase_admin WITH LOGIN PASSWORD 'postgres';" >nul 2>&1

REM Reload schema cache
docker exec planpm_supabase_db psql -U postgres -c "NOTIFY pgrst, 'reload schema';" >nul 2>&1

echo.
echo ============================================
echo    Deployment Complete!
echo ============================================
echo.
echo    App URL:    http://localhost:9002
echo    Username:   admin
echo    Password:   Admin@123*
echo.
echo ============================================
echo.

REM Open browser
start http://localhost:9002

pause
