---
name: gentle-architecture-patterns
description: Patrones arquitectónicos del ecosistema Gentleman — ADRs, separación
  Core/Service, engine boundaries, multi-tenant RLS, y event-driven architecture.
  Para revisar consistencia arquitectónica en cualquier cambio.
domain: software-engineering
subdomain: architecture
tags:
  - adr
  - architecture
  - multi-tenant
  - engine-boundaries
  - event-driven
  - gentle
version: '1.0'
---

# Patrones Arquitectónicos (Gentle)

## Referencias

- `docs/architecture/kadarn-platform-blueprint.md` — 22 secciones, especialmente §3 (Core/Service), §4 (RLS), §19 (Migration Rules)
- `docs/adr/adr-001` al `adr-021` — todas las decisiones arquitectónicas registradas
- `ARCHITECTURE.md` — visión general de capas

## Principios

1. **Core vs Service Layer** (ADR-001) — Core es multi-tenant genérico, Service es específico de engine. No mezclar.
2. **Multi-tenancy via RLS** (ADR-002) — toda tabla scoped a organización usa RLS, no application-level filtering.
3. **Engine boundaries** (ADR-003, ADR-004) — cada engine tiene un scope explícito. No duplicar funcionalidad entre engines.
4. **Event-first** (ADR-013) — comunicación cross-engine vía eventos, no llamadas directas.
5. **Append-only provenance** (ADR-014) — datos de auditoría y procedencia son inmutables.
6. **Decisiones registradas** — toda decisión arquitectónica significativa debe tener un ADR.

## Checklist de revisión

- [ ] ¿El cambio respeta las boundaries definidas en los ADRs?
- [ ] ¿Si introduce un nuevo engine, tiene ADR asociado?
- [ ] ¿La comunicación cross-engine usa eventos, no llamadas directas?
- [ ] ¿Los nuevos modelos de datos siguen el patrón multi-tenant con RLS?
- [ ] ¿Las dependencias entre paquetes respetan la jerarquía Core → Service?
