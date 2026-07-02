// ==========================================================================
// Institutional Narrative — Engine
// ==========================================================================
// Sprint 20B.5.
//
// Generates institutional narrative from Timeline + Capabilities + Claims.
// Every sentence cites evidence. No invented information.
// No Evidence Core modification.
// ==========================================================================

import type { InstitutionalTimeline, TimelineEvent } from '../timeline/types.js';
import type { CandidateCapability } from '../capability/types.js';
import type { CandidateClaim } from '../claim-candidate/types.js';
import type { DiscoveryResult, Entity, Relationship } from '../orchestrator.js';
import type {
  InstitutionalNarrative,
  NarrativeSection,
  NarrativeParagraph,
  NarrativeCitation,
  NarrativeSectionType,
} from './types.js';

// --------------------------------------------------------------------------
// Narrative Engine
// --------------------------------------------------------------------------

export class NarrativeEngine {
  /**
   * Generate an institutional narrative from Timeline + Capabilities + Claims.
   * No invented information. Every sentence cites evidence.
   */
  generate(params: {
    timeline: InstitutionalTimeline;
    capabilities: CandidateCapability[];
    claims: CandidateClaim[];
    discoveryResult: DiscoveryResult;
    siteId?: string;
  }): InstitutionalNarrative {
    const { timeline, capabilities, claims, discoveryResult } = params;
    const siteId = params.siteId ?? timeline.siteId ?? 'unknown';

    const sections: NarrativeSection[] = [];
    let order = 0;

    // 1. Timeline Chronology (always first content section)
    const timelineSection = this.buildTimelineChronology(timeline, order++);
    if (timelineSection) sections.push(timelineSection);

    // 2. Capability Summary
    const capSection = this.buildCapabilitySummary(capabilities, order++);
    if (capSection) sections.push(capSection);

    // 3. Research Activity
    const researchSection = this.buildResearchActivity(timeline, capabilities, claims, discoveryResult, order++);
    if (researchSection) sections.push(researchSection);

    // 4. Regulatory Compliance
    const regulatorySection = this.buildRegulatoryCompliance(timeline, capabilities, order++);
    if (regulatorySection) sections.push(regulatorySection);

    // 5. Institution Overview (generated last — depends on other sections)
    const overviewSection = this.buildInstitutionOverview(
      timeline, capabilities, claims, sections, order++,
    );
    sections.unshift(overviewSection); // always first visually

    // Reorder after unshift
    sections.forEach((s, i) => { s.order = i; });

    // Generate executive summary
    const summary = this.buildSummary(timeline, capabilities, claims, sections);

    const totalParagraphs = sections.reduce((sum, s) => sum + s.paragraphs.length, 0);
    const totalCitations = sections.reduce(
      (sum, s) => sum + s.paragraphs.reduce((ps, p) => ps + p.citations.length, 0),
      0,
    );

    return {
      siteId,
      generatedAt: new Date().toISOString(),
      sections,
      summary,
      totalCitations,
      totalParagraphs,
    };
  }

  // ------------------------------------------------------------------------
  // Section builders
  // ------------------------------------------------------------------------

  private buildTimelineChronology(
    timeline: InstitutionalTimeline,
    order: number,
  ): NarrativeSection | null {
    if (timeline.events.length === 0) return null;

    const paragraphs: NarrativeParagraph[] = [];
    const sorted = [...timeline.events].sort((a, b) => a.date.value.localeCompare(b.date.value));

    // Group events by year
    const byYear = new Map<string, TimelineEvent[]>();
    for (const event of sorted) {
      const year = event.date.value.slice(0, 4);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year)!.push(event);
    }

    const years = Array.from(byYear.keys()).sort();

    for (const year of years) {
      const events = byYear.get(year)!;
      const eventDescriptions: string[] = [];

      for (const event of events) {
        const citations: NarrativeCitation[] = [
          { type: 'event', id: event.eventId, label: event.title },
          ...event.sourceArtifactIds.map(aid => ({
            type: 'document' as const, id: aid, label: `Document ${aid}`,
          })),
        ];

        const dateInfo = event.date.precision === 'exact'
          ? `On ${event.date.value}`
          : event.date.precision === 'estimated_month'
            ? `In ${event.date.value}`
            : `Around ${event.date.value}`;

        const confNote = event.confidence < 0.5
          ? ' (low confidence — requires verification)'
          : event.confidence < 0.7
            ? ' (moderate confidence)'
            : '';

        const text = `${dateInfo}, ${event.title.toLowerCase()}.${confNote} ${event.narrative}`;

        paragraphs.push({ text, citations });
      }
    }

