-- Add foreign key constraints to maintenance_documents table
ALTER TABLE public.maintenance_documents
ADD CONSTRAINT maintenance_documents_instrument_id_fkey
FOREIGN KEY (instrument_id) REFERENCES public.instruments(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_documents
ADD CONSTRAINT maintenance_documents_maintenance_schedule_id_fkey
FOREIGN KEY (maintenance_schedule_id) REFERENCES public.maintenanceSchedules(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_documents_schedule
ON public.maintenance_documents(maintenance_schedule_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_documents_instrument
ON public.maintenance_documents(instrument_id);

-- Add document_type column to distinguish main docs from section docs
ALTER TABLE public.maintenance_documents
ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'main'
CHECK (document_type IN ('main', 'section', 'other'));

-- Add section_id for linking section documents
ALTER TABLE public.maintenance_documents
ADD COLUMN IF NOT EXISTS section_id text;

-- Add file_name column to store original file name
ALTER TABLE public.maintenance_documents
ADD COLUMN IF NOT EXISTS file_name text;

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'maintenance_documents'
ORDER BY ordinal_position;
