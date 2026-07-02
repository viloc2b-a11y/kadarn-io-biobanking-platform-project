---
name: gentle-testing-strategy
description: Estrategia de testing del ecosistema Gentleman — tipos de test,
  cobertura, patrones de integración, mocks, y validación de calidad.
  Para revisar que los tests acompañen correctamente los cambios.
domain: software-engineering
subdomain: testing
tags:
  - testing
  - vitest
  - integration-tests
  - e2e
  - test-patterns
  - gentle
version: '1.0'
---

# Estrategia de Testing (Gentle)

## Referencias

- `tests/` — estructura de tests existentes
- `tests/vitest.config.ts` — configuración de vitest
- Blueprint §20 — Verification & Testing

## Pirámide de tests

Kadarn usa una pirámide con énfasis en tests de integración:

1. **Unit tests** — engines, validación, lógica pura (vitest)
2. **Integration tests** — rutas API con Supabase real, RLS, y autenticación
3. **E2E** — flujos completos multi-engine (pilot tests)
4. **Security tests** — RLS isolation, multi-tenant, access control
5. **Performance** — benchmarks de queries y endpoints

## Checklist de revisión

- [ ] ¿Los cambios en lógica de negocio tienen tests unitarios?
- [ ] ¿Los cambios en rutas API tienen tests de integración?
- [ ] ¿Los cambios en RLS/multi-tenancy tienen tests de aislamiento?
- [ ] ¿Los tests usan la estructura existente (describe/it/expect)?
- [ ] ¿Los tests de integración usan `createRouteClient()` real, no mocked?
- [ ] ¿Cubren casos borde (error, empty state, auth failure)?
- [ ] ¿No hay tests flaky (dependencia de estado global, timers)?
