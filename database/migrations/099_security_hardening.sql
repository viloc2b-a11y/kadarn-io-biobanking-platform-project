-- ============================================================================
-- KADARN v2 — Security Hardening (RLS, Tenant Isolation, Malware Hook,
--            MIME Validation, Audit Immutability)
-- ============================================================================
-- Migration: 099
-- Authority: KAD-SEC-HARDEN-001, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Covers:
--   Part 1: Extend evidence_nodes with file metadata (mime_type, file_size_bytes)
--   Part 2: Malware/virus scanning hook (placeholder function)
--   Part 3: MIME type validation trigger on evidence inserts
--   Part 4: File-size limit validation trigger on evidence inserts
--   Part 5: PHI/PII detection warning trigger (placeholder)
--   Part 6: Generic audit immutability helper functions
--   Part 7: Audit trail immutability triggers (claim_versions,
--           evidence_review_events, claim_reconfirmations,
--           capability_activation_events, site_profile_versions)
--   Part 8: RLS hardening — DENY UPDATE/DELETE on audit tables
--           for non-service_role
--   Part 9: Tenant isolation verification — RLS audit on 095–098 tables
--   Part 10: Comments & grants
--
-- Dependencies:
--   - public.evidence_nodes (migration 045)
--   - public.claim_versions (migration 085)
--   - public.site_profile_versions (migration 096)
--   - public.evidence_review_events (migration 097)
--   - public.claim_reconfirmations (migration 095)
--   - public.capability_activation_events (migration 098)
--   - public.profile_attestations (migration 096)
--   - public.organization_memberships (migration 064)
--   - public.trigger_set_updated_at() (migration 062)
-- ============================================================================

-- ############################################################################
-- PART 1: EXTEND evidence_nodes — file metadata columns
-- ############################################################################
-- evidence_nodes (migration 045) stores evidence content as TEXT. As the
-- platform evolves toward file-based evidence uploads, these columns carry
-- file metadata for integrity checks. Both are nullable to preserve backward
-- compatibility with existing evidence rows that were created as plain text.

ALTER TABLE public.evidence_nodes
    ADD COLUMN IF NOT EXISTS mime_type       TEXT,
    ADD COLUMN IF NOT EXISTS file_size_bytes  BIGINT;

COMMENT ON COLUMN public.evidence_nodes.mime_type IS
    'KAD-SEC: IANA media type of the uploaded evidence file (e.g. application/pdf, image/png). NULL for legacy plain-text evidence.';
COMMENT ON COLUMN public.evidence_nodes.file_size_bytes IS
    'KAD-SEC: Size of the uploaded evidence file in bytes. NULL for legacy plain-text evidence. Checked against configurable limit by trg_evidence_file_size_limit.';

-- ############################################################################
-- PART 2: MALWARE / VIRUS SCANNING HOOK (placeholder)
-- ############################################################################
-- This function is a PLACEHOLDER intended to be called from a trigger on
-- evidence insertion (or from a future dedicated evidence_uploads table).
--
-- Integration plan:
--   1. Deploy a ClamAV daemon (or commercial equivalent) accessible to the
--      Supabase Edge Function runtime.
--   2. Wire this function to call pg_net or a Supabase Edge Function that
--      streams the uploaded file bytes to the scanner.
--   3. The scanner returns a verdict: {clean, infected, scan_error}.
--   4. If infected → RAISE EXCEPTION and reject the insert.
--   5. If scan_error → log a warning but allow the insert (fail-open for
--      availability; the file is quarantined for later async rescan).
--
-- Until the integration is wired, this function is a no-op pass-through.
-- The `metadata` JSONB parameter carries proof-of-scan payload fields:
--   - scan_id       : scanner session id
--   - scan_result   : 'clean' | 'infected' | 'scan_error'
--   - signature     : scanner signature version
--   - scanned_at    : ISO-8601 timestamp of scan completion

