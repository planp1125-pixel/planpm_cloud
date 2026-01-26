-- Migration: Add Organization Model for Multi-User Teams
-- Run this on BOTH local and cloud Supabase
-- Version: 20260126000000

-- ============================================================================
-- STEP 1: Create Organizations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Add org_id to Profiles
-- ============================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);

-- ============================================================================
-- STEP 3: Add org_id to All Data Tables
-- ============================================================================

-- Instruments
ALTER TABLE public.instruments 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_instruments_org_id ON public.instruments(org_id);

-- Maintenance Configurations
ALTER TABLE public.maintenance_configurations 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_maintenance_configs_org_id ON public.maintenance_configurations(org_id);

-- Maintenance Schedules
ALTER TABLE public."maintenanceSchedules" 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedules_org_id ON public."maintenanceSchedules"(org_id);

-- Maintenance Results
ALTER TABLE public."maintenanceResults" 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_results_org_id ON public."maintenanceResults"(org_id);

-- Maintenance Documents
ALTER TABLE public.maintenance_documents 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.maintenance_documents(org_id);

-- Test Templates
ALTER TABLE public."testTemplates" 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_templates_org_id ON public."testTemplates"(org_id);

-- Instrument Types
ALTER TABLE public."instrumentTypes" 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_instrument_types_org_id ON public."instrumentTypes"(org_id);

-- Maintenance Types (shared, but add for future flexibility)
ALTER TABLE public."maintenanceTypes" 
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_maintenance_types_org_id ON public."maintenanceTypes"(org_id);

-- ============================================================================
-- STEP 4: Helper Function to Get User's Org ID
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 5: Update RLS Policies for All Tables
-- ============================================================================

-- Organizations - members can view their org
DROP POLICY IF EXISTS "Members can view own org" ON public.organizations;
CREATE POLICY "Members can view own org" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_user_org_id());

DROP POLICY IF EXISTS "Admins can update org" ON public.organizations;
CREATE POLICY "Admins can update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id = public.get_user_org_id() 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Instruments - org-based access
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.instruments;
DROP POLICY IF EXISTS "Org members can access instruments" ON public.instruments;
CREATE POLICY "Org members can access instruments" ON public.instruments
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Maintenance Configurations
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.maintenance_configurations;
DROP POLICY IF EXISTS "Org members can access configs" ON public.maintenance_configurations;
CREATE POLICY "Org members can access configs" ON public.maintenance_configurations
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Maintenance Schedules
DROP POLICY IF EXISTS "Allow all for authenticated" ON public."maintenanceSchedules";
DROP POLICY IF EXISTS "Org members can access schedules" ON public."maintenanceSchedules";
CREATE POLICY "Org members can access schedules" ON public."maintenanceSchedules"
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Maintenance Results
DROP POLICY IF EXISTS "Allow all for authenticated" ON public."maintenanceResults";
DROP POLICY IF EXISTS "Org members can access results" ON public."maintenanceResults";
CREATE POLICY "Org members can access results" ON public."maintenanceResults"
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Maintenance Documents
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.maintenance_documents;
DROP POLICY IF EXISTS "Org members can access documents" ON public.maintenance_documents;
CREATE POLICY "Org members can access documents" ON public.maintenance_documents
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Test Templates
DROP POLICY IF EXISTS "Allow all for authenticated" ON public."testTemplates";
DROP POLICY IF EXISTS "Org members can access templates" ON public."testTemplates";
CREATE POLICY "Org members can access templates" ON public."testTemplates"
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Instrument Types
DROP POLICY IF EXISTS "Allow all for authenticated" ON public."instrumentTypes";
DROP POLICY IF EXISTS "Org members can access instrument types" ON public."instrumentTypes";
CREATE POLICY "Org members can access instrument types" ON public."instrumentTypes"
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id() OR org_id IS NULL)
  WITH CHECK (org_id = public.get_user_org_id());

-- Maintenance Types (allow all, these are shared)
DROP POLICY IF EXISTS "Allow all for authenticated" ON public."maintenanceTypes";
CREATE POLICY "Allow read for authenticated" ON public."maintenanceTypes"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Org write for maintenance types" ON public."maintenanceTypes"
  FOR INSERT TO authenticated WITH CHECK (org_id = public.get_user_org_id());

-- ============================================================================
-- STEP 6: Update User Creation Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
  invited_org_id uuid;
BEGIN
  -- Check if user was invited to an existing org
  invited_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  
  IF invited_org_id IS NOT NULL THEN
    -- Invited user - join existing org
    INSERT INTO public.profiles (
      id, 
      role, 
      org_id, 
      display_name, 
      password_reset_required,
      permissions
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'role', 'user'),
      invited_org_id,
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      COALESCE((new.raw_user_meta_data->>'password_reset_required')::boolean, true),
      COALESCE(
        (new.raw_user_meta_data->>'permissions')::jsonb,
        '{"dashboard":"view","maintenance_history":"view","update_maintenance":"view","instruments":"view","design_templates":"hidden","settings":"hidden","user_management":"hidden"}'::jsonb
      )
    );
  ELSE
    -- New signup - create new organization
    INSERT INTO public.organizations (name, created_by)
    VALUES (
      COALESCE(
        new.raw_user_meta_data->>'org_name',
        split_part(new.email, '@', 1) || '''s Organization'
      ), 
      new.id
    )
    RETURNING id INTO new_org_id;
    
    -- Create admin profile
    INSERT INTO public.profiles (
      id, 
      role, 
      org_id, 
      display_name, 
      is_super_admin,
      permissions
    )
    VALUES (
      new.id, 
      'admin', 
      new_org_id, 
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      true,
      '{"dashboard":"edit","maintenance_history":"edit","update_maintenance":"edit","instruments":"edit","design_templates":"edit","settings":"edit","user_management":"edit"}'::jsonb
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: Add Insert Policy for Organizations (for trigger)
-- ============================================================================
DROP POLICY IF EXISTS "System can create orgs" ON public.organizations;
CREATE POLICY "System can create orgs" ON public.organizations
  FOR INSERT WITH CHECK (true);

-- Grant usage to postgres (for trigger)
GRANT ALL ON public.organizations TO postgres;
GRANT ALL ON public.organizations TO authenticated;
