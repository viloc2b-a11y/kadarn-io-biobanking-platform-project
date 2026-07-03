// ==========================================================================
// Kadarn Document Intake Engine — Structured Extraction Engine
// ==========================================================================
// Sprint 26E.
//
// Transforms DocumentSections into structured candidates for the Discovery
// Pipeline. Produces: entities, relationships, claim candidates, capability
// candidates, and research asset candidates.
//
// Deterministic rule-based extraction. No AI, no confidence scoring,
// no Evidence Core writes.
// ==========================================================================

import type { DocumentSection } from '../segmentation/types.js'
import type {
  StructuredExtraction,
  ExtractedEntity,
  ExtractedRelationship,
  ClaimCandidate,
  CapabilityCandidate,
  ResearchAssetCandidate,
  EntityMention,
  ExtractionContext,
} from './types.js'

// ==========================================================================
// Engine
// ==========================================================================

export class StructuredExtractionEngine {
  /**
   * Extract structured candidates from a list of document sections.
   */
  extract(sections: DocumentSection[]): StructuredExtraction {
    if (sections.length === 0) {
      return this.emptyResult('unknown')
    }

    const documentId = sections[0].documentId
    const ctx: ExtractionContext = { sections, documentId }

    const entities = this.extractEntities(sections)
    const relationships = this.extractRelationships(sections, entities)
    const claimCandidates = this.extractClaims(sections)
    const capabilityCandidates = this.extractCapabilities(sections)
    const researchAssetCandidates = this.extractResearchAssets(sections)

    return {
      documentId,
      entities,
      relationships,
      claimCandidates,
      capabilityCandidates,
      researchAssetCandidates,
      extractedAt: new Date().toISOString(),
    }
  }

  // --------------------------------------------------------------------------
  // Entity extraction
  // --------------------------------------------------------------------------

  private extractEntities(sections: DocumentSection[]): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []
    let entityIndex = 0

