// ==========================================================================
// Pre-built Templates — canonical delivery templates for KEMS-007
// ==========================================================================

import { createDeliveryTemplateId } from '../value-objects/ids.js';
import { createDeliveryTemplate, type DeliveryTemplate } from '../entities/delivery-template.js';
import type { TemplateMetadata, TemplateSchema } from './types.js';
import { TemplateRegistry } from './registry.js';

// --- SponsorReport v1 ---

const sponsorReportV1Metadata: TemplateMetadata = {
  displayName: 'Sponsor Report',
  description: 'Quarterly sponsor report with institution capability assessment and confidence summary',
  category: 'report',
  tags: ['sponsor', 'quarterly', 'compliance'],
};

const sponsorReportV1Schema: TemplateSchema = {
  version: '1.0.0',
  layout: 'report',
  slots: [
    { name: 'reportTitle', type: 'text', required: true, description: 'Report title' },
    { name: 'institutionName', type: 'text', required: true, description: 'Institution name' },
    { name: 'generatedDate', type: 'text', required: true, description: 'Report generation date' },
    { name: 'confidenceSummary', type: 'json', required: true, description: 'Confidence assessment summary' },
    { name: 'capabilityTable', type: 'table', required: true, description: 'Capability assessment table' },
  ],
};

export const sponsorReportV1 = createDeliveryTemplate({
  id: createDeliveryTemplateId(),
  name: 'SponsorReport',
  artifactType: 'pdf',
  version: 1,
  metadata: sponsorReportV1Metadata,
  schema: sponsorReportV1Schema,
  renderEngine: 'html',
});

// --- SponsorReport v2 ---

const sponsorReportV2Metadata: TemplateMetadata = {
  displayName: 'Sponsor Report',
  description: 'Quarterly sponsor report with capability assessment, evidence gaps, and recommendations',
  category: 'report',
  tags: ['sponsor', 'quarterly', 'compliance', 'gaps'],
};

const sponsorReportV2Schema: TemplateSchema = {
  version: '1.1.0',
  layout: 'report',
  slots: [
    { name: 'reportTitle', type: 'text', required: true, description: 'Report title' },
    { name: 'institutionName', type: 'text', required: true, description: 'Institution name' },
    { name: 'generatedDate', type: 'text', required: true, description: 'Report generation date' },
    { name: 'confidenceSummary', type: 'json', required: true, description: 'Confidence assessment summary' },
    { name: 'capabilityTable', type: 'table', required: true, description: 'Capability assessment table' },
    { name: 'evidenceGaps', type: 'list', required: false, description: 'Identified evidence gaps' },
    { name: 'recommendations', type: 'markdown', required: false, description: 'Recommendations' },
  ],
};

export const sponsorReportV2 = createDeliveryTemplate({
  id: createDeliveryTemplateId(),
  name: 'SponsorReport',
  artifactType: 'pdf',
  version: 2,
  metadata: sponsorReportV2Metadata,
  schema: sponsorReportV2Schema,
  renderEngine: 'html',
});

// --- AuditPack ---

const auditPackMetadata: TemplateMetadata = {
  displayName: 'Audit Pack',
  description: 'Complete audit package with lineage trail, review history, and verification evidence',
  category: 'audit',
  tags: ['audit', 'compliance', 'lineage'],
};

const auditPackSchema: TemplateSchema = {
  version: '1.0.0',
  layout: 'pack',
  slots: [
    { name: 'packTitle', type: 'text', required: true, description: 'Audit pack title' },
    { name: 'lineageTrail', type: 'json', required: true, description: 'Full lineage trail' },
    { name: 'reviewHistory', type: 'list', required: true, description: 'Review event history' },
    { name: 'verificationSummary', type: 'json', required: true, description: 'Verification summary' },
  ],
};

export const auditPack = createDeliveryTemplate({
  id: createDeliveryTemplateId(),
  name: 'AuditPack',
  artifactType: 'zip',
  version: 1,
  metadata: auditPackMetadata,
  schema: auditPackSchema,
  renderEngine: 'json',
});

// --- EvidencePack ---

const evidencePackMetadata: TemplateMetadata = {
  displayName: 'Evidence Pack',
  description: 'Structured evidence package with claim data, explanation steps, and reconstruction verification',
  category: 'pack',
  tags: ['evidence', 'claims', 'reconstruction'],
};

const evidencePackSchema: TemplateSchema = {
  version: '1.0.0',
  layout: 'pack',
  slots: [
    { name: 'claimId', type: 'text', required: true, description: 'Claim identifier' },
    { name: 'claimData', type: 'json', required: true, description: 'Full claim projection' },
    { name: 'explanationSteps', type: 'list', required: true, description: 'Explanation steps' },
    {
      name: 'confidenceLevel',
      type: 'text',
      required: true,
      description: 'Confidence level',
      validation: { pattern: '^(HIGH|MEDIUM|LOW)$' },
    },
    { name: 'policiesApplied', type: 'list', required: true, description: 'Visibility policies applied' },
    { name: 'reconstructionVerification', type: 'json', required: true, description: 'Reconstruction verification data' },
  ],
};

export const evidencePack = createDeliveryTemplate({
  id: createDeliveryTemplateId(),
  name: 'EvidencePack',
  artifactType: 'json',
  version: 1,
  metadata: evidencePackMetadata,
  schema: evidencePackSchema,
  renderEngine: 'json',
});

// --- InstitutionPassport ---

const institutionPassportMetadata: TemplateMetadata = {
  displayName: 'Institution Passport',
  description: 'Public-facing institution passport with capabilities, certifications, and contact information',
  category: 'passport',
  tags: ['institution', 'public', 'capabilities'],
};

const institutionPassportSchema: TemplateSchema = {
  version: '1.0.0',
  layout: 'two-column',
  slots: [
    { name: 'institutionName', type: 'text', required: true, description: 'Institution name' },
    { name: 'institutionLogo', type: 'text', required: false, description: 'Logo URL or base64' },
    { name: 'summary', type: 'markdown', required: true, description: 'Institution summary' },
    {
      name: 'capabilities',
      type: 'table',
      required: true,
      description: 'Capability listing',
      validation: { minItems: 1 },
    },
    { name: 'certifications', type: 'list', required: false, description: 'Certifications and accreditations' },
    { name: 'contactInfo', type: 'json', required: true, description: 'Contact information' },
    { name: 'lastUpdated', type: 'text', required: true, description: 'Last updated date' },
    { name: 'disclaimer', type: 'text', required: false, description: 'Legal disclaimer', defaultValue: 'Generated by Kadarn Delivery Engine' },
  ],
};

export const institutionPassport = createDeliveryTemplate({
  id: createDeliveryTemplateId(),
  name: 'InstitutionPassport',
  artifactType: 'html',
  version: 1,
  metadata: institutionPassportMetadata,
  schema: institutionPassportSchema,
  renderEngine: 'html',
});

// --- Aggregate ---

/** All pre-built templates as an array */
export const PRESET_TEMPLATES: DeliveryTemplate[] = [
  sponsorReportV1,
  sponsorReportV2,
  auditPack,
  evidencePack,
  institutionPassport,
];

/** Create a TemplateRegistry pre-loaded with all preset templates */
export function createDefaultRegistry(): TemplateRegistry {
  const registry = new TemplateRegistry();
  for (const template of PRESET_TEMPLATES) {
    registry.register(template);
  }
  return registry;
}
