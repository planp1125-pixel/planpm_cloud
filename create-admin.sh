#!/bin/bash

# Create admin user in Supabase
echo "Creating admin user: admin@planpm.local"

# Use Supabase SQL to create the user
npx supabase db execute <<SQL
-- Create admin user via SQL (workaround)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@planpm.local',
  crypt('Admin123*', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Set admin role in profiles
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@planpm.local';
SQL

echo "Admin user created successfully!"
echo "Email: admin@planpm.local"
echo "Password: Admin123*"
