START TRANSACTION;

-- Record that we're applying migrations 045-055 manually as an incremental upgrade
-- This is a one-time operation on the existing local database

DO $$ BEGIN
    -- Check if evidence_core schema already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'evidence_core') THEN
        -- Apply migration 045
        -- (will be done in separate steps)
    END IF;
END $$;

COMMIT;
