-- 00_create_roles.sql
-- Create Supabase roles that don't exist in standalone PostgreSQL image
-- This must run BEFORE the tables are created

-- Create roles if they don't exist
DO $$
BEGIN
    -- anon role (for unauthenticated users)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    -- authenticated role (for logged-in users)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    
    -- service_role (for server-side operations)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
    
    -- supabase_admin (for admin operations)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
    
    -- authenticator (used by PostgREST)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';
        GRANT anon TO authenticator;
        GRANT authenticated TO authenticator;
        GRANT service_role TO authenticator;
    END IF;
    
    -- supabase_auth_admin (for auth schema)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT CREATEROLE CREATEDB;
        GRANT ALL ON DATABASE postgres TO supabase_auth_admin;
    END IF;
    
    -- supabase_storage_admin (for storage)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE ROLE supabase_storage_admin NOLOGIN NOINHERIT;
    END IF;
END
$$;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant auth schema permissions
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, service_role;

SELECT 'Roles created successfully!' as status;
