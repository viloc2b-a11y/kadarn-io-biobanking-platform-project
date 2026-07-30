// ─── @kadarn/types — barrel re-exports ────────────────────────────────────
// KAD-TYPECHECK-001: re-export all type modules to resolve TS2305 errors.
// All schemas/types are defined in their domain files; this barrel makes
// them accessible via `import { ... } from '@kadarn/types'`.

// Domain types
export * from './person';
export * from './location';
export * from './membership';
export * from './capability';
export * from './claim'
export * from './claim-version';
export * from './confidence';
export * from './review';
export * from './knowledge';
export * from './passport';
export * from './readiness';
export * from './assessment';

// Evidence & sources
export * from './evidence';
export * from './sources';

// Forward-port types (KAD-LOOP-CANONICALIZATION-001)
export * from './events';
export * from './generation-rule';

// Infrastructure types
export * from './errors';
export * from './document-handling';
export * from './feasibility-package';
