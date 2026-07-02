---
name: vilo-biospecimen-lifecycle
description: Modelo de ciclo de vida de biospecímenes en Kadarn — desde colección
  hasta disposición final. Basado en KRM-BNO Profile (ADR-009) y el blueprint
  de la plataforma. Para revisar cambios en modelos de datos, twins, y estados
  de especímenes.
domain: clinical-data-management
subdomain: biospecimen-lifecycle
tags:
  - biospecimen
  - aliquot
  - specimen-twin
  - chain-of-custody
  - krm-bno
version: '1.0'
---

# Ciclo de Vida de Biospecímenes (Vilo OS)

## Referencias

- `docs/adr/adr-009-krm-bno-profile.md` — perfil BNO con 19 fases del ciclo de vida
- `docs/architecture/lexicon.md` — definiciones de Biospecimen, Aliquot, Specimen Twin
- Migrations 024, 028, 029 — operational twins, transaction twins, collection twins
- `packages/operational-twins/` — implementación de SpecimenTwin y CollectionTwin

## Fases del ciclo de vida

El perfil BNO define 19 fases desde Discovery hasta Settlement. Las fases
críticas para code review son:

1. **Collection** — registro de la colección, metadatos del donante, consentimiento
2. **Processing** — transformación de specimen padre a alícuotas hijas
3. **Aliquoting** — creación de alícuotas con volume tracking
4. **QC** — controles de calidad, resultados, aceptación/rechazo
5. **Storage** — ubicación, condiciones, freeze-thaw tracking
6. **Shipment** — transferencia entre organizaciones, cadena de custodia
7. **Analysis** — uso en ensayos, consumo de alícuotas
8. **Disposal** — disposición final, destrucción documentada

## Checklist de revisión

### Modelo de datos

- [ ] ¿Cada entidad física (specimen, aliquot) tiene un Specimen Twin asociado?
- [ ] ¿Los twins son append-only? (migration 032 enforce)
- [ ] ¿Los cambios de estado quedan registrados como eventos en el twin?
- [ ] ¿El volume tracking de alícuotas descuenta correctamente el consumo?
- [ ] ¿Las relaciones padre-hijo (specimen → aliquots) están modeladas?

### Chain of custody

- [ ] ¿Cada transferencia entre organizaciones genera un Transaction Twin?
- [ ] ¿El shipment twin registra temperaturas y condiciones ambientales?
- [ ] ¿Los eventos de freeze-thaw se registran en el twin correspondiente?
- [ ] ¿La procedencia (provenance graph) conecta todos los eventos del ciclo?

### Anti-patrones

- Mutación de registros append-only en provenance_nodes (viola migration 032)
- Specimen twin sin evento inicial de creación
- Alícuotas sin referencia al specimen padre
- Transferencias sin registro de temperatura
- QC results sin referencia a la alícuota analizada

## Ejemplo

```typescript
// MAL: crear alícuota sin asociar al specimen padre
const aliquot = await supabase.from('aliquots').insert({ volume_ml: 1.5 });

// BIEN: crear alícuota con parent + twin event
const aliquot = await supabase.from('aliquots').insert({
  parent_specimen_id: specimenId,
  volume_ml: 1.5,
  created_by: user.id,
});
await recordSpecimenTwinProvenance(aliquot.id, orgId, ...);
```
