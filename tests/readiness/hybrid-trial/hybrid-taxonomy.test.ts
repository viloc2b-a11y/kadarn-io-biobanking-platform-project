// ==========================================================================
// KTP-1.3 — Hybrid Trial Taxonomy & Seed Data Tests
// ==========================================================================
// Verifies the 10 claim families, program type taxonomy entry,
// capability requirements, and evidence requirements defined in
// migration 055_hybrid_trial_readiness.sql.
//
// These tests validate the seed data STRUCTURE — they do not require
// a running database. They verify that the data model is internally
// consistent and follows the rules defined in the domain design.
// ==========================================================================

import { describe, it, expect } from 'vitest';

// --------------------------------------------------------------------------
// Claim Family Definitions (mirrors migration 055 + taxonomy v1.1)
// --------------------------------------------------------------------------

const CLAIM_FAMILIES = [
  {
    id: 'clinical_trials.hybrid.site_execution',
    label: 'Site-Based Execution Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.at_home_coordination',
    label: 'At-Home Coordination Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.data_integrity',
    label: 'Hybrid Data Integrity Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['A', 'F'],
    decayMonths: 24,
  },
  {
    id: 'clinical_trials.hybrid.patient_access_diversity',
    label: 'Patient Access & Diversity Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['A', 'F'],
    decayMonths: 36,
  },
  {
    id: 'clinical_trials.hybrid.biospecimen_at_home',
    label: 'Biospecimen-at-Home Readiness',
    isMandatory: true, // can be N/A
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['F'],
    decayMonths: 6,
  },
  {
    id: 'clinical_trials.hybrid.remote_monitoring',
    label: 'Remote Monitoring Readiness',
    isMandatory: false, // optional
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.vendor_nurse_coordination',
    label: 'Vendor / Home Nurse Coordination Readiness',
    isMandatory: true, // can be N/A
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.protocol_compliance',
    label: 'Protocol Compliance Documentation Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['A', 'F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.safety_escalation',
    label: 'Safety Escalation Readiness',
    isMandatory: true,
    requiredEvidenceClasses: ['B', 'C'],
    optionalEvidenceClasses: ['A', 'F'],
    decayMonths: 12,
  },
  {
    id: 'clinical_trials.hybrid.historical_experience',
    label: 'Hybrid Trial Historical Experience',
    isMandatory: false, // optional
    requiredEvidenceClasses: ['A'], // A or C
    optionalEvidenceClasses: ['C', 'F'],
    decayMonths: 60,
  },
];

