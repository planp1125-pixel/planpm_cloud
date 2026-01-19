# Plan-PM Local Server Deployment Script (PowerShell)
# Run: .\deploy.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Plan-PM Local Server Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    docker info 2>&1 | Out-Null
}
catch {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/4] Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml --env-file .env.docker down 2>&1 | Out-Null

Write-Host "[2/4] Starting Plan-PM services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

Write-Host "[3/4] Waiting for services to be ready (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "[4/4] Creating default admin user..." -ForegroundColor Yellow

$headers = @{
    "apikey"        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    "Content-Type"  = "application/json"
}

$body = @{
    email         = "admin@planpm.local"
    password      = "Admin@123*"
    email_confirm = $true
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:54321/auth/v1/admin/users" -Method Post -Headers $headers -Body $body -ErrorAction SilentlyContinue
    Write-Host "  Admin user created successfully!" -ForegroundColor Green
}
catch {
    Write-Host "  Admin user may already exist (this is OK)" -ForegroundColor Yellow
}

# Create profile
docker exec planpm_supabase_db psql -U postgres -d postgres -c "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false; INSERT INTO public.profiles (id, username, display_name, role, permissions) SELECT id, 'admin', 'Administrator', 'admin', jsonb_build_object('dashboard', 'edit', 'maintenance_history', 'edit', 'update_maintenance', 'edit', 'instruments', 'edit', 'design_templates', 'edit', 'settings', 'edit', 'user_management', 'edit') FROM auth.users WHERE email = 'admin@planpm.local' ON CONFLICT (id) DO UPDATE SET role = 'admin', permissions = EXCLUDED.permissions;" 2>&1 | Out-Null

# Fix Storage Permissions and Create Buckets
docker exec planpm_supabase_db psql -U postgres -d postgres -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres' SUPERUSER; ELSE ALTER ROLE supabase_storage_admin WITH SUPERUSER; END IF; END `$`$;" 2>&1 | Out-Null
docker exec planpm_supabase_db psql -U postgres -d postgres -c "INSERT INTO storage.buckets (id, name, public) VALUES ('instruments', 'instruments', true), ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING; CREATE POLICY \"Public Access\" ON storage.objects FOR SELECT USING (bucket_id = 'instruments'); CREATE POLICY \"Authenticated Upload\" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'instruments'); CREATE POLICY \"Authenticated Update\" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'instruments');" 2>&1 | Out-Null

# Reload schema cache
docker exec planpm_supabase_db psql -U postgres -c "NOTIFY pgrst, 'reload schema';" 2>&1 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   App URL:    " -NoNewline; Write-Host "http://localhost:9002" -ForegroundColor Cyan
Write-Host "   Username:   " -NoNewline; Write-Host "admin" -ForegroundColor White
Write-Host "   Password:   " -NoNewline; Write-Host "Admin@123*" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process "http://localhost:9002"

Read-Host "Press Enter to exit"