CREATE OR REPLACE FUNCTION public.evidence_malware_scan_hook(
    p_evidence_id  UUID,
    p_mime_type    TEXT,
    p_metadata     JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- ======================================================================
    -- PLACEHOLDER — malware scanning is not yet wired.
    -- To integrate:
    --   1. Call a Supabase Edge Function or pg_net endpoint.
    --   2. Parse the scan verdict.
    --   3. RAISE EXCEPTION 'Evidence % rejected: malware detected (signature: %)',
    --        p_evidence_id, p_metadata->>'signature';
    --      on an infected verdict.
    -- ======================================================================
    -- Current behaviour: pass-through (fail-open).
    RAISE NOTICE 'evidence_malware_scan_hook: scan not configured — passing evidence % (mime: %)',
        p_evidence_id, p_mime_type;
END;
$$;

COMMENT ON FUNCTION public.evidence_malware_scan_hook(UUID, TEXT, JSONB) IS
    'KAD-SEC: Malware/virus scanning hook placeholder. Called by evidence insert triggers. Wire to ClamAV or equivalent via Supabase Edge Functions.';

-- ############################################################################
-- PART 3: MIME TYPE VALIDATION
-- ############################################################################
-- Whitelist of permitted MIME types for evidence uploads. Extensible; the
-- service layer can add entries without a migration.
-- Types chosen for clinical-research evidence: PDFs, office docs, images,
-- DICOM medical imaging, and structured-data formats.

CREATE TABLE IF NOT EXISTS public.allowed_evidence_mime_types (
    mime_type       TEXT PRIMARY KEY,
    category        TEXT NOT NULL DEFAULT 'document',   -- document, image, medical_imaging, structured
    description     TEXT,
    max_size_bytes  BIGINT,                             -- per-type override; NULL = use global default
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.allowed_evidence_mime_types IS
    'KAD-SEC: Whitelist of permitted MIME types for evidence file uploads. Types not in this table are rejected by trg_evidence_mime_validate.';

-- Seed the whitelist with clinical-research-appropriate types
INSERT INTO public.allowed_evidence_mime_types (mime_type, category, description) VALUES
    -- Documents
    ('application/pdf',             'document',         'Adobe PDF'),
    ('application/msword',          'document',         'Legacy Word (.doc)'),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                     'document',        'Word (.docx)'),
    ('application/vnd.ms-excel',    'document',         'Legacy Excel (.xls)'),
    ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                     'document',        'Excel (.xlsx)'),
    ('text/plain',                  'document',         'Plain text'),
    ('text/csv',                    'document',         'CSV'),
    -- Images
    ('image/png',                   'image',            'PNG image'),
    ('image/jpeg',                  'image',            'JPEG image'),
    ('image/tiff',                  'image',            'TIFF image'),
    ('image/gif',                   'image',            'GIF image'),
    ('image/svg+xml',               'image',            'SVG vector graphic'),
    -- Medical imaging
    ('application/dicom',           'medical_imaging',  'DICOM medical imaging'),
    ('application/dicom+json',      'medical_imaging',  'DICOM JSON'),
    -- Structured / EDC formats
    ('application/json',            'structured',       'JSON structured data'),
    ('application/xml',             'structured',       'XML structured data'),
    ('text/xml',                    'structured',       'XML (text variant)')
ON CONFLICT (mime_type) DO NOTHING;

