---
name: gentle-database-practices
description: Prácticas de base de datos del ecosistema Gentleman — migraciones
  idempotentes, RLS, esquema evolutivo, append-only, y naming conventions.
  Basado en el blueprint §19 (Migration Rules).
domain: software-engineering
subdomain: database
tags:
  - postgresql
  - supabase
  - migrations
  - rls
  - schema-design
  - append-only
  - gentle
version: '1.0'
---

# Prácticas de Base de Datos (Gentle)

## Referencias

- Blueprint §19 — Migration Rules (idempotencia, naming, orden)
- Blueprint §4 — RLS Model
- `database/migrations/` — migraciones existentes como referencia
- ADR-002 — Multi-tenant architecture

## Reglas de migración

1. **Idempotencia** — toda migración debe poder ejecutarse múltiples veces sin error
   (`IF NOT EXISTS`, `CREATE OR REPLACE`, `OR REPLACE`)
2. **Naming** — `NNNN_description.sql` con 3 dígitos + guión bajo + snake_case
3. **RLS** — toda tabla nueva con datos scoped a org debe tener `ENABLE ROW LEVEL SECURITY`
4. **Append-only** — tablas de auditoría y procedencia no permiten UPDATE/DELETE (triggers)
5. **No service_role** — las funciones SECURITY DEFINER deben validar org membership

## Checklist de revisión

- [ ] ¿La migración es idempotente?
- [ ] ¿Toda tabla nueva scoped a org tiene RLS + policies?
- [ ] ¿Las funciones SECURITY DEFINER validan `is_org_member()`?
- [ ] ¿Los tipos enum usan `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`?
- [ ] ¿Las migraciones siguen el naming convention?
- [ ] ¿Las tablas append-only tienen triggers que bloquean UPDATE/DELETE?
- [ ] ¿Los índices cubren los queries esperados (organization_id, scope)?
- [ ] ¿Los defaults de UUID usan `gen_random_uuid()` o `auth.uid()` según corresponda?
