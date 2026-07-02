---
name: reviewing-multitenant-access-control
description: Revisa el aislamiento multi-tenant en Kadarn: RLS policies de Supabase,
  function-level access control en API routes, y anti-patrones de cross-tenant leakage.
  Para usar durante code review de cambios que toquen datos scoped a organización.
domain: software-engineering
subdomain: security-review
tags:
  - multi-tenant
  - supabase
  - rls
  - access-control
  - row-level-security
  - kadarn
  - organization-isolation
version: '1.0'
---

# Revisión de Control de Acceso Multi-Tenant

Kadarn usa **RLS de Supabase (PostgreSQL)** como mecanismo primario de
aislamiento multi-tenant, complementado con verificación de autenticación
a nivel de aplicación (`withAuth`). Toda tabla con datos sensibles debe
tener RLS habilitado y policies que filtren por organización.

## Principios

1. **Deny-by-default**: solo lo explícitamente permitido por un policy pasa.
2. **RLS como primera línea de defensa**: la base de datos es la autoridad
   final sobre qué filas puede ver cada usuario.
3. **Capas complementarias**: RLS + `withAuth` (app-level) + scoped queries.
4. **Visibilidad por scope**: toda entidad scoped a organización tiene una
   columna `visibility_scope` que define su nivel de exposición.

## Checklist de revisión

### 1. RLS habilitado en todas las tablas scoped

- [ ] ¿La migración tiene `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`?
- [ ] ¿Hay al menos un policy SELECT para usuarios autenticados?
- [ ] ¿Tablas nuevas (engine migrations) siguen el patrón?

### 2. Policies de organización

Verificar que los policies usen `is_org_member()`, `is_org_admin()`, o
`check_visibility()` para filtrar por organización:

```sql
-- Patrón correcto para tablas scoped a organización
CREATE POLICY {tabla}_select ON public.{tabla}
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            check_visibility(organization_id, visibility_scope)
            OR is_org_admin(organization_id)
        )
    );
```

- [ ] ¿El policy filtra por `organization_id` directa o indirectamente?
- [ ] ¿Usa `check_visibility()` donde corresponde?
- [ ] ¿Los INSERTs asignan `organization_id` desde la org del usuario creador?
- [ ] ¿Los UPDATEs/DELETEs verifican que el usuario pertenece a la org?

### 3. Program-scoped tables

Para tablas que dependen de un programa (no directamente de una org):

```sql
-- Patrón correcto para tablas scoped a programa
CREATE POLICY {tabla}_select ON public.{tabla}
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND can_access_program(program_id)
    );
```

- [ ] ¿La tabla usa `program_id` + `can_access_program()`?
- [ ] ¿O tiene `organization_id` directa y usa `is_org_member()`?

### 4. Function-level access control en API routes

- [ ] ¿Toda ruta que expone datos multi-tenant usa `withAuth`?
- [ ] ¿Hay rutas que confían solo en el frontend para filtrar?
- [ ] ¿Las Server Actions de Next.js verifican pertenencia a organización?
- [ ] ¿Hay queries SELECT sin filtro de organización que deberían tenerlo?

### 5. Anti-patrones de cross-tenant leakage

- [ ] **SELECT sin WHERE organization_id**: consultas que no filtran por
      organización y dependen solo de RLS — frágil si el policy tiene errores.
- [ ] **Joins entre tablas que exponen datos de otra org**: verificar que
      el RLS se aplique a todas las tablas en el JOIN.
- [ ] **Storage buckets sin RLS**: archivos subidos sin verificación de org.
- [ ] **Eventos o webhooks que incluyen datos de otra org** en el payload.
- [ ] **Uso de service_role para queries de usuario**: `service_role` bypass
      todo RLS. Solo debe usarse para operaciones internas (background jobs,
      webhooks entrantes), nunca para responder a requests de usuario.
- [ ] **Filtro por `created_by` en vez de `organization_id`**: en un contexto
      multi-tenant, filtrar solo por creador puede exponer datos si el usuario
      cambia de org. Los resources deben scoping a la org, no al usuario.

### 6. Helper functions (migration 009)

- [ ] ¿Se usan consistentemente en todos los policies nuevos?
- [ ] `current_user_id()` → shorthand para `auth.uid()`
- [ ] `is_org_member(org_id)` → membresía activa
- [ ] `is_org_admin(org_id)` → rol admin en la org
- [ ] `check_visibility(org_id, scope)` → chequeo unificado por visibility_scope
- [ ] `can_access_program(program_id)` → participante activo del programa

### 7. Casos borde

- [ ] **Cross-tenant búsquedas**: Discovery y Feasibility engines pueden
      necesitar ver datos de otras orgs para matching. Verificar que el RLS
      permita `visibility_scope = 'network'` para esos casos, no que se use
      `service_role` como workaround.
- [ ] **Org admin visibility**: admins dentro de su org ven todo lo scoped a
      esa org, pero no datos de otras orgs.
- [ ] **Suspensión de membresía**: si un miembro se vuelve `suspended`,
      ¿el RLS lo excluye inmediatamente? (porque usa `status = 'active'`)

## Ejemplo de revisión

```sql
-- MAL: sin filtro de org en el INSERT
CREATE POLICY items_insert ON public.items
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
-- El usuario puede insertar items con cualquier organization_id

-- BIEN: INSERT verifica org del creador
CREATE POLICY items_insert ON public.items
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND is_org_member(organization_id)
    );
```

```typescript
// MAL: solo filtro por created_by, no por organización
supabase.from('items').select('*').eq('created_by', user.id);

// BIEN: filtro por organización + scoping a la org del usuario
const { data: memberships } = await supabase
  .from('organization_memberships')
  .select('organization_id')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();

supabase.from('items')
  .select('*')
  .eq('organization_id', memberships.organization_id);
```
