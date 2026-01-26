# ☁️ Cloud Supabase Manual Steps

## Run These in Cloud Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/krsecnzwutwoduaflqii/sql/new

---

## Step 1: Run Main Migration

Copy and paste the entire contents of this file into SQL Editor and run:
- File: `supabase/migrations/20260126000000_add_organizations.sql`

This will:
- Create `organizations` table
- Add `org_id` column to all data tables
- Update RLS policies
- Update user creation trigger

---

## Step 2: Run Data Migration

After Step 1 succeeds, run this to migrate your existing data:

```sql
-- Migrate Existing Cloud Data to Organization Model
DO $$
DECLARE
  admin_user_id uuid;
  new_org_id uuid;
BEGIN
  -- Find first user (your Google login)
  SELECT id INTO admin_user_id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Migration not needed.';
    RETURN;
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (name, created_by)
  VALUES ('Plan-PM Organization', admin_user_id)
  RETURNING id INTO new_org_id;
  
  RAISE NOTICE 'Created organization: %', new_org_id;
  
  -- Link admin profile to org
  UPDATE public.profiles 
  SET org_id = new_org_id, 
      role = 'admin', 
      is_super_admin = true
  WHERE id = admin_user_id;
  
  -- Link all existing data to this org
  UPDATE public.instruments SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public.maintenance_configurations SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public."maintenanceSchedules" SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public."maintenanceResults" SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public.maintenance_documents SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public."testTemplates" SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public."instrumentTypes" SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public."maintenanceTypes" SET org_id = new_org_id WHERE org_id IS NULL;
  UPDATE public.profiles SET org_id = new_org_id WHERE org_id IS NULL;
  
  RAISE NOTICE 'Data migration complete!';
END $$;
```

---

## Step 3: Verify Migration

Run this to verify:

```sql
-- Check organization was created
SELECT * FROM public.organizations;

-- Check your profile has org_id
SELECT id, display_name, role, org_id FROM public.profiles;

-- Check instruments have org_id
SELECT id, "eqpId", org_id FROM public.instruments LIMIT 5;
```

---

## What Happens Next

1. **When you login with Google**: Your profile already has org_id
2. **When you create a new user**: They get your org_id automatically
3. **All data**: Filtered by org_id in RLS policies
4. **Members see**: All instruments in their organization

---

## Rollback (If Something Goes Wrong)

```sql
-- Remove org_id constraint (allows NULL)
ALTER TABLE public.instruments ALTER COLUMN org_id DROP NOT NULL;
-- (repeat for other tables if needed)
```

---

## After Cloud Is Ready

1. Push code changes to GitHub
2. Vercel will auto-deploy
3. Test login and user creation
