-- Migration: Migrate Existing Cloud Data to Organization Model
-- ================================================
-- RUN THIS ONLY ON CLOUD SUPABASE AFTER MAIN MIGRATION
-- This assigns existing data to an organization
-- ================================================

-- IMPORTANT: Replace 'YOUR_ADMIN_EMAIL' with your actual Google email
-- For example: 'mani@gmail.com' or whatever email you use to login

DO $$
DECLARE
  admin_user_id uuid;
  org_id uuid;
BEGIN
  -- Step 1: Find admin user (first user or specific email)
  SELECT id INTO admin_user_id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- If you want specific user, uncomment and edit:
  -- SELECT id INTO admin_user_id FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL';
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Migration not needed.';
    RETURN;
  END IF;
  
  -- Step 2: Check if org already exists
  SELECT o.id INTO org_id 
  FROM public.organizations o
  JOIN public.profiles p ON p.org_id = o.id
  WHERE p.id = admin_user_id;
  
  IF org_id IS NULL THEN
    -- Step 3: Create organization
    INSERT INTO public.organizations (name, created_by)
    VALUES ('Plan-PM Organization', admin_user_id)
    RETURNING id INTO org_id;
    
    RAISE NOTICE 'Created organization: %', org_id;
  ELSE
    RAISE NOTICE 'Organization already exists: %', org_id;
  END IF;
  
  -- Step 4: Link admin profile to org
  UPDATE public.profiles 
  SET org_id = org_id, 
      role = 'admin', 
      is_super_admin = true
  WHERE id = admin_user_id AND (profiles.org_id IS NULL OR profiles.org_id != org_id);
  
  -- Step 5: Link all existing data to this org
  UPDATE public.instruments SET org_id = org_id WHERE instruments.org_id IS NULL;
  UPDATE public.maintenance_configurations SET org_id = org_id WHERE maintenance_configurations.org_id IS NULL;
  UPDATE public."maintenanceSchedules" SET org_id = org_id WHERE "maintenanceSchedules".org_id IS NULL;
  UPDATE public."maintenanceResults" SET org_id = org_id WHERE "maintenanceResults".org_id IS NULL;
  UPDATE public.maintenance_documents SET org_id = org_id WHERE maintenance_documents.org_id IS NULL;
  UPDATE public."testTemplates" SET org_id = org_id WHERE "testTemplates".org_id IS NULL;
  UPDATE public."instrumentTypes" SET org_id = org_id WHERE "instrumentTypes".org_id IS NULL;
  UPDATE public."maintenanceTypes" SET org_id = org_id WHERE "maintenanceTypes".org_id IS NULL;
  UPDATE public.profiles SET org_id = org_id WHERE profiles.org_id IS NULL;
  
  RAISE NOTICE 'Data migration complete! All existing data linked to org: %', org_id;
END $$;
