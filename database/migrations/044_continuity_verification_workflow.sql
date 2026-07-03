-- RC-0.2: kadarn_verified and badge_level retired per ADR-010. 
-- This migration is preserved as historical record only.
-- ==========================================================================
-- Kadarn Continuity — Verification Workflow (Sprint 6)
-- ==========================================================================
-- Adds formal review states, badge levels, and ledger promotion to the
-- continuity_experience_claims workflow.
--
-- Key concepts:
--   Claim = what the site declares.
--   Ledger = what Kadarn accepts as durable memory.
--
-- State machine: draft → submitted → under_review → verified | rejected
-- Badge levels:  self_reported → evidence_backed → reference_confirmed → kadarn_verified
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Badge level enum
-- --------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE continuity_badge_level AS ENUM (
        'self_reported',
        'evidence_backed',
        'reference_confirmed',
        'kadarn_verified'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 2. Add verification columns to claims table
-- --------------------------------------------------------------------------
ALTER TABLE continuity_experience_claims
    ADD COLUMN IF NOT EXISTS badge_level         continuity_badge_level NOT NULL DEFAULT 'self_reported',
    ADD COLUMN IF NOT EXISTS reviewer_id         uuid,
    ADD COLUMN IF NOT EXISTS reviewed_at         timestamptz,
    ADD COLUMN IF NOT EXISTS reviewer_notes      text,
    ADD COLUMN IF NOT EXISTS verification_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz,
    ADD COLUMN IF NOT EXISTS promoted_to_ledger_at   timestamptz;

COMMENT ON COLUMN continuity_experience_claims.badge_level IS 'Computed badge reflecting verification depth';
COMMENT ON COLUMN continuity_experience_claims.verification_history IS 'Audit trail of status changes [{from, to, by, at, note}]';
COMMENT ON COLUMN continuity_experience_claims.promoted_to_ledger_at IS 'When this claim was copied to the durable ledger';

-- --------------------------------------------------------------------------
-- 3. Verification history audit trigger
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION continuity_verification_history_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.verification_history = COALESCE(OLD.verification_history, '[]'::jsonb) || jsonb_build_object(
            'from', OLD.status,
            'to',   NEW.status,
            'by',   NEW.reviewer_id,
            'at',   NOW(),
            'note', NEW.reviewer_notes
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_continuity_verification_history ON continuity_experience_claims;
CREATE TRIGGER trg_continuity_verification_history
    BEFORE UPDATE OF status ON continuity_experience_claims
    FOR EACH ROW
    EXECUTE FUNCTION continuity_verification_history_trigger();

-- --------------------------------------------------------------------------
-- 4. Ledger promotion table (mirrors claims that passed verification)
-- --------------------------------------------------------------------------
ALTER TABLE continuity_experience_ledger
    ADD COLUMN IF NOT EXISTS source_claim_id      uuid REFERENCES continuity_experience_claims(id),
    ADD COLUMN IF NOT EXISTS badge_level           continuity_badge_level NOT NULL DEFAULT 'self_reported',
    ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
    ADD COLUMN IF NOT EXISTS verified_by           uuid;

COMMENT ON COLUMN continuity_experience_ledger.source_claim_id IS 'Claim that generated this ledger entry';
COMMENT ON COLUMN continuity_experience_ledger.badge_level IS 'Badge at time of promotion';

-- --------------------------------------------------------------------------
-- 5. RPC: promote a verified claim to the durable ledger
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION promote_claim_to_ledger(p_claim_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_claim record;
    v_ledger_id uuid;
BEGIN
    SELECT * INTO v_claim FROM continuity_experience_claims WHERE id = p_claim_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim not found: %', p_claim_id;
    END IF;
    IF v_claim.status != 'verified' THEN
        RAISE EXCEPTION 'Claim % must be verified before promotion (status: %)', p_claim_id, v_claim.status;
    END IF;
    IF v_claim.promoted_to_ledger_at IS NOT NULL THEN
        RAISE EXCEPTION 'Claim % already promoted to ledger at %', p_claim_id, v_claim.promoted_to_ledger_at;
    END IF;

    INSERT INTO continuity_experience_ledger (
        site_continuity_profile_id,
        claim_type,
        category,
        title,
        description,
        badge_level,
        therapeutic_area,
        study_phase,
        biospecimen_type,
        start_date,
        end_date,
        quantity,
        is_public,
        sponsor_name_policy,
        masked_sponsor_label,
        source_claim_id,
        verified_at,
        verified_by
    ) VALUES (
        v_claim.site_continuity_profile_id,
        v_claim.claim_type,
        v_claim.category,
        v_claim.title,
        v_claim.description,
        v_claim.badge_level,
        v_claim.therapeutic_area,
        v_claim.study_phase,
        v_claim.biospecimen_type,
        v_claim.start_date,
        v_claim.end_date,
        v_claim.quantity,
        v_claim.is_public,
        v_claim.sponsor_name_policy,
        v_claim.masked_sponsor_label,
        v_claim.id,
        NOW(),
        v_claim.reviewer_id
    ) RETURNING id INTO v_ledger_id;

    UPDATE continuity_experience_claims
    SET promoted_to_ledger_at = NOW()
    WHERE id = p_claim_id;

    RETURN v_ledger_id;
END;
$$;
