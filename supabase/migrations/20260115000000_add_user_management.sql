-- Add user management fields to profiles table
-- This enables flexible RBAC with per-user permissions

-- Add display_name for showing username without email format
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Flag to force password reset on first login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required boolean DEFAULT false;

-- Flag to identify the super admin (default Admin user)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Flexible permissions JSON - each feature can be 'hidden', 'view', or 'edit'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "dashboard": "view",
  "maintenance_history": "view",
  "update_maintenance": "hidden",
  "instruments": "hidden",
  "design_templates": "hidden",
  "settings": "hidden",
  "user_management": "hidden"
}'::jsonb;

-- Update role constraint to include 'supervisor'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'supervisor', 'user'));

-- Update the handle_new_user function to set default permissions based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, password_reset_required, permissions)
  VALUES (
    new.id, 
    'user',
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'password_reset_required')::boolean, false),
    COALESCE(
      (new.raw_user_meta_data->>'permissions')::jsonb,
      '{
        "dashboard": "view",
        "maintenance_history": "view", 
        "update_maintenance": "hidden",
        "instruments": "hidden",
        "design_templates": "hidden",
        "settings": "hidden",
        "user_management": "hidden"
      }'::jsonb
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
