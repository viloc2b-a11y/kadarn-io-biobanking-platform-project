<!--
Este PR es el execution_report formal. Hermes lo completa antes de pedir el human merge gate.
No escribir "todo funciona" sin evidencia. Los checks determinísticos deben coincidir con lo que CI reporta arriba.
-->

## Work Order

- **LOOP ID / Issue:** #
- **Baseline verificado (HEAD inicial):**
- **HEAD final (este PR):**
- **Rama de trabajo:**

## Implementation summary

<!-- Qué se implementó realmente, en 3-6 líneas. No copiar el objective del issue: describir el resultado. -->

## Files modified

<!-- Lista real de paths tocados. Si algo no estaba en "allowed_changes" del work order, explicarlo explícitamente en Deviations. -->

## Deterministic checks

<!-- Estos deben coincidir con el resultado real de CI (ci.yml + architecture.yml). No marcar a mano si CI no corrió o falló. -->

- [ ] `npm run typecheck` — pass
- [ ] `npm run test` (o subset relevante) — pass
- [ ] `npm run build` — pass
- [ ] `npm run arch:gate` — pass
- [ ] Migrations aplicadas / reset limpio (si aplica)
- [ ] Ningún path de `forbidden_changes` fue modificado

## Semantic review

<!-- Esto es juicio, no un check automático. Hermes y quien apruebe deben completarlo con criterio. -->

- **Scope alignment:** <!-- pass / fail / parcial -->
- **Architecture alignment:** <!-- respeta Claim/Evidence/Provenance/Confidence tal como están definidos hoy -->
- **Acceptance criteria:** <!-- ej. 6/8 cumplidos -->
- **Unresolved risks / deferred items:**

## Acceptance criteria checklist

<!-- Copiar los criterios del work order y marcar uno por uno -->

- [ ]
- [ ]

## Deviations from work order

<!-- Cualquier cosa que se hizo distinto a lo ordenado, y por qué. Si no hay ninguna, escribir "Ninguna". -->

## Recommended next action

<!-- Qué debería pasar después: mergear, corregir algo puntual, abrir nuevo LOOP, congelar. -->

---

### Human merge gate

- [ ] Confirmo que revisé este execution report contra el work order original y autorizo el merge.
