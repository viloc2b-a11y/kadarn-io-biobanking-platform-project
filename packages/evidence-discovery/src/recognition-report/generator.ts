// ==========================================================================
// Institution Recognition Report — Types + Generator (Sprint 22A)
// ==========================================================================
//
// First Knowledge Consumption product of Kadarn.
// Transforms canonical engine outputs into a professional institutional report.
//
// Consumes everything. Owns nothing.
// No confidence computation. No AI-generated facts. No duplicated logic.
// ==========================================================================

// --------------------------------------------------------------------------
// Report section types
// --------------------------------------------------------------------------

export interface InstitutionOverview {
  institution_name: string
  discovery_sessions: number
  artifacts_processed: number
  capabilities_detected: number
  research_assets_enabled: number
}

export interface CapabilitySection {
  name: string
  category: string
  assessment: string
  maturity: string
  supporting_evidence_count: number
  supporting_claims: string[]
  research_assets: string[]
}

export interface ResearchAssetSection {
  asset: string
  enabled_by: string[]
  assessment: string
  gaps_affecting: number
}

export interface EvidenceHighlight {
  title: string
  description: string
  capability: string
  source: string
}

export interface EvidenceGapSection {
  title: string
  severity: string
  blocking: boolean
  affected_capabilities: string[]
  affected_assets: string[]
  recommendation: string
}

export interface SponsorReadinessSection {
  label: string
  summary: string
  strengths: string[]
  concerns: string[]
}

export interface RecommendationSection {
  priority: string
  title: string
  reason: string
  action: string
}

export interface ReportAppendix {
  source_trace: string[]
  provenance: string
  discovery_metadata: Record<string, unknown>
  generation_timestamp: string
}

// --------------------------------------------------------------------------
// Full report
// --------------------------------------------------------------------------

export interface InstitutionRecognitionReport {
  executive_summary: string
  institution_overview: InstitutionOverview
  institution_story: string
  capabilities: CapabilitySection[]
  research_assets: ResearchAssetSection[]
  evidence_highlights: EvidenceHighlight[]
  evidence_gaps: EvidenceGapSection[]
  sponsor_readiness: SponsorReadinessSection | null
  recommendations: RecommendationSection[]
  appendix: ReportAppendix
  generated_at: string
}

// --------------------------------------------------------------------------
// Report input — consumes all canonical engines
// --------------------------------------------------------------------------

export interface ReportInput {
  institutionName: string
  capabilities: Array<{
    id: string
    name: string
    category: string
    assessment_status: string
    operational_maturity: string
    supporting_claims: string[]
    supporting_evidence: string[]
    research_assets_enabled: string[]
    assessment_summary: string
  }>
  assessmentSummary?: {
    healthy: number
    attention_needed: number
    limited: number
    blocked: number
    unknown: number
  }
  gaps: Array<{
    title: string
    severity: string
    blocking: boolean
    affected_capabilities: string[]
    affected_research_assets: string[]
    recommended_next_action: string
  }>
  readiness?: {
    readiness_label: string
    summary: string
    strengths: string[]
    concerns: string[]
  }
  recommendations?: Array<{
    priority: string
    title: string
    reason: string
    recommended_action: string
    blocking: boolean
  }>
  story?: string
  artifactsProcessed?: number
  sessionCount?: number
}

// --------------------------------------------------------------------------
// InstitutionRecognitionReportGenerator
// --------------------------------------------------------------------------

export class InstitutionRecognitionReportGenerator {
  generate(input: ReportInput): InstitutionRecognitionReport {
    const now = new Date().toISOString()

    const overview = this.buildOverview(input)
    const executiveSummary = this.buildExecutiveSummary(input)
    const story = input.story ?? this.buildDefaultStory(input)
    const capabilities = this.buildCapabilities(input)
    const researchAssets = this.buildResearchAssets(input)
    const evidenceHighlights = this.buildEvidenceHighlights(input)
    const evidenceGaps = this.buildEvidenceGaps(input)
    const sponsorReadiness = this.buildSponsorReadiness(input)
    const recommendations = this.buildRecommendations(input)
    const appendix = this.buildAppendix(input, now)

    return {
      executive_summary: executiveSummary,
      institution_overview: overview,
      institution_story: story,
      capabilities,
      research_assets: researchAssets,
      evidence_highlights: evidenceHighlights,
      evidence_gaps: evidenceGaps,
      sponsor_readiness: sponsorReadiness,
      recommendations,
      appendix,
      generated_at: now,
    }
  }

  private buildOverview(input: ReportInput): InstitutionOverview {
    return {
      institution_name: input.institutionName,
      discovery_sessions: input.sessionCount ?? 0,
      artifacts_processed: input.artifactsProcessed ?? 0,
      capabilities_detected: input.capabilities.length,
      research_assets_enabled: new Set(
        input.capabilities.flatMap((c) => c.research_assets_enabled),
      ).size,
    }
  }

