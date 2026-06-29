import { describe, expect, it } from 'vitest';
import {
  EVENT_VERSIONS,
  type KadarnEventPayload,
  type KadarnEventType,
} from '../../packages/domain-events/src/index';

const continuityEventTypes = [
  'SiteContinuityProfileCreated',
  'ContinuityExperienceAdded',
  'ContinuityCapabilityAdded',
  'ContinuityCapabilityUpdated',
  'ContinuityPerformanceMetricRecorded',
  'ContinuityRelationshipCreated',
  'ContinuityTimelineEventRecorded',
  'ContinuityEvidenceLinked',
  'SitePassportPublished',
  'SitePassportUpdated',
  'LegacyExperienceClaimCreated',
  'LegacyExperienceClaimUpdated',
  'ContinuityEvidenceSubmitted',
  'ContinuityReferenceAdded',
  'ContinuityReferenceConfirmed',
  'ContinuityClaimVerified',
  'ContinuityClaimRejected',
  'ClaimConfidenceScoreUpdated',
] as const satisfies readonly KadarnEventType[];

describe('Continuity domain events', () => {
  it('registers every Continuity event with version 1', () => {
    for (const eventType of continuityEventTypes) {
      expect(EVENT_VERSIONS[eventType]).toBe(1);
    }
  });

  it('types the SiteContinuityProfileCreated payload', () => {
    const payload: KadarnEventPayload<'SiteContinuityProfileCreated'> = {
      profileId: 'profile-1',
      organizationId: 'org-1',
      siteType: 'clinical_site',
      status: 'draft',
      sourceType: 'self_reported',
      createdBy: 'user-1',
    };

    expect(payload.organizationId).toBe('org-1');
    expect(payload.sourceType).toBe('self_reported');
  });

  it('types evidence links without storing evidence content or PHI', () => {
    const payload: KadarnEventPayload<'ContinuityEvidenceLinked'> = {
      evidenceLinkId: 'evidence-link-1',
      profileId: 'profile-1',
      organizationId: 'org-1',
      claimTable: 'continuity_performance_metrics',
      claimId: 'metric-1',
      evidenceType: 'provenance_evidence',
      provenanceEvidenceId: 'provenance-evidence-1',
      auditEventId: null,
      domainEventId: null,
      trustEventId: null,
      verificationStatus: 'evidence_backed',
      visibility: 'private',
    };

    expect(payload.evidenceType).toBe('provenance_evidence');
    expect(Object.keys(payload)).not.toContain('phi');
    expect(Object.keys(payload)).not.toContain('donorId');
  });

  it('types legacy claim events with envelope-compatible fields in the payload contract', () => {
    const payload: KadarnEventPayload<'LegacyExperienceClaimCreated'> = {
      eventId: 'event-1',
      organizationId: 'org-1',
      claimId: 'claim-1',
      actorId: 'user-1',
      occurredAt: '2026-06-28T00:00:00.000Z',
      payload: {
        profileId: 'profile-1',
        claimType: 'study_history',
        category: 'phase_experience',
        title: 'Completed Phase III studies',
        experienceSource: 'legacy',
        verificationStatus: 'self_reported',
        confidenceScore: 25,
        isPublic: false,
      },
    };

    expect(payload.claimId).toBe('claim-1');
    expect(payload.payload.experienceSource).toBe('legacy');
  });

  it('prevents rejected claim events from looking verified', () => {
    const payload: KadarnEventPayload<'ContinuityClaimRejected'> = {
      eventId: 'event-2',
      organizationId: 'org-1',
      claimId: 'claim-1',
      actorId: 'reviewer-1',
      occurredAt: '2026-06-28T00:00:00.000Z',
      payload: {
        verificationStatus: 'rejected',
        confidenceScore: 0,
        reason: 'Insufficient evidence',
      },
    };

    expect(payload.payload.verificationStatus).toBe('rejected');
    expect(payload.payload.confidenceScore).toBe(0);
  });
});
