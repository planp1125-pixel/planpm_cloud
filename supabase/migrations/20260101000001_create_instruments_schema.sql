-- Migration: Create all Plan-PM tables with QUOTED camelCase names
-- Using double quotes to preserve case sensitivity

-- ============================================================================
-- INSTRUMENT TYPES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."instrumentTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid,
  CONSTRAINT "instrumentTypes_pkey" PRIMARY KEY (id),
  CONSTRAINT "instrumentTypes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- MAINTENANCE TYPES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."maintenanceTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  "createdAt" timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT "maintenanceTypes_pkey" PRIMARY KEY (id),
  CONSTRAINT "maintenanceTypes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default maintenance types
INSERT INTO public."maintenanceTypes" (name) VALUES
  ('Calibration'),
  ('Preventative Maintenance'),
  ('Validation'),
  ('AMC')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TEST TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."testTemplates" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT "testTemplates_pkey" PRIMARY KEY (id),
  CONSTRAINT "testTemplates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INSTRUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instruments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "eqpId" text NOT NULL,
  "instrumentType" text NOT NULL,
  model text NOT NULL,
  "serialNumber" text NOT NULL,
  location text NOT NULL,
  status text,
  "scheduleDate" timestamp with time zone NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['Daily'::text, 'Weekly'::text, 'Monthly'::text, '3 Months'::text, '6 Months'::text, '1 Year'::text])),
  "nextMaintenanceDate" timestamp with time zone NOT NULL,
  "imageId" text NOT NULL,
  "imageUrl" text,
  make text DEFAULT ''::text,
  "maintenanceType" text DEFAULT 'PM'::text,
  user_id uuid,
  "userId" uuid,
  "maintenanceBy" text,
  "vendorName" text,
  "vendorContact" text,
  "isActive" boolean DEFAULT true,
  CONSTRAINT instruments_pkey PRIMARY KEY (id),
  CONSTRAINT instruments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_instruments_user_id ON public.instruments(user_id);
CREATE INDEX IF NOT EXISTS idx_instruments_is_active ON public.instruments("isActive");

-- ============================================================================
-- MAINTENANCE CONFIGURATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL,
  maintenance_type text NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['Daily'::text, 'Weekly'::text, 'Monthly'::text, '3 Months'::text, '6 Months'::text, '1 Year'::text])),
  schedule_date timestamp with time zone NOT NULL,
  template_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  "maintenanceBy" text,
  "vendorName" text,
  "vendorContact" text,
  is_active boolean DEFAULT true,
  CONSTRAINT maintenance_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_configurations_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id) ON DELETE CASCADE,
  CONSTRAINT maintenance_configurations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public."testTemplates"(id) ON DELETE SET NULL,
  CONSTRAINT maintenance_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenance_configs_instrument ON public.maintenance_configurations(instrument_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_configs_is_active ON public.maintenance_configurations(is_active);

-- ============================================================================
-- MAINTENANCE SCHEDULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."maintenanceSchedules" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "instrumentId" uuid,
  "dueDate" timestamp with time zone NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  notes text,
  "completedDate" timestamp with time zone,
  "completionNotes" text,
  user_id uuid,
  template_id uuid,
  "vendorName" text,
  "vendorContact" text,
  "maintenanceBy" text,
  is_last_of_year boolean DEFAULT false,
  CONSTRAINT "maintenanceSchedules_pkey" PRIMARY KEY (id),
  CONSTRAINT "maintenanceSchedules_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES public.instruments(id) ON DELETE CASCADE,
  CONSTRAINT "maintenanceSchedules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT "maintenanceSchedules_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public."testTemplates"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_due_date ON public."maintenanceSchedules"("dueDate");
CREATE INDEX IF NOT EXISTS idx_schedules_instrument ON public."maintenanceSchedules"("instrumentId");
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public."maintenanceSchedules"(status);

-- ============================================================================
-- MAINTENANCE RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."maintenanceResults" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "maintenanceScheduleId" uuid,
  "instrumentId" uuid,
  "completedDate" timestamp with time zone NOT NULL,
  "resultType" text NOT NULL,
  notes text,
  "documentUrl" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "testData" jsonb,
  "templateId" uuid,
  user_id uuid,
  CONSTRAINT "maintenanceResults_pkey" PRIMARY KEY (id),
  CONSTRAINT "maintenanceResults_maintenanceScheduleId_fkey" FOREIGN KEY ("maintenanceScheduleId") REFERENCES public."maintenanceSchedules"(id) ON DELETE CASCADE,
  CONSTRAINT "maintenanceResults_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES public.instruments(id) ON DELETE CASCADE,
  CONSTRAINT "maintenanceResults_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."testTemplates"(id) ON DELETE SET NULL,
  CONSTRAINT "maintenanceResults_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- MAINTENANCE DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instrument_id uuid,
  maintenance_schedule_id uuid,
  title text,
  description text,
  document_url text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  document_type text DEFAULT 'main'::text CHECK (document_type = ANY (ARRAY['main'::text, 'section'::text, 'other'::text])),
  section_id text,
  CONSTRAINT maintenance_documents_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT maintenance_documents_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id) ON DELETE CASCADE,
  CONSTRAINT maintenance_documents_maintenance_schedule_id_fkey FOREIGN KEY (maintenance_schedule_id) REFERENCES public."maintenanceSchedules"(id) ON DELETE CASCADE
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public."instrumentTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."maintenanceTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."testTemplates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."maintenanceSchedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."maintenanceResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Using TO authenticated USING (true) for simplicity
-- ============================================================================

-- Maintenance Types
CREATE POLICY "Allow all for authenticated" ON public."maintenanceTypes" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Instrument Types
CREATE POLICY "Allow all for authenticated" ON public."instrumentTypes" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Instruments
CREATE POLICY "Allow all for authenticated" ON public.instruments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Templates
CREATE POLICY "Allow all for authenticated" ON public."testTemplates" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Maintenance Configurations
CREATE POLICY "Allow all for authenticated" ON public.maintenance_configurations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Maintenance Schedules
CREATE POLICY "Allow all for authenticated" ON public."maintenanceSchedules" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Maintenance Results
CREATE POLICY "Allow all for authenticated" ON public."maintenanceResults" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Maintenance Documents
CREATE POLICY "Allow all for authenticated" ON public.maintenance_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