    for (const section of sections) {
      const lines = section.content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNum = i + 1

        // --- People ---
        const people = this.extractPeople(line, lineNum)
        for (const person of people) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: person,
            type: 'person',
            mentions: [{ text: person, line: lineNum, rule: 'person-pattern' }],
            sectionId: section.sectionId,
          })
        }

        // --- Drugs ---
        const drugs = this.extractDrugs(line, lineNum)
        for (const drug of drugs) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: drug,
            type: 'drug',
            mentions: [{ text: drug, line: lineNum, rule: 'drug-pattern' }],
            sectionId: section.sectionId,
          })
        }

        // --- Diseases ---
        const diseases = this.extractDiseases(line, lineNum)
        for (const disease of diseases) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: disease,
            type: 'disease',
            mentions: [{ text: disease, line: lineNum, rule: 'disease-keyword' }],
            sectionId: section.sectionId,
          })
        }

        // --- Organizations ---
        const orgs = this.extractOrganizations(line, lineNum)
        for (const org of orgs) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: org,
            type: 'organization',
            mentions: [{ text: org, line: lineNum, rule: 'org-pattern' }],
            sectionId: section.sectionId,
          })
        }

        // --- Identifiers ---
        const ids = this.extractIdentifiers(line, lineNum)
        for (const id of ids) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: id.value,
            type: 'identifier',
            mentions: [{ text: id.raw, line: lineNum, rule: id.rule }],
            sectionId: section.sectionId,
          })
        }

        // --- Biomarkers ---
        const biomarkers = this.extractBiomarkers(line, lineNum)
        for (const bm of biomarkers) {
          entities.push({
            id: `${section.sectionId}/e${entityIndex++}`,
            name: bm,
            type: 'biomarker',
            mentions: [{ text: bm, line: lineNum, rule: 'biomarker-keyword' }],
            sectionId: section.sectionId,
          })
        }
      }
    }

    return entities
  }

  // --------------------------------------------------------------------------
  // Relationship extraction
  // --------------------------------------------------------------------------

  private extractRelationships(
    sections: DocumentSection[],
    entities: ExtractedEntity[],
  ): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = []
    let relIndex = 0

    // Build a quick lookup: entities by section + name
    const entityMap = new Map<string, ExtractedEntity[]>()
    for (const e of entities) {
      const key = `${e.sectionId}:${e.name.toLowerCase()}`
      if (!entityMap.has(key)) entityMap.set(key, [])
      entityMap.get(key)!.push(e)
    }

    for (const section of sections) {
      const lines = section.content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNum = i + 1

        // Pattern: "X Hospital" + "employs" → relationship
        // Pattern: "studies X" or "X was studied"
        // Pattern: "treats Y" or "treatment of Y"
        // Pattern: "located at Z" or "at X site"

        // Sponsor relationship: "sponsored by X" or "X sponsors"
        const sponsorMatch = line.match(/(?:sponsored\s+by|sponsors?)\s+(.+?)(?:[.,;]|$)/i)
        if (sponsorMatch) {
          const orgName = sponsorMatch[1].trim()
          const orgs = this.findEntitiesInSection(entities, section.sectionId, 'organization')
          if (orgs.length > 0) {
            relationships.push({
              id: `${section.sectionId}/r${relIndex++}`,
              type: 'sponsors',
              sourceEntityId: orgs[0].id,
              targetEntityId: '', // study entity not yet extracted
              evidence: line.trim(),
              line: lineNum,
              sectionId: section.sectionId,
            })
          }
        }

        // Collaboration: "in collaboration with X"
        const collabMatch = line.match(/in\s+collaboration\s+with\s+(.+?)(?:[.,;]|$)/i)
        if (collabMatch) {
          relationships.push({
            id: `${section.sectionId}/r${relIndex++}`,
            type: 'collaborates_with',
            sourceEntityId: '',
            targetEntityId: '',
            evidence: line.trim(),
            line: lineNum,
            sectionId: section.sectionId,
          })
        }
      }
    }

    return relationships
  }

  // --------------------------------------------------------------------------
  // Claim extraction
  // --------------------------------------------------------------------------

  private extractClaims(sections: DocumentSection[]): ClaimCandidate[] {
    const claims: ClaimCandidate[] = []
    let claimIndex = 0

    const claimPatterns: Array<{ regex: RegExp; type: ClaimCandidate['type'] }> = [
      { regex: /(?:reduc(?:es?|ed)|decreas(?:es?|ed)|improv(?:es?|ed)|increas(?:es?|ed))\s+.+?\s+(?:by\s+\d+(?:\.\d+)?%|significantly)/i, type: 'efficacy' },
      { regex: /(?:mortality|survival|outcome|endpoint)\s+.+?(?:met|achieved|demonstrated|observed)/i, type: 'efficacy' },
      { regex: /(?:adverse\s+events?|side\s+effects?|safety\s+profile|tolerability)/i, type: 'safety' },
      { regex: /no\s+serious\s+adverse\s+events?/i, type: 'safety' },
      { regex: /(?:mean\s+age|median\s+age|age\s+range|enrolled?\s+\d+|N\s*=\s*\d+)/i, type: 'demographic' },
      { regex: /(?:randomized|double-blind|placebo-controlled|open-label|single-arm)/i, type: 'methodological' },
      { regex: /(?:FDA\s+approv(?:ed|al)|EMA\s+approv(?:ed|al)|regulatory\s+submission|IND|NDA|BLA)/i, type: 'regulatory' },
      { regex: /(?:accrual\s+rate|enrollment\s+rate|site\s+activation|feasibility)/i, type: 'operational' },
    ]

    for (const section of sections) {
      const lines = section.content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim().length < 10) continue // skip short lines

        for (const pattern of claimPatterns) {
          if (pattern.regex.test(line)) {
            claims.push({
              id: `${section.sectionId}/c${claimIndex++}`,
              statement: line.trim(),
              type: pattern.type,
              line: i + 1,
              sectionId: section.sectionId,
            })
            break // one claim per line
          }
        }
      }
    }

    return claims
  }

  // --------------------------------------------------------------------------
  // Capability extraction
  // --------------------------------------------------------------------------

  private extractCapabilities(sections: DocumentSection[]): CapabilityCandidate[] {
    const capabilities: CapabilityCandidate[] = []
    let capIndex = 0

    const capabilityRules: Array<{
      keywords: string[]
      category: CapabilityCandidate['category']
    }> = [
      { keywords: ['sample collection', 'blood draw', 'venipuncture', 'specimen collection', 'biopsy'], category: 'sample_collection' },
      { keywords: ['sample processing', 'centrifugation', 'aliquoting', 'sample preparation', 'pbmc isolation'], category: 'sample_processing' },
      { keywords: ['laboratory testing', 'assay', 'biomarker analysis', 'histopathology', 'clinical chemistry'], category: 'laboratory_testing' },
      { keywords: ['data management', 'EDC', 'electronic data capture', 'database', 'data entry'], category: 'data_management' },
      { keywords: ['regulatory support', 'IRB submission', 'ethics committee', 'regulatory affairs', 'FDA'], category: 'regulatory_support' },
      { keywords: ['clinical operations', 'patient recruitment', 'site management', 'monitoring', 'CRA'], category: 'clinical_operations' },
      { keywords: ['logistics', 'shipping', 'transport', 'cold chain', 'storage', 'courier'], category: 'logistics' },
      { keywords: ['imaging', 'MRI', 'CT scan', 'ultrasound', 'radiology', 'DEXA'], category: 'imaging' },
      { keywords: ['biobanking', 'biorepository', 'long-term storage', 'sample archive', 'biospecimen repository'], category: 'biobanking' },
    ]

    for (const section of sections) {
      const contentLower = section.content.toLowerCase()
      const headingLower = section.heading.toLowerCase()

      for (const rule of capabilityRules) {
        for (const keyword of rule.keywords) {
          if (contentLower.includes(keyword) || headingLower.includes(keyword)) {
            capabilities.push({
              id: `${section.sectionId}/cap${capIndex++}`,
              name: `${rule.category.replace(/_/g, ' ')} — ${section.heading || 'section'}`,
              category: rule.category,
              evidence: `Matched keyword "${keyword}" in section "${section.heading}"`,
              line: section.position.startLine,
              sectionId: section.sectionId,
            })
            break // one capability per rule per section
          }
        }
      }
    }

    return capabilities
  }

  // --------------------------------------------------------------------------
  // Research asset extraction
  // --------------------------------------------------------------------------

  private extractResearchAssets(sections: DocumentSection[]): ResearchAssetCandidate[] {
    const assets: ResearchAssetCandidate[] = []
    let assetIndex = 0

    const biospecimenPatterns = [
      /(\d+)\s*(?:plasma|serum|whole blood|PBMC|tissue|urine|CSF|saliva|stool)\s+samples?/i,
      /(\d+)\s*(?:FFPE|frozen|fresh)\s+(?:tissue|biopsy)\s+(?:blocks?|samples?)/i,
      /(\d+)\s*(?:DNA|RNA|protein)\s+(?:samples?|extracts?|aliquots?)/i,
    ]

    const datasetPatterns = [
      /(?:dataset|data set|database)\s+(?:of|with|containing)\s+(.+?)(?:[.,;]|$)/i,
      /(\d+)\s*(?:patient|subject|participant)\s+(?:records?|data|files?)/i,
    ]

    const cohortPatterns = [
      /(\d+)\s*(?:patient|subject|participant)s?\s+(?:cohort|group|population)/i,
      /cohort\s+(?:of|with)\s+(\d+)\s*(?:patient|subject|participant)s?/i,
    ]

    for (const section of sections) {
      const lines = section.content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNum = i + 1

        // Biospecimens
        for (const pattern of biospecimenPatterns) {
          const match = line.match(pattern)
          if (match) {
            assets.push({
              id: `${section.sectionId}/a${assetIndex++}`,
              name: match[0],
              type: 'biospecimen',
              description: `Biospecimen collection: ${match[0]}`,
              quantity: match[1] || undefined,
              evidence: line.trim(),
              line: lineNum,
              sectionId: section.sectionId,
            })
            break
          }
        }

        // Datasets
        for (const pattern of datasetPatterns) {
          const match = line.match(pattern)
          if (match) {
            assets.push({
              id: `${section.sectionId}/a${assetIndex++}`,
              name: match[0],
              type: 'dataset',
              description: `Dataset: ${match[0]}`,
              evidence: line.trim(),
              line: lineNum,
              sectionId: section.sectionId,
            })
            break
          }
        }

        // Cohorts
        for (const pattern of cohortPatterns) {
          const match = line.match(pattern)
          if (match) {
            assets.push({
              id: `${section.sectionId}/a${assetIndex++}`,
              name: match[0],
              type: 'cohort',
              description: `Patient cohort: ${match[0]}`,
              quantity: match[1] || undefined,
              evidence: line.trim(),
              line: lineNum,
              sectionId: section.sectionId,
            })
            break
          }
        }
      }
    }

    return assets
  }

  // --------------------------------------------------------------------------
  // Entity extractors (line-level)
  // --------------------------------------------------------------------------

  private extractPeople(line: string, _lineNum: number): string[] {
    const results: string[] = []
    // Pattern: Dr. First Last, Prof. First Last, First Last MD, First Last PhD
    const personRegex = /(?:Dr\.|Prof\.|Professor|Principal Investigator|PI)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g
    let match: RegExpExecArray | null
    while ((match = personRegex.exec(line)) !== null) {
      if (!results.includes(match[1])) results.push(match[1])
    }
    return results
  }

  private extractDrugs(line: string, _lineNum: number): string[] {
    const results: string[] = []
    // Pattern: drug name in context (ends with -mab, -nib, -zumab, etc. OR capitalized drug names)
    const drugRegex = /\b([A-Z][a-z]+(?:mab|nib|zumab|ximab|tinib|fenib|sartan|pril|statin|prazole|vir|floxacin))\b/g
    let match: RegExpExecArray | null
    while ((match = drugRegex.exec(line)) !== null) {
      if (!results.includes(match[1])) results.push(match[1])
    }

    // Also: "investigational product X" or "study drug X"
    const ipMatch = line.match(/(?:investigational\s+product|study\s+drug|IMP)\s*[:—–-]?\s*([A-Z][A-Za-z0-9-]+)/i)
    if (ipMatch && !results.includes(ipMatch[1])) {
      results.push(ipMatch[1])
    }

    return results
  }

  private extractDiseases(line: string, _lineNum: number): string[] {
    const results: string[] = []
    const diseaseKeywords = [
      'cancer', 'carcinoma', 'diabetes', 'hypertension', 'asthma', 'COPD',
      'Alzheimer', 'Parkinson', 'arthritis', 'hepatitis', 'tuberculosis',
      'HIV', 'AIDS', 'malaria', 'influenza', 'COVID-19', 'sepsis',
      'myocardial infarction', 'stroke', 'obesity', 'osteoporosis',
    ]

    const lower = line.toLowerCase()
    for (const keyword of diseaseKeywords) {
      if (lower.includes(keyword.toLowerCase()) && !results.includes(keyword)) {
        results.push(keyword)
      }
    }
    return results
  }

  private extractOrganizations(line: string, _lineNum: number): string[] {
    const results: string[] = []
    // Pattern: "X Hospital", "X University", "X Inc", "X Corp", etc.
    const orgRegex = /([A-Z][A-Za-z\s&-]+(?:Hospital|University|Institute|Laboratory|Lab|Medical Center|Clinic|Biobank|CRO|Pharma|Research Center|Inc\.?|Corp\.?|LLC|Ltd\.?|GmbH|SA|S\.A\.|S\.L\.))(?:\.|\s|,|$)/g
    let match: RegExpExecArray | null
    while ((match = orgRegex.exec(line)) !== null) {
      const trimmed = match[1].trim()
      if (trimmed.length > 3 && !results.includes(trimmed)) {
        results.push(trimmed)
      }
    }
    return results
  }

  private extractIdentifiers(line: string, _lineNum: number): Array<{ value: string; raw: string; rule: string }> {
    const results: Array<{ value: string; raw: string; rule: string }> = []

    // NCT number
    const nctMatch = line.match(/\b(NCT\d{8})\b/i)
    if (nctMatch) {
      results.push({ value: nctMatch[1].toUpperCase(), raw: nctMatch[0], rule: 'nct-identifier' })
    }

    // DOI
    const doiMatch = line.match(/\b(10\.\d{4,}\/[^\s]+)\b/)
    if (doiMatch) {
      results.push({ value: doiMatch[1], raw: doiMatch[0], rule: 'doi-identifier' })
    }

    // Protocol ID (generic: PROTOCOL-XXX, PROT-XXX, etc.)
    const protoMatch = line.match(/\b(PROT(?:OCOL)?[-\s]?\d{2,}[A-Za-z0-9-]*)\b/i)
    if (protoMatch) {
      results.push({ value: protoMatch[1], raw: protoMatch[0], rule: 'protocol-identifier' })
    }

    return results
  }

  private extractBiomarkers(line: string, _lineNum: number): string[] {
    const results: string[] = []
    const biomarkerKeywords = [
      'CRP', 'HbA1c', 'glucose', 'cholesterol', 'LDL', 'HDL', 'triglycerides',
      'creatinine', 'ALT', 'AST', 'bilirubin', 'albumin', 'hemoglobin',
      'troponin', 'BNP', 'PSA', 'CA-125', 'CEA', 'HER2', 'EGFR', 'BRAF',
      'CD4', 'CD8', 'viral load', 'IL-6', 'TNF-alpha',
    ]

    for (const keyword of biomarkerKeywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[-+]/g, '\\$&')}\\b`, 'i')
      if (regex.test(line) && !results.includes(keyword)) {
        results.push(keyword)
      }
    }
    return results
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private findEntitiesInSection(
    entities: ExtractedEntity[],
    sectionId: string,
    type?: ExtractedEntity['type'],
  ): ExtractedEntity[] {
    return entities.filter(e => {
      if (e.sectionId !== sectionId) return false
      if (type && e.type !== type) return false
      return true
    })
  }

  private emptyResult(documentId: string): StructuredExtraction {
    return {
      documentId,
      entities: [],
      relationships: [],
      claimCandidates: [],
      capabilityCandidates: [],
      researchAssetCandidates: [],
      extractedAt: new Date().toISOString(),
    }
  }
}
