---
name: gentle-performance-baseline
description: Baseline de performance del ecosistema Gentleman — N+1 queries,
  paginación, rate limiting, índices, y patrones de query eficientes para
  el stack Supabase/PostgreSQL/Next.js.
domain: software-engineering
subdomain: performance
tags:
  - performance
  - n-plus-one
  - pagination
  - rate-limiting
  - queries
  - indexing
  - gentle
version: '1.0'
---

# Performance Baseline (Gentle)

## Referencias

- `packages/platform-services/src/rate-limiting/` — rate limiting implementation
- `apps/api/src/lib/rate-limit.ts` — rate limit helpers
- Blueprint §16 — Performance requirements
- Migraciones existentes — índices y constraints

## Principios

1. **Toda lista debe tener paginación** — nunca SELECT sin LIMIT/OFFSET
2. **N+1 detection** — queries en loop son anti-patrón; usar batch o JOIN
3. **Rate limiting** — endpoints públicos/autenticados deben tener rate limiting
4. **Índices** — toda columna en WHERE o JOIN debe tener índice
5. **RLS performance** — policies que usan subqueries deben tener índices en las tablas referenciadas

## Checklist de revisión

- [ ] ¿Los endpoints de listado tienen paginación (limit/offset/cursor)?
- [ ] ¿Hay queries en loop que deberían ser batch?
- [ ] ¿Los nuevos endpoints tienen rate limiting?
- [ ] ¿Las columnas usadas en WHERE/JOIN tienen índices?
- [ ] ¿Los RLS policies usan funciones con índices (is_org_member vs subquery directa)?
- [ ] ¿Hay SELECT * en tablas grandes que deberían project columnas específicas?
- [ ] ¿Las transacciones largas se evitan en endpoints de usuario?
