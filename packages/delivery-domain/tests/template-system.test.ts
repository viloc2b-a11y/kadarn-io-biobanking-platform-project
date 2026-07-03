// ==========================================================================
// Template System Tests — Sprint 9.5
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { createDeliveryTemplateId } from '../src/value-objects/ids.js';
import {
  createDeliveryTemplate,
  bumpTemplateVersion,
  computeTemplateChecksum,
  DeliveryTemplateSchema,
} from '../src/entities/delivery-template.js';
import { TemplateRegistry } from '../src/templating/registry.js';
import {
  sponsorReportV1,
  sponsorReportV2,
  auditPack,
  evidencePack,
  institutionPassport,
  PRESET_TEMPLATES,
  createDefaultRegistry,
} from '../src/templating/prebuilt.js';

// Helpers
const baseTemplate = () => ({
  id: createDeliveryTemplateId(),
  name: 'TestTemplate',
  artifactType: 'pdf' as const,
  version: 1,
  metadata: {
    displayName: 'Test Template',
    description: 'Test',
    category: 'report' as const,
  },
  schema: {
    version: '1.0.0',
    slots: [
      { name: 'title', type: 'text' as const, required: true, description: 'Title' },
      { name: 'data', type: 'json' as const, required: false, description: 'Data' },
    ],
  },
  renderEngine: 'handlebars',
});

// ==========================================================================
// Template Entity — checksum + version bump
// ==========================================================================

