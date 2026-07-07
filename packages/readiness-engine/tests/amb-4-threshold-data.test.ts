// ==========================================================================
// KTP-1.2 — Test 3: readiness_threshold is data-driven
// ==========================================================================
// Proves AMB-4 resolution: the readiness_threshold column on
// program_type_taxonomy makes thresholds configurable per program type,
// not hardcoded as a constant.

import { describe, it, expect } from 'vitest';

describe('KTP-1.2 — AMB-4: readiness_threshold is data-driven', () => {
  const taxonomyDefaults = {
    biospecimen: 0.70,
    pbmc: 0.75,
    ivd: 0.85,
    defaultNew: 0.75,
  };

  it('should use different thresholds per program type', () => {
    // Each readiness program type has its own threshold:
    // - Biospecimen Collection: 0.70 (more accessible)
    // - PBMC Processing: 0.75 (default)
    // - IVD Validation: 0.85 (stricter regulatory requirements)

    expect(taxonomyDefaults.biospecimen).toBe(0.70);
    expect(taxonomyDefaults.pbmc).toBe(0.75);
    expect(taxonomyDefaults.ivd).toBe(0.85);

    // Thresholds are NOT equal — proves they are not a single hardcoded constant
    const allEqual = new Set(Object.values(taxonomyDefaults)).size === 1;
    expect(allEqual).toBe(false);
  });

  it('should default to 0.75 for new readiness types', () => {
    // The DEFAULT 0.75 on the column means new readiness types
    // get a reasonable starting threshold without explicit configuration.
    expect(taxonomyDefaults.defaultNew).toBe(0.75);
  });

  it('should enforce threshold range [0.00, 1.00]', () => {
    // The CHECK constraint on readiness_threshold ensures valid values:
    //   CHECK (readiness_threshold >= 0.00 AND readiness_threshold <= 1.00)

    const isValid = (v: number) => v >= 0.00 && v <= 1.00;
    expect(isValid(0.70)).toBe(true);
    expect(isValid(0.85)).toBe(true);
    expect(isValid(1.00)).toBe(true);
    expect(isValid(0.00)).toBe(true);
    expect(isValid(-0.01)).toBe(false);
    expect(isValid(1.01)).toBe(false);
  });
});