    // Add a summary paragraph about the time range
    if (timeline.yearRange.start || timeline.yearRange.end) {
      const rangeText = timeline.yearRange.start && timeline.yearRange.end
        ? `The institutional timeline spans from ${timeline.yearRange.start} to ${timeline.yearRange.end}, covering ${timeline.eventCount} documented events.`
        : timeline.yearRange.start
          ? `The institutional timeline begins in ${timeline.yearRange.start}, with ${timeline.eventCount} documented events.`
          : `The institutional timeline covers ${timeline.eventCount} documented events.`;

      paragraphs.push({
        text: rangeText,
        citations: sorted.slice(0, 3).map(e => ({
          type: 'event' as const, id: e.eventId, label: e.title,
        })),
      });
    }

    return {
      sectionId: `sec-timeline-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Institutional Timeline',
      type: 'timeline_chronology',
      paragraphs,
      order,
    };
  }

  private buildCapabilitySummary(
    capabilities: CandidateCapability[],
    order: number,
  ): NarrativeSection | null {
    if (capabilities.length === 0) return null;

    const paragraphs: NarrativeParagraph[] = [];

    // Group by category
    const byCategory = new Map<string, CandidateCapability[]>();
    for (const cap of capabilities) {
      if (!byCategory.has(cap.category)) byCategory.set(cap.category, []);
      byCategory.get(cap.category)!.push(cap);
    }

    // Paragraph per category
    for (const [category, caps] of byCategory) {
      const citations: NarrativeCitation[] = [];
      const capDescriptions: string[] = [];

      for (const cap of caps) {
        citations.push({ type: 'capability', id: cap.capabilityId, label: cap.name });
        citations.push(
          ...cap.supportingEntityIds.map(eid => ({
            type: 'entity' as const, id: eid, label: `Entity ${eid}`,
          })),
        );
        citations.push(
          ...cap.supportingArtifactIds.map(aid => ({
            type: 'document' as const, id: aid, label: `Document ${aid}`,
          })),
        );

        const statusLabel = cap.status === 'detected' ? 'confirmed' : 'suspected';
        capDescriptions.push(
          `${cap.name} (${statusLabel}, confidence ${(cap.confidence * 100).toFixed(0)}%) based on ${cap.supportingEntityIds.length} entities and ${cap.supportingArtifactIds.length} documents`,
        );
      }

      const categoryLabel = this.categoryLabel(category);
      const text = `The institution demonstrates ${caps.length} ${categoryLabel} capabilit${caps.length === 1 ? 'y' : 'ies'}: ${capDescriptions.join('; ')}.`;

      paragraphs.push({ text, citations });
    }

    // Summary paragraph
    const totalDetected = capabilities.filter(c => c.status === 'detected').length;
    const totalSuspected = capabilities.filter(c => c.status === 'suspected').length;
    const summaryCitations = capabilities.slice(0, 3).map(c => ({
      type: 'capability' as const, id: c.capabilityId, label: c.name,
    }));

    paragraphs.push({
      text: `In total, the analysis identified ${totalDetected} confirmed and ${totalSuspected} suspected capabilities across ${byCategory.size} categories.`,
      citations: summaryCitations,
    });

    return {
      sectionId: `sec-capability-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Institutional Capabilities',
      type: 'capability_summary',
      paragraphs,
      order,
    };
  }

  private buildResearchActivity(
    timeline: InstitutionalTimeline,
    capabilities: CandidateCapability[],
    claims: CandidateClaim[],
    discoveryResult: DiscoveryResult,
    order: number,
  ): NarrativeSection | null {
    const paragraphs: NarrativeParagraph[] = [];

    // Find research-relevant timeline events
    const researchEvents = timeline.events.filter(
      e => e.category === 'clinical_trial' || e.category === 'study_activity',
    );

    // Find therapeutic area capabilities
    const therapeuticCaps = capabilities.filter(c => c.category === 'therapeutic_area');

    // Find study-related entities
    const sponsors = discoveryResult.entities.filter(e => e.type === 'SPONSOR');
    const studies = discoveryResult.entities.filter(e => e.type === 'STUDY');
    const investigators = discoveryResult.entities.filter(e => e.type === 'INVESTIGATOR');

    if (researchEvents.length === 0 && therapeuticCaps.length === 0 && claims.length === 0) {
      return null;
    }

    // Research events
    if (researchEvents.length > 0) {
      const citations: NarrativeCitation[] = researchEvents.map(e => ({
        type: 'event' as const, id: e.eventId, label: e.title,
      }));

      const eventSummary = researchEvents.map(e => e.title.toLowerCase()).join('; ');
      const text = `Research activities include ${researchEvents.length} documented event${researchEvents.length === 1 ? '' : 's'}: ${eventSummary}.`;
      paragraphs.push({ text, citations });
    }

    // Therapeutic areas
    if (therapeuticCaps.length > 0) {
      const citations: NarrativeCitation[] = therapeuticCaps.map(c => ({
        type: 'capability' as const, id: c.capabilityId, label: c.name,
      }));

      const areas = therapeuticCaps.map(c => c.name).join(', ');
      const text = `Research expertise spans therapeutic area${therapeuticCaps.length === 1 ? '' : 's'}: ${areas}.`;
      paragraphs.push({ text, citations });
    }

    // Sponsors and studies
    if (sponsors.length > 0 || studies.length > 0) {
      const citations: NarrativeCitation[] = [
        ...sponsors.map(s => ({ type: 'entity' as const, id: s.entityId, label: s.value })),
        ...studies.map(s => ({ type: 'entity' as const, id: s.entityId, label: s.value })),
      ];

      const parts: string[] = [];
      if (sponsors.length > 0) {
        parts.push(`${sponsors.length} sponsor${sponsors.length === 1 ? '' : 's'} (${sponsors.map(s => s.value).join(', ')})`);
      }
      if (studies.length > 0) {
        parts.push(`${studies.length} stud${studies.length === 1 ? 'y' : 'ies'} documented`);
      }
      if (investigators.length > 0) {
        parts.push(`${investigators.length} investigator${investigators.length === 1 ? '' : 's'} identified`);
      }

      const text = `The institution has engaged with ${parts.join(' and ')}.`;
      paragraphs.push({ text, citations });
    }

    // Claim-derived research indicators
    const researchClaims = claims.filter(
      c => c.suggestedTaxonomy.includes('therapeutic_area') || c.suggestedTaxonomy.includes('research'),
    );
    if (researchClaims.length > 0) {
      const citations: NarrativeCitation[] = researchClaims.map(c => ({
        type: 'claim' as const, id: c.claimId, label: c.summary,
      }));
      const text = `Analysis suggests potential research claims in ${researchClaims.length} area${researchClaims.length === 1 ? '' : 's'}, including ${researchClaims.slice(0, 3).map(c => c.summary).join(', ')}.`;
      paragraphs.push({ text, citations });
    }

    if (paragraphs.length === 0) return null;

    return {
      sectionId: `sec-research-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Research Activity',
      type: 'research_activity',
      paragraphs,
      order,
    };
  }

  private buildRegulatoryCompliance(
    timeline: InstitutionalTimeline,
    capabilities: CandidateCapability[],
    order: number,
  ): NarrativeSection | null {
    const paragraphs: NarrativeParagraph[] = [];

    // Regulatory capabilities
    const regulatoryCaps = capabilities.filter(c => c.category === 'regulatory');

    // Regulatory timeline events
    const regulatoryEvents = timeline.events.filter(
      e => e.category === 'regulatory_event' || e.category === 'certification' || e.category === 'training_completed',
    );

    if (regulatoryCaps.length === 0 && regulatoryEvents.length === 0) return null;

    // Regulatory capabilities
    if (regulatoryCaps.length > 0) {
      const citations: NarrativeCitation[] = [];
      const capNames: string[] = [];

      for (const cap of regulatoryCaps) {
        citations.push({ type: 'capability', id: cap.capabilityId, label: cap.name });
        citations.push(
          ...cap.supportingArtifactIds.map(aid => ({
            type: 'document' as const, id: aid, label: `Document ${aid}`,
          })),
        );
        capNames.push(cap.name);
      }

      const text = `The institution maintains regulatory capabilities: ${capNames.join(', ')}.`;
      paragraphs.push({ text, citations });
    }

    // Regulatory events
    if (regulatoryEvents.length > 0) {
      const citations: NarrativeCitation[] = regulatoryEvents.map(e => ({
        type: 'event' as const, id: e.eventId, label: e.title,
      }));

      const eventText = regulatoryEvents.map(e => e.title.toLowerCase()).join('; ');
      const text = `Regulatory and compliance events include ${regulatoryEvents.length} documented occurrence${regulatoryEvents.length === 1 ? '' : 's'}: ${eventText}.`;
      paragraphs.push({ text, citations });
    }

    return {
      sectionId: `sec-regulatory-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Regulatory Compliance',
      type: 'regulatory_compliance',
      paragraphs,
      order,
    };
  }

  private buildInstitutionOverview(
    timeline: InstitutionalTimeline,
    capabilities: CandidateCapability[],
    claims: CandidateClaim[],
    sections: NarrativeSection[],
    order: number,
  ): NarrativeSection {
    const paragraphs: NarrativeParagraph[] = [];
    const citations: NarrativeCitation[] = [];

    const startYear = timeline.yearRange.start;
    const endYear = timeline.yearRange.end;

    // Time span
    if (startYear && endYear) {
      const text = `This institution has been active in clinical research from ${startYear} to ${endYear}, with a documented timeline spanning ${timeline.eventCount} events.`;
      const eventCitations = timeline.events.slice(0, 2).map(e => ({
        type: 'event' as const, id: e.eventId, label: e.title,
      }));
      paragraphs.push({ text, citations: eventCitations });
    } else if (startYear) {
      const text = `This institution has documented activity beginning in ${startYear}, with ${timeline.eventCount} events recorded.`;
      const eventCitations = timeline.events.slice(0, 2).map(e => ({
        type: 'event' as const, id: e.eventId, label: e.title,
      }));
      paragraphs.push({ text, citations: eventCitations });
    } else if (timeline.events.length > 0) {
      const text = `This institution has ${timeline.eventCount} documented events in its institutional timeline.`;
      const eventCitations = timeline.events.slice(0, 2).map(e => ({
        type: 'event' as const, id: e.eventId, label: e.title,
      }));
      paragraphs.push({ text, citations: eventCitations });
    }

    // Capabilities
    if (capabilities.length > 0) {
      const detected = capabilities.filter(c => c.status === 'detected').length;
      const suspected = capabilities.filter(c => c.status === 'suspected').length;
      const categories = new Set(capabilities.map(c => c.category)).size;

      const capCitations = capabilities.slice(0, 3).map(c => ({
        type: 'capability' as const, id: c.capabilityId, label: c.name,
      }));

      const text = `Analysis identified ${detected} confirmed and ${suspected} suspected capabilities across ${categories} operational areas.`;
      paragraphs.push({ text, citations: capCitations });
    }

    // Claims
    if (claims.length > 0) {
      const candidateCount = claims.filter(c => c.status === 'candidate').length;
      const avgCoverage = claims.reduce((s, c) => s + c.evidenceCoverage, 0) / claims.length;

      const claimCitations = claims.slice(0, 3).map(c => ({
        type: 'claim' as const, id: c.claimId, label: c.summary,
      }));

      const text = `${candidateCount} potential claim${candidateCount === 1 ? '' : 's'} ${candidateCount === 1 ? 'has' : 'have'} been identified, with an average evidence coverage of ${(avgCoverage * 100).toFixed(0)}%.`;
      paragraphs.push({ text, citations: claimCitations });
    }

    return {
      sectionId: `sec-overview-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Institutional Overview',
      type: 'institution_overview',
      paragraphs,
      order,
    };
  }

  // ------------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------------

  private buildSummary(
    timeline: InstitutionalTimeline,
    capabilities: CandidateCapability[],
    claims: CandidateClaim[],
    sections: NarrativeSection[],
  ): string {
    const parts: string[] = [];

    const startYear = timeline.yearRange.start;
    const endYear = timeline.yearRange.end;

    if (startYear && endYear) {
      parts.push(`This institution has been active in clinical research from ${startYear} to ${endYear}.`);
    } else if (startYear) {
      parts.push(`This institution has documented activity beginning in ${startYear}.`);
    }

    if (capabilities.length > 0) {
      const detected = capabilities.filter(c => c.status === 'detected').length;
      const categories = new Set(capabilities.map(c => c.category));
      const categoryNames = Array.from(categories).map(c => this.categoryLabel(c));
      parts.push(`Analysis identified ${detected} confirmed capabilities across ${categoryNames.join(', ')}.`);
    }

    if (claims.length > 0) {
      const candidateCount = claims.filter(c => c.status === 'candidate').length;
      const avgCoverage = claims.reduce((s, c) => s + c.evidenceCoverage, 0) / claims.length;
      parts.push(`${candidateCount} potential claim${candidateCount === 1 ? '' : 's'} ${candidateCount === 1 ? 'was' : 'were'} identified with ${(avgCoverage * 100).toFixed(0)}% average evidence coverage.`);
    }

    const hasRegulatory = capabilities.some(c => c.category === 'regulatory');
    if (hasRegulatory) {
      parts.push('The institution demonstrates regulatory compliance capabilities.');
    }

    if (parts.length === 0) {
      parts.push('No institutional activity data is currently available for this institution.');
    }

    return parts.join(' ');
  }

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------

  private categoryLabel(category: string): string {
    const labels: Record<string, string> = {
      processing: 'sample processing',
      storage: 'biorepository storage',
      shipping: 'shipping and logistics',
      regulatory: 'regulatory and compliance',
      operations: 'operational',
      therapeutic_area: 'therapeutic',
      special: 'specialized',
    };
    return labels[category] ?? category;
  }
}
