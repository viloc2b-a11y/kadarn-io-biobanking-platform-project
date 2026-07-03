// ==========================================================================
// Templating — barrel export
// ==========================================================================

export {
  type TemplateMetadata,
  type TemplateSlot,
  type TemplateSchema,
  TemplateMetadataSchema,
  TemplateSlotSchema,
  TemplateSchemaSchema,
} from './types.js';

export { TemplateRegistry } from './registry.js';

export {
  sponsorReportV1,
  sponsorReportV2,
  auditPack,
  evidencePack,
  institutionPassport,
  PRESET_TEMPLATES,
  createDefaultRegistry,
} from './prebuilt.js';
