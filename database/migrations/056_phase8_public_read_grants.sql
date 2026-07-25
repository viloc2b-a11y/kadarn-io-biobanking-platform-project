-- Phase 8 Sprint 28K — grants for server-side public reads and authenticated discovery routes
-- Made idempotent: wraps GRANT in table-existence checks

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'organizations' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.organizations TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_sessions' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_sessions TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_runs' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_runs TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_artifacts' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_artifacts TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_agent_outputs' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_agent_outputs TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_candidates' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_candidates TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_curation_events' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_curation_events TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'discovery_validation_notes' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.discovery_validation_notes TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'organization_memberships' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.organization_memberships TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'membership_roles' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.membership_roles TO service_role, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'organization_roles' AND relnamespace = 'public'::regnamespace) THEN
        GRANT SELECT ON public.organization_roles TO service_role, authenticated;
    END IF;
END $$;