describe('Template Entity — checksum', () => {
  it('computeTemplateChecksum returns 64-char hex string', () => {
    const t = baseTemplate();
    const cs = computeTemplateChecksum(t);
    expect(cs).toMatch(/^[a-fA-F0-9]{64}$/);
  });

  it('checksum is deterministic for identical content', () => {
    const t = baseTemplate();
    expect(computeTemplateChecksum(t)).toBe(computeTemplateChecksum({ ...t }));
  });

  it('checksum changes when name differs', () => {
    const a = computeTemplateChecksum(baseTemplate());
    const b = computeTemplateChecksum({ ...baseTemplate(), name: 'OtherName' });
    expect(a).not.toBe(b);
  });

  it('checksum changes when version differs', () => {
    const a = computeTemplateChecksum(baseTemplate());
    const b = computeTemplateChecksum({ ...baseTemplate(), version: 2 });
    expect(a).not.toBe(b);
  });

  it('checksum changes when metadata differs', () => {
    const a = computeTemplateChecksum(baseTemplate());
    const b = computeTemplateChecksum({
      ...baseTemplate(),
      metadata: { ...baseTemplate().metadata, displayName: 'Changed' },
    });
    expect(a).not.toBe(b);
  });

  it('checksum changes when schema differs', () => {
    const a = computeTemplateChecksum(baseTemplate());
    const b = computeTemplateChecksum({
      ...baseTemplate(),
      schema: {
        version: '2.0.0',
        slots: [{ name: 'other', type: 'text', required: true, description: 'Other' }],
      },
    });
    expect(a).not.toBe(b);
  });

  it('bumpTemplateVersion increments version', () => {
    const t = createDeliveryTemplate(baseTemplate());
    const bumped = bumpTemplateVersion(t);
    expect(bumped.version).toBe(2);
    expect(bumped.name).toBe(t.name);
    expect(bumped.id).toBe(t.id);
  });

  it('bumpTemplateVersion recalculates checksum', () => {
    const t = createDeliveryTemplate(baseTemplate());
    const bumped = bumpTemplateVersion(t);
    expect(bumped.checksum).not.toBe(t.checksum);
    expect(bumped.checksum).toMatch(/^[a-fA-F0-9]{64}$/);
  });

  it('created template has valid checksum auto-computed', () => {
    const t = createDeliveryTemplate(baseTemplate());
    expect(t.checksum).toMatch(/^[a-fA-F0-9]{64}$/);
    DeliveryTemplateSchema.parse(t); // no throw
  });

  it('version must be positive integer via schema', () => {
    const result = DeliveryTemplateSchema.safeParse({
      id: createDeliveryTemplateId(),
      name: 'Test',
      artifactType: 'pdf',
      version: 0,
      metadata: { displayName: 'T', description: 'T', category: 'report' },
      schema: { version: '1.0.0', slots: [{ name: 'x', type: 'text', required: true, description: 'x' }] },
      renderEngine: 'test',
      checksum: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// TemplateSchema
// ==========================================================================

describe('TemplateSchema', () => {
  it('holds ordered slots', () => {
    const t = createDeliveryTemplate({
      ...baseTemplate(),
      schema: {
        version: '1.0.0',
        slots: [
          { name: 'first', type: 'text', required: true, description: 'First' },
          { name: 'second', type: 'json', required: false, description: 'Second' },
        ],
      },
    });
    expect(t.schema.slots).toHaveLength(2);
    expect(t.schema.slots[0].name).toBe('first');
    expect(t.schema.slots[1].name).toBe('second');
  });

  it('identifies required slots', () => {
    const t = createDeliveryTemplate({
      ...baseTemplate(),
      schema: {
        version: '1.0.0',
        slots: [
          { name: 'requiredField', type: 'text', required: true, description: 'R' },
          { name: 'optionalField', type: 'text', required: false, description: 'O' },
        ],
      },
    });
    const required = t.schema.slots.filter(s => s.required);
    const optional = t.schema.slots.filter(s => !s.required);
    expect(required).toHaveLength(1);
    expect(required[0].name).toBe('requiredField');
    expect(optional).toHaveLength(1);
    expect(optional[0].name).toBe('optionalField');
  });

  it('slot validation rules are accessible', () => {
    const t = createDeliveryTemplate({
      ...baseTemplate(),
      schema: {
        version: '1.0.0',
        slots: [{
          name: 'validatedField',
          type: 'text',
          required: true,
          description: 'V',
          validation: { minLength: 1, maxLength: 100, pattern: '^[A-Z]' },
        }],
      },
    });
    const slot = t.schema.slots[0];
    expect(slot.validation).toBeDefined();
    expect(slot.validation!.minLength).toBe(1);
    expect(slot.validation!.maxLength).toBe(100);
    expect(slot.validation!.pattern).toBe('^[A-Z]');
  });

  it('rejects empty slots array via schema', () => {
    const result = DeliveryTemplateSchema.safeParse({
      id: createDeliveryTemplateId(),
      name: 'Test',
      artifactType: 'pdf',
      version: 1,
      metadata: { displayName: 'T', description: 'T', category: 'report' },
      schema: { version: '1.0.0', slots: [] },
      renderEngine: 'test',
      checksum: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// TemplateRegistry
// ==========================================================================

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('register', () => {
    it('registers and retrieves by id', () => {
      const t = createDeliveryTemplate(baseTemplate());
      registry.register(t);
      expect(registry.findById(t.id)).toBe(t);
    });

    it('throws on duplicate id', () => {
      const t = createDeliveryTemplate(baseTemplate());
      registry.register(t);
      expect(() => registry.register(t)).toThrow('Template already registered');
    });
  });

  describe('has / count', () => {
    it('has returns true for registered template', () => {
      const t = createDeliveryTemplate(baseTemplate());
      registry.register(t);
      expect(registry.has(t.id)).toBe(true);
    });

    it('has returns false for unknown id', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('count returns correct number', () => {
      expect(registry.count).toBe(0);
      registry.register(createDeliveryTemplate(baseTemplate()));
      expect(registry.count).toBe(1);
      registry.register(createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'T2' }));
      expect(registry.count).toBe(2);
    });
  });

  describe('findByName', () => {
    it('returns all versions sorted by version', () => {
      const v1 = createDeliveryTemplate({ ...baseTemplate(), name: 'MyReport', version: 1 });
      const v2 = createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'MyReport', version: 2 });
      const v3 = createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'MyReport', version: 3 });
      registry.register(v2);
      registry.register(v3);
      registry.register(v1); // out of order
      const results = registry.findByName('MyReport');
      expect(results).toHaveLength(3);
      expect(results[0].version).toBe(1);
      expect(results[1].version).toBe(2);
      expect(results[2].version).toBe(3);
    });

    it('returns empty array when name not found', () => {
      expect(registry.findByName('NonExistent')).toEqual([]);
    });
  });

  describe('findLatest', () => {
    it('returns highest version', () => {
      const v1 = createDeliveryTemplate({ ...baseTemplate(), name: 'MyReport', version: 1 });
      const v3 = createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'MyReport', version: 3 });
      registry.register(v1);
      registry.register(v3);
      const latest = registry.findLatest('MyReport');
      expect(latest).toBeDefined();
      expect(latest!.version).toBe(3);
    });

    it('returns undefined when name not found', () => {
      expect(registry.findLatest('NonExistent')).toBeUndefined();
    });
  });

  describe('findByNameAndVersion', () => {
    it('returns exact match', () => {
      const v2 = createDeliveryTemplate({ ...baseTemplate(), name: 'MyReport', version: 2 });
      registry.register(v2);
      expect(registry.findByNameAndVersion('MyReport', 2)).toBe(v2);
    });

    it('returns undefined for non-existent version', () => {
      const v1 = createDeliveryTemplate({ ...baseTemplate(), name: 'MyReport', version: 1 });
      registry.register(v1);
      expect(registry.findByNameAndVersion('MyReport', 99)).toBeUndefined();
    });

    it('returns undefined for non-existent name', () => {
      expect(registry.findByNameAndVersion('NonExistent', 1)).toBeUndefined();
    });
  });

  describe('listByCategory', () => {
    it('filters by category', () => {
      const report = createDeliveryTemplate({ ...baseTemplate(), metadata: { ...baseTemplate().metadata, category: 'report' } });
      const audit = createDeliveryTemplate({
        ...baseTemplate(), id: createDeliveryTemplateId(), name: 'AuditT',
        metadata: { displayName: 'A', description: 'A', category: 'audit' },
      });
      registry.register(report);
      registry.register(audit);
      expect(registry.listByCategory('report')).toHaveLength(1);
      expect(registry.listByCategory('audit')).toHaveLength(1);
      expect(registry.listByCategory('pack')).toHaveLength(0);
    });
  });

  describe('listAll', () => {
    it('returns all templates', () => {
      const t1 = createDeliveryTemplate(baseTemplate());
      const t2 = createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'T2' });
      registry.register(t1);
      registry.register(t2);
      expect(registry.listAll()).toHaveLength(2);
    });
  });

  describe('deprecate', () => {
    it('marks template as deprecated', () => {
      const t = createDeliveryTemplate(baseTemplate());
      registry.register(t);
      registry.deprecate(t.id, 'replacement-id');
      const deprecated = registry.findById(t.id)!;
      expect(deprecated.metadata.deprecated).toBe(true);
      expect(deprecated.metadata.supersededBy).toBe('replacement-id');
    });

    it('throws for non-existent template', () => {
      expect(() => registry.deprecate('nonexistent', 'replacement-id')).toThrow('Template not found');
    });
  });

  describe('clear', () => {
    it('removes all templates', () => {
      registry.register(createDeliveryTemplate(baseTemplate()));
      registry.register(createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'T2' }));
      expect(registry.count).toBe(2);
      registry.clear();
      expect(registry.count).toBe(0);
      expect(registry.listAll()).toEqual([]);
    });
  });
});

