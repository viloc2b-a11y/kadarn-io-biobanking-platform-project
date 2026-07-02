---
name: vilo-clinical-data-governance
description: Gobierno de datos clínicos en Kadarn — de-identificación, boundaries
  de PHI, data scope, FHIR mappings, y clasificaciones regulatorias. Para revisar
  cambios en modelos de datos clínicos, endpoints que exponen PHI, y transforms
  de datos.
domain: clinical-data-management
subdomain: data-governance
tags:
  - clinical-data
  - phi
  - de-identification
  - fhir
  - data-scope
  - consent
version: '1.0'
---

# Gobierno de Datos Clínicos (Vilo OS)

## Referencias

- `docs/architecture/fhir/FHIR-MAPPING.md` — mapeo de modelos Kadarn a FHIR R4
- `docs/architecture/kadarn-platform-blueprint.md` §10 — Data Governance
- `govierno/compliance/` — policies de privacidad y compliance
- Migration 021 (ai_layer) — training data con RLS
- `apps/api/src/lib/gdpr.ts` — erasure workflows

## Principios

1. **Data scope** — todo dato clínico tiene un `data_scope` que define su nivel
   de exposición: `de_identified`, `limited`, `phi`.
2. **PHI boundaries** — fields con PHI están explícitamente marcados y scoped
   a organización + programa.
3. **De-identificación** — antes de compartir entre organizaciones, los datos
   deben pasar por un pipeline de de-identificación.
4. **Consent tracking** — el consentimiento del donante se registra y respeta
   en todos los engines (collection, processing, exchange).

## Checklist de revisión

### Data scope y PHI

- [ ] ¿Los nuevos modelos de datos clínicos tienen un campo `data_scope`?
- [ ] ¿Los endpoints que exponen PHI verifican que el usuario está autorizado?
- [ ] ¿Los pipelines de exchange/de-identificación remueven PHI antes de compartir?
- [ ] ¿Los AI training data sets excluyen PHI o están correctamente scoped?
- [ ] ¿Las respuestas de API incluyen campos PHI que deberían filtrarse?

### Consentimiento

- [ ] ¿Las collections registran el consentimiento del donante?
- [ ] ¿El consentimiento es verificable antes de usar specimens en un programa?
- [ ] ¿Los cambios de consentimiento (revocación) se propagan a los engines?

### FHIR mappings

- [ ] ¿Los modelos siguen los mapeos definidos en FHIR-MAPPING.md?
- [ ] ¿Los recursos FHIR exportados incluyen metadatos de procedencia?
- [ ] ¿Los identifiers externos (LIS, EHR) se preservan en los mappings?

### Anti-patrones

- Data scope predeterminado a `phi` sin necesidad
- PHI fields en tablas sin RLS
- Endpoints que devuelven datos clínicos sin filtro de organización
- Consentimiento almacenado como string libre sin validación
- FHIR resources sin referencia al paciente/organización

## Ejemplo

```typescript
// MAL: endpoint devuelve datos clínicos sin scope check
const data = await supabase.from('clinical_records').select('*');

// BIEN: verifica data_scope + org membership
const data = await supabase.from('clinical_records')
  .select('*')
  .eq('organization_id', orgId)
  .in('data_scope', allowedScopes);
```
