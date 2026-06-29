-- ==========================================================================
-- Sprint 3 — Compliance Append-Only DB Trigger Verification (pgTAP)
-- ==========================================================================
-- Requires: pgTAP extension + running Postgres (Supabase local).
--
-- Run:
--   psql "$DATABASE_URL" -f tests/compliance/append-only-triggers.pgtest.sql
-- ==========================================================================

BEGIN;
SELECT plan(10);

-- --------------------------------------------------------------------------
-- audit_events
-- --------------------------------------------------------------------------
PREPARE audit_update_blocked AS
  UPDATE audit_events SET summary = 'mutated' WHERE id = (SELECT id FROM audit_events LIMIT 1);

SELECT throws_ok(
  'audit_update_blocked',
  'restrict_violation',
  NULL,
  'UPDATE audit_events must raise restrict_violation'
);

PREPARE audit_delete_blocked AS
  DELETE FROM audit_events WHERE id = (SELECT id FROM audit_events LIMIT 1);

SELECT throws_ok(
  'audit_delete_blocked',
  'restrict_violation',
  NULL,
  'DELETE audit_events must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- policy_evaluations
-- --------------------------------------------------------------------------
PREPARE policy_eval_update_blocked AS
  UPDATE policy_evaluations SET context = '{}'::jsonb WHERE id = (SELECT id FROM policy_evaluations LIMIT 1);

SELECT throws_ok(
  'policy_eval_update_blocked',
  'restrict_violation',
  NULL,
  'UPDATE policy_evaluations must raise restrict_violation'
);

PREPARE policy_eval_delete_blocked AS
  DELETE FROM policy_evaluations WHERE id = (SELECT id FROM policy_evaluations LIMIT 1);

SELECT throws_ok(
  'policy_eval_delete_blocked',
  'restrict_violation',
  NULL,
  'DELETE policy_evaluations must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- trust_events
-- --------------------------------------------------------------------------
PREPARE trust_event_update_blocked AS
  UPDATE trust_events SET description = 'mutated' WHERE id = (SELECT id FROM trust_events LIMIT 1);

SELECT throws_ok(
  'trust_event_update_blocked',
  'restrict_violation',
  NULL,
  'UPDATE trust_events must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- twin_events
-- --------------------------------------------------------------------------
PREPARE twin_event_delete_blocked AS
  DELETE FROM twin_events WHERE id = (SELECT id FROM twin_events LIMIT 1);

SELECT throws_ok(
  'twin_event_delete_blocked',
  'restrict_violation',
  NULL,
  'DELETE twin_events must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- regulatory_submission_events
-- --------------------------------------------------------------------------
PREPARE reg_sub_event_update_blocked AS
  UPDATE regulatory_submission_events SET summary = 'mutated'
  WHERE id = (SELECT id FROM regulatory_submission_events LIMIT 1);

SELECT throws_ok(
  'reg_sub_event_update_blocked',
  'restrict_violation',
  NULL,
  'UPDATE regulatory_submission_events must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- Schema compatibility columns
-- --------------------------------------------------------------------------
SELECT has_column('public', 'policy_evaluations', 'result', 'policy_evaluations has result alias');
SELECT has_column('public', 'policy_evaluations', 'created_at', 'policy_evaluations has created_at alias');
SELECT has_column('public', 'policies', 'policy_type', 'policies has policy_type column');
SELECT has_column('public', 'policies', 'severity', 'policies has severity column');

SELECT * FROM finish();
ROLLBACK;