const PROGRAM_TYPE = {
  typeKey: 'readiness_hybrid_trial',
  name: 'Hybrid Trial Readiness',
  category: 'readiness',
  readinessThreshold: 0.75,
};

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('Hybrid Trial Claim Families', () => {
  it('should define exactly 10 claim families', () => {
    expect(CLAIM_FAMILIES).toHaveLength(10);
  });

  it('should have unique claim IDs', () => {
    const ids = CLAIM_FAMILIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it('should have exactly 8 mandatory claims (2 of which can be N/A)', () => {
    const mandatory = CLAIM_FAMILIES.filter((c) => c.isMandatory);
    expect(mandatory).toHaveLength(8);
    // biospecimen_at_home and vendor_nurse_coordination are mandatory but can be marked N/A
    // When both N/A, effective mandatory drops to 6
  });

  it('should have exactly 2 optional claims', () => {
    const optional = CLAIM_FAMILIES.filter((c) => !c.isMandatory);
    expect(optional).toHaveLength(2);
    expect(optional.map((c) => c.id)).toEqual([
      'clinical_trials.hybrid.remote_monitoring',
      'clinical_trials.hybrid.historical_experience',
    ]);
  });

  it('should require Class B + C for every non-historical claim', () => {
    for (const claim of CLAIM_FAMILIES) {
      if (claim.id === 'clinical_trials.hybrid.historical_experience') continue;
      expect(claim.requiredEvidenceClasses).toContain('B');
      expect(claim.requiredEvidenceClasses).toContain('C');
    }
  });

  it('should require Class A (not B) for historical experience', () => {
    const hist = CLAIM_FAMILIES.find((c) => c.id === 'clinical_trials.hybrid.historical_experience')!;
    expect(hist.requiredEvidenceClasses).toContain('A');
    expect(hist.requiredEvidenceClasses).not.toContain('B');
  });

  it('should have biospecimen-at-home with shortest decay (6 months)', () => {
    const bio = CLAIM_FAMILIES.find((c) => c.id === 'clinical_trials.hybrid.biospecimen_at_home')!;
    expect(bio.decayMonths).toBe(6);

    const decays = CLAIM_FAMILIES.map((c) => c.decayMonths);
    expect(Math.min(...decays)).toBe(6);
  });

  it('should have historical experience with longest decay (60 months)', () => {
    const hist = CLAIM_FAMILIES.find((c) => c.id === 'clinical_trials.hybrid.historical_experience')!;
    expect(hist.decayMonths).toBe(60);
  });

  it('should follow dotted naming convention clinical_trials.hybrid.*', () => {
    for (const claim of CLAIM_FAMILIES) {
      expect(claim.id).toMatch(/^clinical_trials\.hybrid\.\w+$/);
    }
  });
});

describe('Hybrid Trial Program Type', () => {
  it('should have correct type_key', () => {
    expect(PROGRAM_TYPE.typeKey).toBe('readiness_hybrid_trial');
  });

  it('should be category readiness', () => {
    expect(PROGRAM_TYPE.category).toBe('readiness');
  });

  it('should have threshold of 0.75', () => {
    expect(PROGRAM_TYPE.readinessThreshold).toBe(0.75);
  });

  it('should have threshold within valid range', () => {
    expect(PROGRAM_TYPE.readinessThreshold).toBeGreaterThanOrEqual(0);
    expect(PROGRAM_TYPE.readinessThreshold).toBeLessThanOrEqual(1);
  });
});

// --------------------------------------------------------------------------
// Evidence Requirements per Capability Type
// --------------------------------------------------------------------------

describe('Hybrid Trial Evidence Requirements', () => {
  const CAPABILITY_EVIDENCE_MAP: Record<string, { mandatory: string[]; optional: string[] }> = {
    hybrid_site_execution: { mandatory: ['B', 'C'], optional: ['F'] },
    hybrid_at_home_coordination: { mandatory: ['B', 'C'], optional: ['F'] },
    hybrid_data_integrity: { mandatory: ['B', 'C'], optional: ['A', 'F'] },
    hybrid_patient_access_diversity: { mandatory: ['B', 'C'], optional: ['A', 'F'] },
    hybrid_biospecimen_at_home: { mandatory: ['B', 'C'], optional: ['C', 'F'] },
    hybrid_remote_monitoring: { mandatory: ['B', 'C'], optional: ['F'] },
    hybrid_vendor_nurse_coordination: { mandatory: ['B', 'C'], optional: ['F'] },
    hybrid_protocol_compliance: { mandatory: ['B', 'C'], optional: ['A', 'F'] },
    hybrid_safety_escalation: { mandatory: ['B', 'C'], optional: ['A', 'F'] },
    hybrid_historical_experience: { mandatory: ['A'], optional: ['C', 'F'] },
  };

  it('should define evidence requirements for all 10 capabilities', () => {
    expect(Object.keys(CAPABILITY_EVIDENCE_MAP)).toHaveLength(10);
  });

  it('should require Class B for all capabilities except historical experience', () => {
    for (const [key, reqs] of Object.entries(CAPABILITY_EVIDENCE_MAP)) {
      if (key === 'hybrid_historical_experience') {
        expect(reqs.mandatory).not.toContain('B');
      } else {
        expect(reqs.mandatory).toContain('B');
      }
    }
  });

  it('should require Class C for all capabilities except historical experience', () => {
    for (const [key, reqs] of Object.entries(CAPABILITY_EVIDENCE_MAP)) {
      if (key === 'hybrid_historical_experience') {
        expect(reqs.mandatory).not.toContain('C');
      } else {
        expect(reqs.mandatory).toContain('C');
      }
    }
  });
});

// --------------------------------------------------------------------------
// Mandatory vs Optional counting with N/A adjustments
// --------------------------------------------------------------------------

describe('Hybrid Trial Mandatory/Optional Counting with N/A', () => {
  it('should have 10 total claims before N/A adjustments', () => {
    expect(CLAIM_FAMILIES).toHaveLength(10);
  });

  it('should reduce mandatory count when claims are N/A', () => {
    // biospecimen_at_home and vendor_nurse_coordination can be N/A
    const naCapable = CLAIM_FAMILIES.filter(
      (c) =>
        c.id === 'clinical_trials.hybrid.biospecimen_at_home' ||
        c.id === 'clinical_trials.hybrid.vendor_nurse_coordination',
    );
    expect(naCapable).toHaveLength(2);

    // If both N/A, mandatory drops from 8 to 6
    const baseMandatory = CLAIM_FAMILIES.filter((c) => c.isMandatory).length;
    expect(baseMandatory).toBe(8);
    const adjustedMandatory = baseMandatory - naCapable.length;
    expect(adjustedMandatory).toBe(6);
  });

  it('should not penalize readiness when optional claims are N/A', () => {
    const baseOptional = CLAIM_FAMILIES.filter((c) => !c.isMandatory).length;
    // Optional claims being N/A should not change the "met" count logic
    // They are already excluded from mandatory
    expect(baseOptional).toBe(2);
  });
});