// ==========================================================================
// Pre-built templates
// ==========================================================================

describe('Pre-built templates', () => {
  it('PRESET_TEMPLATES contains 5 templates', () => {
    expect(PRESET_TEMPLATES).toHaveLength(5);
  });

  it('createDefaultRegistry contains 5 templates', () => {
    const registry = createDefaultRegistry();
    expect(registry.count).toBe(5);
  });

  it('SponsorReport has v1 and v2', () => {
    const reports = PRESET_TEMPLATES.filter(t => t.name === 'SponsorReport');
    expect(reports).toHaveLength(2);
    expect(reports.some(t => t.version === 1)).toBe(true);
    expect(reports.some(t => t.version === 2)).toBe(true);
  });

  it('SponsorReport v1 has 5 slots', () => {
    expect(sponsorReportV1.schema.slots).toHaveLength(5);
  });

  it('SponsorReport v2 has 7 slots', () => {
    expect(sponsorReportV2.schema.slots).toHaveLength(7);
  });

  it('AuditPack has 4 slots', () => {
    expect(auditPack.schema.slots).toHaveLength(4);
  });

  it('EvidencePack has 6 slots', () => {
    expect(evidencePack.schema.slots).toHaveLength(6);
  });

  it('InstitutionPassport has 8 slots', () => {
    expect(institutionPassport.schema.slots).toHaveLength(8);
  });

  it('each template has a valid checksum', () => {
    for (const t of PRESET_TEMPLATES) {
      expect(t.checksum).toMatch(/^[a-fA-F0-9]{64}$/);
    }
  });

  it('all templates have unique ids', () => {
    const ids = PRESET_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('template categories are correct', () => {
    const reports = PRESET_TEMPLATES.filter(t => t.metadata.category === 'report');
    const packs = PRESET_TEMPLATES.filter(t => t.metadata.category === 'pack');
    const audits = PRESET_TEMPLATES.filter(t => t.metadata.category === 'audit');
    const passports = PRESET_TEMPLATES.filter(t => t.metadata.category === 'passport');

    expect(reports).toHaveLength(2); // SponsorReport v1 + v2
    expect(packs).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(passports).toHaveLength(1);
  });

  it('SponsorReport v2 is latest version in registry', () => {
    const registry = createDefaultRegistry();
    const latest = registry.findLatest('SponsorReport');
    expect(latest).toBeDefined();
    expect(latest!.version).toBe(2);
  });

  it('all templates in registry are retrievable by id', () => {
    const registry = createDefaultRegistry();
    for (const t of PRESET_TEMPLATES) {
      expect(registry.findById(t.id)).toBeDefined();
    }
  });

  it('EvidencePack confidenceLevel slot has pattern validation', () => {
    const slot = evidencePack.schema.slots.find(s => s.name === 'confidenceLevel');
    expect(slot).toBeDefined();
    expect(slot!.validation?.pattern).toBe('^(HIGH|MEDIUM|LOW)$');
  });

  it('InstitutionPassport capabilities slot requires minItems', () => {
    const slot = institutionPassport.schema.slots.find(s => s.name === 'capabilities');
    expect(slot).toBeDefined();
    expect(slot!.validation?.minItems).toBe(1);
  });

  it('InstitutionPassport disclaimer has default value', () => {
    const slot = institutionPassport.schema.slots.find(s => s.name === 'disclaimer');
    expect(slot).toBeDefined();
    expect(slot!.defaultValue).toBe('Generated by Kadarn Delivery Engine');
    expect(slot!.required).toBe(false);
  });
});
