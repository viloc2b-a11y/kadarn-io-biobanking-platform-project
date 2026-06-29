import { describe, expect, it } from 'vitest';
import {
  assertNoPhiPayload,
  calculateClaimConfidence,
  canDisplayClaimOnPassport,
} from '../../apps/api/src/lib/continuity-claim-service';

describe('Continuity claim service', () => {
  it('calculates deterministic confidence scores', () => {
    expect(calculateClaimConfidence({ status: 'self_reported' })).toBe(25);
    expect(calculateClaimConfidence({ status: 'evidence_submitted' })).toBe(50);
    expect(calculateClaimConfidence({ status: 'reference_pending' })).toBe(60);
    expect(calculateClaimConfidence({ status: 'reference_confirmed' })).toBe(80);
    expect(calculateClaimConfidence({ status: 'kadarn_verified' })).toBe(95);
    expect(calculateClaimConfidence({ status: 'rejected' })).toBe(0);
    expect(calculateClaimConfidence({ status: 'expired' })).toBe(30);
  });

  it('allows evidence plus confirmed reference to rank above ordinary reference confirmation', () => {
    expect(calculateClaimConfidence({
      status: 'reference_confirmed',
      evidenceCount: 2,
      confirmedReferenceCount: 1,
    })).toBe(90);
  });

  it('keeps rejected claims out of Site Passport display', () => {
    expect(canDisplayClaimOnPassport({ is_public: true, verification_status: 'rejected' })).toBe(false);
    expect(canDisplayClaimOnPassport({ is_public: false, verification_status: 'kadarn_verified' })).toBe(false);
    expect(canDisplayClaimOnPassport({ is_public: true, verification_status: 'reference_confirmed' })).toBe(true);
  });

  it('does not treat self-reported claims as Kadarn verified', () => {
    expect(calculateClaimConfidence({ status: 'self_reported' })).toBeLessThan(
      calculateClaimConfidence({ status: 'kadarn_verified' }),
    );
  });

  it('rejects obvious PHI fields and markers', () => {
    expect(() => assertNoPhiPayload({ donor_id: 'donor-1' })).toThrow(/PHI field/);
    expect(() => assertNoPhiPayload({ description: 'Patient ID 123' })).toThrow(/PHI marker/);
  });
});
