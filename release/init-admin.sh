#!/bin/bash
# Plan-PM Docker Initialization Script
# This script waits for Supabase Auth to be ready and creates the default admin user

echo "Waiting for Supabase Auth service to be ready..."

# Wait for auth service to be healthy (max 60 seconds)
for i in {1..30}; do
    if curl -s http://supabase-kong:8000/auth/v1/health > /dev/null 2>&1; then
        echo "Auth service is ready!"
        break
    fi
    echo "Attempt $i/30 - Waiting..."
    sleep 2
done

# Wait a bit more to ensure DB is fully initialized
sleep 5

# Create admin user via GoTrue Admin API
echo "Creating default admin user..."

RESPONSE=$(curl -s -X POST http://supabase-kong:8000/auth/v1/admin/users \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@planpm.local",
        "password": "Admin@123*",
        "email_confirm": true,
        "user_metadata": {"display_name": "Administrator"}
    }')

# Extract user ID from response
USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
    echo "Admin user created with ID: $USER_ID"
    
    # Create admin profile in database (and ensure columns exist)
    PGPASSWORD=postgres psql -h supabase-db -U postgres -d postgres -c "
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;
        
        INSERT INTO public.profiles (id, username, display_name, role, permissions)
        VALUES (
            '$USER_ID', 
            'admin', 
            'Administrator', 
            'admin',
            jsonb_build_object('dashboard', 'edit', 'maintenance_history', 'edit', 'update_maintenance', 'edit', 'instruments', 'edit', 'design_templates', 'edit', 'settings', 'edit', 'user_management', 'edit')
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'admin',
            permissions = EXCLUDED.permissions;
        
        NOTIFY pgrst, 'reload schema';
    "
    echo "Admin profile created successfully!"
else
    echo "Admin user might already exist or there was an error. Response:"
    echo "$RESPONSE"
fi

echo ""
echo "========================================"
echo "Plan-PM Initialization Complete!"
echo "========================================"
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: Admin@123*"
echo ""
echo "Access the app at: http://localhost:9002"
echo "========================================"
