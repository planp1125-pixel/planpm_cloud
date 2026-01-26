-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.instrumentTypes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid,
  CONSTRAINT instrumentTypes_pkey PRIMARY KEY (id),
  CONSTRAINT instrumentTypes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.instruments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eqpId text NOT NULL,
  instrumentType text NOT NULL,
  model text NOT NULL,
  serialNumber text NOT NULL,
  location text NOT NULL,
  status text,
  scheduleDate timestamp with time zone NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['Daily'::text, 'Weekly'::text, 'Monthly'::text, '3 Months'::text, '6 Months'::text, '1 Year'::text])),
  nextMaintenanceDate timestamp with time zone NOT NULL,
  imageId text NOT NULL,
  imageUrl text,
  make text DEFAULT ''::text,
  maintenanceType text DEFAULT 'PM'::text,
  user_id uuid,
  maintenanceBy text,
  vendorName text,
  vendorContact text,
  CONSTRAINT instruments_pkey PRIMARY KEY (id),
  CONSTRAINT instruments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.maintenanceResults (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  maintenanceScheduleId uuid,
  instrumentId uuid,
  completedDate timestamp with time zone NOT NULL,
  resultType text NOT NULL,
  notes text,
  documentUrl text,
  createdAt timestamp with time zone DEFAULT now(),
  testData jsonb,
  templateId uuid,
  user_id uuid,
  CONSTRAINT maintenanceResults_pkey PRIMARY KEY (id),
  CONSTRAINT maintenanceResults_maintenanceScheduleId_fkey FOREIGN KEY (maintenanceScheduleId) REFERENCES public.maintenanceSchedules(id),
  CONSTRAINT maintenanceResults_instrumentId_fkey FOREIGN KEY (instrumentId) REFERENCES public.instruments(id),
  CONSTRAINT maintenanceResults_templateId_fkey FOREIGN KEY (templateId) REFERENCES public.testTemplates(id),
  CONSTRAINT maintenanceResults_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.maintenanceSchedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instrumentId uuid,
  dueDate timestamp with time zone NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  notes text,
  completedDate timestamp with time zone,
  completionNotes text,
  user_id uuid,
  template_id uuid,
  vendorName text,
  vendorContact text,
  maintenanceBy text,
  CONSTRAINT maintenanceSchedules_pkey PRIMARY KEY (id),
  CONSTRAINT maintenanceSchedules_instrumentId_fkey FOREIGN KEY (instrumentId) REFERENCES public.instruments(id),
  CONSTRAINT maintenanceSchedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT maintenanceSchedules_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.testTemplates(id)
);
CREATE TABLE public.maintenanceTypes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  createdAt timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT maintenanceTypes_pkey PRIMARY KEY (id),
  CONSTRAINT maintenanceTypes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.maintenance_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL,
  maintenance_type text NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['Daily'::text, 'Weekly'::text, 'Monthly'::text, '3 Months'::text, '6 Months'::text, '1 Year'::text])),
  schedule_date timestamp with time zone NOT NULL,
  template_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  maintenanceBy text,
  vendorName text,
  vendorContact text,
  CONSTRAINT maintenance_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_configurations_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id),
  CONSTRAINT maintenance_configurations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.testTemplates(id),
  CONSTRAINT maintenance_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.maintenance_documents (
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
  CONSTRAINT maintenance_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT maintenance_documents_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id),
  CONSTRAINT maintenance_documents_maintenance_schedule_id_fkey FOREIGN KEY (maintenance_schedule_id) REFERENCES public.maintenanceSchedules(id)
);
CREATE TABLE public.testTemplates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  createdAt timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT testTemplates_pkey PRIMARY KEY (id),
  CONSTRAINT testTemplates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);