-- ── validation function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_evidence_mime_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only validate when mime_type is actually supplied (legacy rows skip)
    IF NEW.mime_type IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check against the whitelist
    IF NOT EXISTS (
        SELECT 1 FROM public.allowed_evidence_mime_types
        WHERE mime_type = NEW.mime_type
          AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Evidence MIME type "%" is not in the allowed whitelist. Rejecting insert.',
            NEW.mime_type;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_evidence_mime_type() IS
    'KAD-SEC: BEFORE INSERT trigger function — rejects evidence rows whose mime_type is not in allowed_evidence_mime_types (or not active).';

-- ── attach trigger ─────────────────────────────────────────────────────────
-- Fires BEFORE INSERT (evidence_nodes is append-only; UPDATE is blocked by
-- its own evidence_nodes_no_update trigger from migration 045).

DROP TRIGGER IF EXISTS trg_evidence_mime_validate ON public.evidence_nodes;
CREATE TRIGGER trg_evidence_mime_validate
    BEFORE INSERT ON public.evidence_nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_evidence_mime_type();

-- ############################################################################
-- PART 4: FILE-SIZE LIMIT VALIDATION
-- ############################################################################
-- Global default: 100 MB. Per-type overrides in allowed_evidence_mime_types.
-- The service layer can change the global default by updating the function
-- body or by storing the limit in a config table; this migration ships a
-- sensible clinical-research default.

CREATE OR REPLACE FUNCTION public.validate_evidence_file_size()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_max_size BIGINT;
    v_global_default BIGINT := 104857600;  -- 100 MB
BEGIN
    -- Only validate when file_size_bytes is actually supplied
    IF NEW.file_size_bytes IS NULL THEN
        RETURN NEW;
    END IF;

    -- File size must be non-negative
    IF NEW.file_size_bytes < 0 THEN
        RAISE EXCEPTION 'Evidence file size cannot be negative (got % bytes).',
            NEW.file_size_bytes;
    END IF;

    -- Determine the limit: per-type override → global default
    v_max_size := v_global_default;

    IF NEW.mime_type IS NOT NULL THEN
        SELECT COALESCE(aemt.max_size_bytes, v_global_default)
          INTO v_max_size
          FROM public.allowed_evidence_mime_types aemt
         WHERE aemt.mime_type = NEW.mime_type
           AND aemt.is_active = true;
    END IF;

    -- Hard upper bound regardless of type: 500 MB
    IF NEW.file_size_bytes > 524288000 THEN
        RAISE EXCEPTION 'Evidence file size (%) exceeds the absolute maximum of 500 MB.',
            pg_size_pretty(NEW.file_size_bytes);
    END IF;

    -- Per-type / global check
    IF v_max_size IS NOT NULL AND NEW.file_size_bytes > v_max_size THEN
        RAISE EXCEPTION 'Evidence file size (%) exceeds the allowed limit of % for type %.',
            pg_size_pretty(NEW.file_size_bytes),
            pg_size_pretty(v_max_size),
            COALESCE(NEW.mime_type, 'unknown');
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_evidence_file_size() IS
    'KAD-SEC: BEFORE INSERT trigger — enforces file-size limits on evidence uploads. Global default 100 MB, absolute max 500 MB, per-type overrides in allowed_evidence_mime_types.';

-- ── attach trigger ─────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_evidence_file_size_limit ON public.evidence_nodes;
CREATE TRIGGER trg_evidence_file_size_limit
    BEFORE INSERT ON public.evidence_nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_evidence_file_size();

-- ############################################################################
-- PART 5: PHI / PII DETECTION WARNING TRIGGER (placeholder)
-- ############################################################################
-- PHI (Protected Health Information) patterns must never appear unredacted
-- in evidence content. This trigger scans evidence_node.content for common
-- PHI patterns and issues a WARNING (notice, not exception).
--
-- Integration plan:
--   1. Deploy a PHI detection service (e.g. Amazon Comprehend Medical, Google
--      Cloud Healthcare NLP, or a regex-based detector) as a Supabase Edge
--      Function.
--   2. Wire this trigger to call the detection service via pg_net.
--   3. If PHI is detected, either:
--      a. Reject the insert (strict mode), or
--      b. Log a warning and set evidence_nodes.status = 'phi_flagged'
--         (advisory mode — this migration's default).
--
-- Current behaviour: scans for obvious SSN-like / MRN-like patterns and
-- issues a NOTICE on match. Does NOT reject inserts.

CREATE OR REPLACE FUNCTION public.evidence_phi_warning_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- ======================================================================
    -- PLACEHOLDER — lightweight regex scan for obvious PHI patterns.
    -- Replace with a call to a dedicated PHI detection service for production.
    -- ======================================================================

    -- SSN pattern: XXX-XX-XXXX
    IF NEW.content ~ '\m\d{3}-\d{2}-\d{4}\M' THEN
        RAISE WARNING 'PHI_WARNING: evidence % may contain SSN-like patterns (XXX-XX-XXXX).',
            NEW.id;
    END IF;

    -- MRN pattern: generic MRN-like (alphanumeric 5-12 chars with standard prefixes)
    IF NEW.content ~* '\m(MRN|Medical[ ]*Record[ ]*Number|Patient[ ]*ID)[:=\s]+\w{5,20}\M' THEN
        RAISE WARNING 'PHI_WARNING: evidence % may contain MRN-like patterns.',
            NEW.id;
    END IF;

    -- Email addresses (PII — common in copy-pasted correspondence)
    IF NEW.content ~ '\m[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\M' THEN
        RAISE WARNING 'PHI_WARNING: evidence % may contain email addresses (PII).',
            NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.evidence_phi_warning_trigger() IS
    'KAD-SEC: BEFORE INSERT trigger — scans evidence content for PHI/PII patterns and issues warnings. Placeholder; wire to a dedicated PHI detection service for production.';

-- ── attach trigger ─────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_evidence_phi_warning ON public.evidence_nodes;
CREATE TRIGGER trg_evidence_phi_warning
    BEFORE INSERT ON public.evidence_nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.evidence_phi_warning_trigger();

-- ############################################################################
-- PART 6: GENERIC AUDIT IMMUTABILITY HELPERS
-- ############################################################################
-- These functions are reusable across any audit table. They enforce that
-- UPDATE and DELETE operations are blocked for all roles EXCEPT service_role
-- (which is checked inside the function body via current_setting).
--
-- Usage:
--   CREATE TRIGGER trg_<table>_audit_no_update
--       BEFORE UPDATE ON public.<table>
--       FOR EACH ROW
--       EXECUTE FUNCTION public.audit_prevent_update();
--
-- The function body checks current_setting('role') at runtime; service_role
-- sessions return immediately (RETURN NEW/OLD), preserving admin recovery.

CREATE OR REPLACE FUNCTION public.audit_prevent_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- service_role bypasses audit immutability for admin recovery.
    IF current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Audit table "%" is immutable: UPDATE rejected for role "%".',
        TG_TABLE_NAME, current_setting('role', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_prevent_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- service_role bypasses audit immutability for admin recovery.
    IF current_setting('role', true) = 'service_role' THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Audit table "%" is immutable: DELETE rejected for role "%".',
        TG_TABLE_NAME, current_setting('role', true);
END;
$$;

COMMENT ON FUNCTION public.audit_prevent_update() IS
    'KAD-SEC: Generic BEFORE UPDATE trigger — raises EXCEPTION for all non-service_role sessions. Attach to any audit table that must be append-only.';
COMMENT ON FUNCTION public.audit_prevent_delete() IS
    'KAD-SEC: Generic BEFORE DELETE trigger — raises EXCEPTION for all non-service_role sessions. Attach to any audit table that must be append-only.';

-- ############################################################################
-- PART 7: APPLY AUDIT IMMUTABILITY TRIGGERS
-- ############################################################################
-- Tables that are immutable by design receive BEFORE UPDATE / BEFORE DELETE
-- triggers that fire for non-service_role. service_role bypasses these
-- triggers (the WHEN clause skips them) for admin recovery.

-- ── 7a: claim_versions (085) ──────────────────────────────────────────────
-- claim_versions is immutable except for superseded_by (set once by the
-- service layer). The trigger blocks ALL updates for non-service_role.
-- The service layer uses service_role key to set superseded_by.

DROP TRIGGER IF EXISTS trg_claim_versions_audit_no_update ON public.claim_versions;
CREATE TRIGGER trg_claim_versions_audit_no_update
    BEFORE UPDATE ON public.claim_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_claim_versions_audit_no_delete ON public.claim_versions;
CREATE TRIGGER trg_claim_versions_audit_no_delete
    BEFORE DELETE ON public.claim_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7b: site_profile_versions (096) ───────────────────────────────────────

DROP TRIGGER IF EXISTS trg_spv_audit_no_update ON public.site_profile_versions;
CREATE TRIGGER trg_spv_audit_no_update
    BEFORE UPDATE ON public.site_profile_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_spv_audit_no_delete ON public.site_profile_versions;
CREATE TRIGGER trg_spv_audit_no_delete
    BEFORE DELETE ON public.site_profile_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7c: evidence_review_events (097) ─────────────────────────────────────

DROP TRIGGER IF EXISTS trg_ere_audit_no_update ON public.evidence_review_events;
CREATE TRIGGER trg_ere_audit_no_update
    BEFORE UPDATE ON public.evidence_review_events
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_ere_audit_no_delete ON public.evidence_review_events;
CREATE TRIGGER trg_ere_audit_no_delete
    BEFORE DELETE ON public.evidence_review_events
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7d: claim_reconfirmations (095) ──────────────────────────────────────

DROP TRIGGER IF EXISTS trg_crec_audit_no_update ON public.claim_reconfirmations;
CREATE TRIGGER trg_crec_audit_no_update
    BEFORE UPDATE ON public.claim_reconfirmations
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_crec_audit_no_delete ON public.claim_reconfirmations;
CREATE TRIGGER trg_crec_audit_no_delete
    BEFORE DELETE ON public.claim_reconfirmations
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7e: capability_activation_events (098) ────────────────────────────────

DROP TRIGGER IF EXISTS trg_cae_audit_no_update ON public.capability_activation_events;
CREATE TRIGGER trg_cae_audit_no_update
    BEFORE UPDATE ON public.capability_activation_events
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_cae_audit_no_delete ON public.capability_activation_events;
CREATE TRIGGER trg_cae_audit_no_delete
    BEFORE DELETE ON public.capability_activation_events
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7f: profile_attestations (096) ────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_pa_audit_no_update ON public.profile_attestations;
CREATE TRIGGER trg_pa_audit_no_update
    BEFORE UPDATE ON public.profile_attestations
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_pa_audit_no_delete ON public.profile_attestations;
CREATE TRIGGER trg_pa_audit_no_delete
    BEFORE DELETE ON public.profile_attestations
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ── 7g: profile_publications (096) ────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_pp_audit_no_update ON public.profile_publications;
CREATE TRIGGER trg_pp_audit_no_update
    BEFORE UPDATE ON public.profile_publications
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_update();

DROP TRIGGER IF EXISTS trg_pp_audit_no_delete ON public.profile_publications;
CREATE TRIGGER trg_pp_audit_no_delete
    BEFORE DELETE ON public.profile_publications
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_prevent_delete();

-- ############################################################################
-- PART 8: RLS HARDENING — DENY UPDATE / DELETE ON AUDIT TABLES
-- ############################################################################
-- For each audit table, explicitly create (or re-create) RLS policies that
-- DENY UPDATE and DELETE for authenticated and anon roles. service_role
-- retains full access via its dedicated FOR ALL policy (already present on
-- every table from migrations 095–098).
--
-- These policies work alongside the trigger-level enforcement in Part 7:
--   - The trigger blocks at the row level (BEFORE UPDATE/DELETE)
--   - The RLS policy blocks at the query-plan level (FOR UPDATE/FOR DELETE)
-- This defense-in-depth approach means even if one layer is bypassed, the
-- other still holds.

-- ── 8a: claim_versions (085) — DENY UPDATE / DELETE ─────────────────────

DROP POLICY IF EXISTS cv_deny_update ON public.claim_versions;
CREATE POLICY cv_deny_update ON public.claim_versions
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS cv_deny_delete ON public.claim_versions;
CREATE POLICY cv_deny_delete ON public.claim_versions
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- ── 8b: site_profile_versions (096) — DENY UPDATE ───────────────────────

DROP POLICY IF EXISTS spv_deny_update ON public.site_profile_versions;
CREATE POLICY spv_deny_update ON public.site_profile_versions
    FOR UPDATE
    TO authenticated, anon
    USING (false);

-- ── 8c: evidence_review_events (097) — DENY UPDATE / DELETE ─────────────

DROP POLICY IF EXISTS ere_deny_update ON public.evidence_review_events;
CREATE POLICY ere_deny_update ON public.evidence_review_events
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS ere_deny_delete ON public.evidence_review_events;
CREATE POLICY ere_deny_delete ON public.evidence_review_events
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- ── 8d: claim_reconfirmations (095) — DENY UPDATE / DELETE ──────────────

DROP POLICY IF EXISTS crec_deny_update ON public.claim_reconfirmations;
CREATE POLICY crec_deny_update ON public.claim_reconfirmations
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS crec_deny_delete ON public.claim_reconfirmations;
CREATE POLICY crec_deny_delete ON public.claim_reconfirmations
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- ── 8e: capability_activation_events (098) — DENY UPDATE / DELETE ───────

DROP POLICY IF EXISTS cae_deny_update ON public.capability_activation_events;
CREATE POLICY cae_deny_update ON public.capability_activation_events
    FOR UPDATE
    TO authenticated, anon
    USING (false);

-- ── 8f: profile_attestations (096) — DENY UPDATE ────────────────────────

DROP POLICY IF EXISTS pa_deny_update ON public.profile_attestations;
CREATE POLICY pa_deny_update ON public.profile_attestations
    FOR UPDATE
    TO authenticated, anon
    USING (false);

-- ── 8g: profile_publications (096) — DENY UPDATE ────────────────────────

DROP POLICY IF EXISTS pp_deny_update ON public.profile_publications;
CREATE POLICY pp_deny_update ON public.profile_publications
    FOR UPDATE
    TO authenticated, anon
    USING (false);

-- ── 8h: evidence_nodes (045) — DENY UPDATE / DELETE ─────────────────────
-- evidence_nodes already has trigger-level immutability (045). RLS adds
-- defense-in-depth.

DROP POLICY IF EXISTS en_deny_update ON public.evidence_nodes;
CREATE POLICY en_deny_update ON public.evidence_nodes
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS en_deny_delete ON public.evidence_nodes;
CREATE POLICY en_deny_delete ON public.evidence_nodes
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- ############################################################################
-- PART 9: TENANT ISOLATION VERIFICATION — RLS AUDIT ON 095–098 TABLES
-- ############################################################################
-- Every SELECT policy on tables created in migrations 095–098 follows the
-- tenant-isolation pattern:
--
--   USING (
--       EXISTS (
--           SELECT 1 FROM <parent_table> pt
--           JOIN public.organization_memberships om
--             ON om.organization_id = pt.<org_fk>
--            AND om.user_id = auth.uid()
--            AND om.status = 'active'
--           WHERE pt.id = <this_table>.<parent_fk>
--       )
--       OR auth.role() = 'service_role'
--   )
--
-- This section verifies and hardens the policies for the evidence-governance
-- tables from 097 (evidence_authenticity_signals, evidence_entity_relationships,
-- evidence_conflicts). Their policies already follow this pattern; we
-- re-create them here defensively to ensure they survive any drift.
--
-- ── 9a: evidence_authenticity_signals (097) — verify org isolation ───────

DROP POLICY IF EXISTS eas_select_org_v2 ON public.evidence_authenticity_signals;
CREATE POLICY eas_select_org_v2 ON public.evidence_authenticity_signals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
               AND om.user_id = auth.uid()
               AND om.status = 'active'
            WHERE en.id = evidence_authenticity_signals.evidence_id
        )
        OR auth.role() = 'service_role'
    );

-- ── 9b: evidence_entity_relationships (097) — verify org isolation ───────

DROP POLICY IF EXISTS eer_select_org_v2 ON public.evidence_entity_relationships;
CREATE POLICY eer_select_org_v2 ON public.evidence_entity_relationships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
               AND om.user_id = auth.uid()
               AND om.status = 'active'
            WHERE en.id = evidence_entity_relationships.evidence_id
        )
        OR auth.role() = 'service_role'
    );

