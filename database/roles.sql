-- Run as a PostgreSQL administrator in the ssrms database.
-- These are NOLOGIN privilege roles for direct SQL demonstrations, not web-app accounts.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ssrms_admin') THEN
    CREATE ROLE ssrms_admin NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ssrms_lecturer') THEN
    CREATE ROLE ssrms_lecturer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ssrms_viewer') THEN
    CREATE ROLE ssrms_viewer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ssrms_app') THEN
    CREATE ROLE ssrms_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ssrms_migrator') THEN
    CREATE ROLE ssrms_migrator LOGIN;
  END IF;
END
$$;

-- Set login passwords interactively with \password ssrms_app and \password ssrms_migrator.
GRANT CONNECT ON DATABASE ssrms TO ssrms_admin, ssrms_lecturer, ssrms_viewer, ssrms_app, ssrms_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO ssrms_migrator;