  private buildExecutiveSummary(input: ReportInput): string {
    const caps = input.capabilities
    const healthy = caps.filter((c) => c.assessment_status === 'healthy').length
    const blocked = caps.filter((c) => c.assessment_status === 'blocked').length
    const total = caps.length
    const assets = new Set(caps.flatMap((c) => c.research_assets_enabled)).size
    const readinessLabel = input.readiness?.readiness_label ?? 'Not assessed'

    const parts: string[] = [
      `${input.institutionName} has been assessed by Kadarn's institutional intelligence platform.`,
      `Of ${total} detected capabilities, ${healthy} are operating with sufficient evidence (healthy), and ${blocked} are blocked by critical evidence gaps.`,
      `${assets} research asset types are enabled across the institution's capabilities.`,
      `Current sponsor readiness: ${readinessLabel}.`,
    ]

    if (input.gaps.filter((g) => g.blocking).length > 0) {
      parts.push(
        `${input.gaps.filter((g) => g.blocking).length} blocking gaps require immediate attention before this profile can be presented to sponsors.`,
      )
    }

    if (input.recommendations && input.recommendations.filter((r) => r.priority === 'critical').length > 0) {
      parts.push(
        `Top priority recommendations have been identified to guide next actions.`,
      )
    }

    return parts.join(' ')
  }

  private buildDefaultStory(input: ReportInput): string {
    const caps = input.capabilities.filter(
      (c) => c.assessment_status === 'healthy' || c.assessment_status === 'attention_needed',
    )
    if (caps.length === 0) {
      return `${input.institutionName} is in the early stages of institutional evidence discovery. More documentation and data are needed to reconstruct a complete profile.`
    }
    const names = caps.slice(0, 5).map((c) => c.name).join(', ')
    return `${input.institutionName} demonstrates institutional capabilities across multiple domains including ${names}. These capabilities are supported by documented evidence and enable a portfolio of research assets for clinical and translational research.`
  }

  private buildCapabilities(input: ReportInput): CapabilitySection[] {
    return input.capabilities.slice(0, 20).map((c) => ({
      name: c.name,
      category: c.category,
      assessment: c.assessment_status,
      maturity: c.operational_maturity,
      supporting_evidence_count: c.supporting_evidence.length,
      supporting_claims: c.supporting_claims.slice(0, 3),
      research_assets: c.research_assets_enabled,
    }))
  }

  private buildResearchAssets(input: ReportInput): ResearchAssetSection[] {
    const assetMap = new Map<string, { enabledBy: string[]; assessments: string[]; gapCount: number }>()

    for (const cap of input.capabilities) {
      for (const asset of cap.research_assets_enabled) {
        const entry = assetMap.get(asset) ?? { enabledBy: [], assessments: [], gapCount: 0 }
        entry.enabledBy.push(cap.name)
        entry.assessments.push(cap.assessment_status)
        assetMap.set(asset, entry)
      }
    }

    // Add gap counts
    for (const gap of input.gaps) {
      for (const asset of gap.affected_research_assets) {
        const entry = assetMap.get(asset)
        if (entry) entry.gapCount++
      }
    }

    return Array.from(assetMap.entries()).map(([asset, data]) => ({
      asset,
      enabled_by: data.enabledBy.slice(0, 5),
      assessment: data.assessments.includes('healthy')
        ? 'healthy'
        : data.assessments.includes('blocked')
          ? 'blocked'
          : 'partial',
      gaps_affecting: data.gapCount,
    }))
  }

  private buildEvidenceHighlights(input: ReportInput): EvidenceHighlight[] {
    const highlights: EvidenceHighlight[] = []

    // Capabilities with most evidence
    const sorted = [...input.capabilities]
      .sort((a, b) => b.supporting_evidence.length - a.supporting_evidence.length)
      .slice(0, 5)

    for (const cap of sorted) {
      if (cap.supporting_evidence.length === 0) continue
      highlights.push({
        title: `Strong evidence for ${cap.name}`,
        description: `${cap.supporting_evidence.length} pieces of supporting evidence found for this capability.`,
        capability: cap.name,
        source: 'Capability Intelligence Engine',
      })
    }

    return highlights
  }

  private buildEvidenceGaps(input: ReportInput): EvidenceGapSection[] {
    return input.gaps.slice(0, 20).map((g) => ({
      title: g.title,
      severity: g.severity,
      blocking: g.blocking,
      affected_capabilities: g.affected_capabilities.slice(0, 5),
      affected_assets: g.affected_research_assets.slice(0, 5),
      recommendation: g.recommended_next_action,
    }))
  }

  private buildSponsorReadiness(
    input: ReportInput,
  ): SponsorReadinessSection | null {
    if (!input.readiness) return null
    return {
      label: input.readiness.readiness_label,
      summary: input.readiness.summary,
      strengths: input.readiness.strengths,
      concerns: input.readiness.concerns,
    }
  }

  private buildRecommendations(input: ReportInput): RecommendationSection[] {
    if (!input.recommendations) return []
    return input.recommendations.slice(0, 10).map((r) => ({
      priority: r.priority,
      title: r.title,
      reason: r.reason,
      action: r.recommended_action,
    }))
  }

  private buildAppendix(input: ReportInput, now: string): ReportAppendix {
    return {
      source_trace: [
        'Capability Intelligence Engine',
        'Evidence Gap Intelligence Engine',
        'Institutional Capability Assessment Engine',
        'Sponsor Readiness Engine',
        'Recommendation Engine',
      ],
      provenance: `Generated by Kadarn Institution Recognition Report Generator v1.0 at ${now}`,
      discovery_metadata: {
        institution: input.institutionName,
        capabilities_count: input.capabilities.length,
        gaps_count: input.gaps.length,
        recommendations_count: input.recommendations?.length ?? 0,
      },
      generation_timestamp: now,
    }
  }
}