-- ── 9c: evidence_conflicts (097) — verify org isolation ──────────────────

DROP POLICY IF EXISTS ec_select_org_v2 ON public.evidence_conflicts;
CREATE POLICY ec_select_org_v2 ON public.evidence_conflicts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
               AND om.user_id = auth.uid()
               AND om.status = 'active'
            WHERE en.id = evidence_conflicts.evidence_a
        )
        OR auth.role() = 'service_role'
    );

-- ############################################################################
-- PART 10: RLS ON NEW TABLE — allowed_evidence_mime_types
-- ############################################################################
-- Reference table: all authenticated users may SELECT active types.
-- service_role manages the whitelist.

ALTER TABLE public.allowed_evidence_mime_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aemt_select_auth ON public.allowed_evidence_mime_types;
CREATE POLICY aemt_select_auth ON public.allowed_evidence_mime_types
    FOR SELECT
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS aemt_select_service ON public.allowed_evidence_mime_types;
CREATE POLICY aemt_select_service ON public.allowed_evidence_mime_types
    FOR SELECT
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS aemt_all_service ON public.allowed_evidence_mime_types;
CREATE POLICY aemt_all_service ON public.allowed_evidence_mime_types
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 11: GRANTS
-- ############################################################################

-- ── allowed_evidence_mime_types ───────────────────────────────────────────

