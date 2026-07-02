---
name: vilo-lab-operations
description: Operaciones de laboratorio en Kadarn — integración con LIMS, flujo
  de datos de instrumentos, QC gates, monitoreo de temperatura, y cadena de
  custodia en entorno de laboratorio.
domain: clinical-data-management
subdomain: lab-operations
tags:
  - lims
  - lab-integration
  - qc
  - instrument
  - chain-of-custody
  - temperature-monitoring
version: '1.0'
---

# Operaciones de Laboratorio (Vilo OS)

## Referencias

- `docs/adr/adr-003-processing-engine-philosophy.md` — alcance del Processing Engine
- Blueprint §7 — Processing Engine
- Migration 017 (processing_engine) — processing_samples, aliquots, workflows, QC
- Migration 018 (logistics_engine) — shipments, containers, telemetry
- `packages/processing-engine/` — implementación del engine

## Dominio

El Processing Engine de Kadarn es un **LIMS acotado** (ADR-003). No reemplaza
un LIMS completo sino que orquesta los puntos de integración:

1. **Recepción** — registro de specimens entrantes con metadatos del envío
2. **Procesamiento** — transformaciones (centrifugación, extracción, etc.)
3. **Aliquoting** — creación de alícuotas con trazabilidad de volumen
4. **QC** — controles de calidad con resultados y criterios de aceptación
5. **Storage** — asignación de ubicaciones, monitoreo de condiciones
6. **Integración** — interfaces con LIMS externos vía webhooks/eventos

## Checklist de revisión

### Procesamiento

- [ ] ¿Cada paso de procesamiento registra qué instrumento lo realizó?
- [ ] ¿Los workflows de procesamiento tienen steps ordenados con dependencias?
- [ ] ¿Las transformaciones (ej: centrifugación) preservan el chain of custody?
- [ ] ¿Los cambios de volumen en alícuotas se registran como eventos?

### QC

- [ ] ¿Los resultados de QC tienen un resultado claro (pass/fail/inconclusive)?
- [ ] ¿Los specimens que fallan QC tienen un flujo de rechazo documentado?
- [ ] ¿Los QC results están vinculados al instrumento y operador?
- [ ] ¿Hay alertas configuradas para QC failures recurrentes?

### Almacenamiento y monitoreo

- [ ] ¿Las ubicaciones de almacenamiento están modeladas (freezer, rack, box)?
- [ ] ¿Los eventos de temperatura se registran con timestamp y sensor?
- [ ] ¿Las alertas de temperatura fuera de rango tienen destinatarios configurados?
- [ ] ¿Los shipments de specimens incluyen telemetría de temperatura?

### Integración con LIMS

- [ ] ¿Los webhooks entrantes tienen validación de origen (HMAC/API key)?
- [ ] ¿Las interfaces con LIMS externos son asíncronas (event-driven)?
- [ ] ¿Los identificadores externos (LIMS ID, accession number) se preservan?
- [ ] ¿Hay idempotencia en las operaciones de integración?

### Anti-patrones

- Processing steps sin referencia al instrumento
- QC results sin operador responsable
- Temperature logs sin referencia al container/shipment
- Webhooks entrantes sin autenticación
- LIMS externo accesible directamente desde el frontend

## Ejemplo

```typescript
// MAL: QC result sin operador ni instrumento
await supabase.from('quality_control_results').insert({
  aliquot_id: id,
  result: 'pass',
});

// BIEN: QC con trazabilidad completa
await supabase.from('quality_control_results').insert({
  aliquot_id: id,
  result: 'pass',
  instrument_run_id: runId,
  operator_id: user.id,
  qc_type: 'visual_inspection',
  result_metadata: { temperature_C: 22, humidity: 45 },
});
```
