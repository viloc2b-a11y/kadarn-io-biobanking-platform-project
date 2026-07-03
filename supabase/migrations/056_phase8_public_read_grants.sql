-- Phase 8 Sprint 28K — grants for server-side public reads and authenticated discovery routes

GRANT SELECT ON public.organizations TO service_role, authenticated;
GRANT SELECT ON public.discovery_sessions TO service_role, authenticated;
GRANT SELECT ON public.discovery_runs TO service_role, authenticated;
GRANT SELECT ON public.discovery_artifacts TO service_role, authenticated;
GRANT SELECT ON public.discovery_agent_outputs TO service_role, authenticated;
GRANT SELECT ON public.discovery_candidates TO service_role, authenticated;
GRANT SELECT ON public.discovery_curation_events TO service_role, authenticated;
GRANT SELECT ON public.discovery_validation_notes TO service_role, authenticated;
GRANT SELECT ON public.organization_memberships TO service_role, authenticated;
GRANT SELECT ON public.membership_roles TO service_role, authenticated;
GRANT SELECT ON public.organization_roles TO service_role, authenticated;