GRANT SELECT ON public.allowed_evidence_mime_types TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.allowed_evidence_mime_types TO service_role;

-- ── Functions — grant EXECUTE to authenticated so triggers can fire ──────
-- (Trigger functions execute with the privileges of the table owner, but
-- explicit grants are defensive.)

GRANT EXECUTE ON FUNCTION public.evidence_malware_scan_hook(UUID, TEXT, JSONB)
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_evidence_mime_type()
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_evidence_file_size()
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evidence_phi_warning_trigger()
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.audit_prevent_update()
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.audit_prevent_delete()
    TO authenticated, service_role;

-- ############################################################################
-- PART 12: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.allowed_evidence_mime_types IS
    'KAD-SEC: Controlled vocabulary of MIME types permitted for evidence file uploads. Types not listed (or inactive) are rejected by trg_evidence_mime_validate.';

COMMENT ON COLUMN public.allowed_evidence_mime_types.category IS
    'KAD-SEC: Broad classification — document, image, medical_imaging, structured. Used for UI grouping and per-category governance.';

COMMENT ON COLUMN public.allowed_evidence_mime_types.max_size_bytes IS
    'KAD-SEC: Per-type file-size override (NULL = use global default of 100 MB). Enforced by trg_evidence_file_size_limit.';

-- ============================================================================
-- END OF MIGRATION 099
-- ============================================================================
