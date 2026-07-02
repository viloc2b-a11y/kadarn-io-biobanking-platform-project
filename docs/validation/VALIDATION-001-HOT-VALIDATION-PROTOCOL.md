# VALIDATION-001 — Hot Validation Protocol

**Documento:** VALIDATION-001  
**Estado:** Activo  
**Versión:** 1.0  
**Fecha:** 2026-06-28  
**Alcance:** Validación de producto Kadarn con usuarios reales — no QA de software  
**Primera aplicación:** Institutional Discovery / Discovery Workbench (`/workspace/discovery`)

---

## Veredicto en una línea

> Kadarn deja de validarse como arquitectura cuando un **Site Director real**, con **documentos reales de su institución**, obtiene valor comprensible en una sesión — sin explicación técnica previa.

Este protocolo define **cómo** capturar esa evidencia de forma repetible.

---

## Quick path — primera validación Discovery

1. **Congelar** Discovery (sin nuevas pestañas, componentes ni APIs) durante el ciclo de validación.
2. **Preparar** entorno, dataset mínimo (5–15 documentos reales), Site Director + observador Kadarn.
3. **Ejecutar** sesión de 45–90 min siguiendo el escenario §5 — **sin ayuda del equipo de producto** salvo bloqueo técnico.
4. **Registrar** TTFV, WOW moment, fricciones y respuestas a preguntas §6.
5. **Sintetizar** hallazgos → cambios → priorización en 48 h.
6. **Decidir:** ¿Continuamos hacia Evidence Promotion Pipeline o volvemos a Discovery?

---

## 1. Objetivo

### Objetivo principal

Demostrar que Kadarn ayuda a un **Site Director** a **entender qué Kadarn reconstruyó sobre su institución** a partir de documentos reales, y a **saber qué hacer a continuación** — con lenguaje institucional, no de dashboard técnico.

### Objetivos secundarios (observables, no bloqueantes)

| # | Objetivo | Señal de éxito |
|---|----------|----------------|
| O1 | El participante reconoce su institución en la reconstrucción | Cita nombres, estudios, capacidades o fechas correctas sin que se las indiquemos |
| O2 | El participante distingue lo provisional de lo definitivo | Usa términos como “pendiente de revisar”, “falta evidencia”, no “Kadarn nos certifica” |
| O3 | El participante identifica al menos una acción útil | Subir documento, corregir entidad, solicitar evidencia, anotar un miss |
| O4 | Kadarn captura feedback estructurado | Al menos 1 Validation Note + 1 acción de curation o intención clara de hacerlo |

### Anti-objetivos (fuera de alcance de esta validación)

- Validar Evidence Promotion Pipeline
- Validar marketplace, matching o fulfillment
- Validar precisión algorítmica como métrica de producto (eso es evaluación de modelo, no de valor)
- Validar rendimiento técnico bajo carga
- Validar experiencia Sponsor

### Decisión que este protocolo desbloquea

| Resultado | Decisión estratégica |
|-----------|-------------------|
| **Validación positiva** | Avanzar con confianza hacia **Evidence Promotion Pipeline**, sabiendo que Discovery ya demostró valor |
| **Validación mixta** | Iteración acotada en copy/UX/flujo de Discovery — **sin** expandir arquitectura |
| **Validación negativa** | Pausar Promotion; rediseñar hipótesis de valor antes de más ingeniería |

---

## 2. Preparación

### 2.1 Congelamiento de arquitectura (obligatorio durante el ciclo)

Durante **VALIDATION-001-Cycle-01** (primera aplicación Discovery):

| Permitido | Prohibido |
|-----------|-----------|
| Fixes de bugs que impidan completar el escenario | Nuevas pestañas, paneles o rutas Discovery |
| Copy/UX micro-ajustes documentados post-sesión | Nuevas APIs o writes a Evidence Core |
| Configuración de entorno y datos de prueba | Evidence Promotion Pipeline |
| Registro de hallazgos y Validation Notes en producto | Refactors de arquitectura “de paso” |

**Duración recomendada del freeze:** 5–10 días hábiles — tiempo suficiente para 2–3 sesiones hot validation + síntesis.

### 2.2 Entorno

| Requisito | Detalle |
|-----------|---------|
| URL | `/workspace/discovery` (Site Director autenticado con `active_org_id`) |
| Rol observador opcional | Kadarn Reviewer en `/koc/discovery` — solo observación, no coaching en vivo |
| Supabase | Migraciones Discovery (046–050) aplicadas; pipeline capaz de persistir outputs |
| Cuenta | Site Director de la org del dataset — **no** cuenta genérica de demo |
| Grabación | Consentimiento explícito: pantalla + audio; alternativa: dos observadores con plantilla |

### 2.3 Checklist pre-sesión

- [ ] Org creada y vinculada al participante
- [ ] Documentos del dataset subidos al pipeline (Layer 0) o listos para upload en sesión
- [ ] Sesión Discovery abierta previamente **solo si** el escenario lo permite (ver §5 variantes)
- [ ] Observador con acceso a Validation Notes y plantilla de hallazgos (§11)
- [ ] Participante informado: *“Kadarn reconstruye desde artefactos disponibles; nada aquí es evidencia canónica”*
- [ ] Cronómetro / registro TTFV preparado
- [ ] Congelamiento de arquitectura comunicado al equipo

### 2.4 Roles en la sala

| Rol | Responsabilidad |
|-----|-----------------|
| **Participante (Site Director)** | Usa el producto como lo haría en su trabajo |
| **Facilitador Kadarn** | Observa, cronometra, anota fricciones — **no guía** salvo bloqueo |
| **Scribe (opcional)** | Completa plantilla de hallazgos en tiempo real |
| **Ingeniero (opcional, fuera de sala)** | Solo si hay fallo técnico; no participa en preguntas de producto |

---

## 3. Dataset

### Principio

El dataset debe ser **real, incompleto e imperfecto** — como la vida institucional. Un dataset demasiado limpio invalida la prueba de producto.

### Dataset mínimo viable (VALIDATION-001-Discovery-v1)

| Categoría | Cantidad | Ejemplos |
|-----------|----------|----------|
| Documentos identificables | 5–15 | Protocolos, CVs de investigadores, listados de equipamiento, informes de auditoría, publicaciones |
| Documentos ambiguos | 1–3 | PDFs escaneados, slides, emails exportados |
| Documentos ausentes (intencional) | 2–5 gaps conocidos | Evidencia que el Site Director sabe que falta |
| Idioma | Preferiblemente mixto si la institución lo es | ES / EN / FR según org real |

### Metadatos del dataset (registrar antes de la sesión)

```yaml
validation_id: VALIDATION-001-Cycle-01-Session-XX
organization: <nombre>
site_director: <rol, no nombre si confidencial>
document_count: N
document_types: [SOP, CV, protocol, ...]
known_gaps: [gap1, gap2]
pipeline_run_id: <si aplica>
date: YYYY-MM-DD
```

### Criterios de exclusión del dataset

- No usar solo datos sintéticos de demo
- No usar documentos de otra institución “parecidos”
- No pre-etiquetar entidades/capabilities para el participante antes de la sesión

---

## 4. Participantes

### Perfil requerido — Site Director

| Atributo | Requisito |
|----------|-----------|
| Rol | Director/a de investigación, responsable de operaciones clínicas, o equivalente |
| Conocimiento institucional | Conoce la historia, capacidades y documentación de **su** site |
| Familiaridad técnica | **No** requerida con pipelines, grafos ni IA |
| Incentivo | Curiosidad por ver “qué sabe Kadarn de nosotros” — no compensación que distorsione crítica |

### Perfil opcional — Kadarn Reviewer (observador interno)

- Conoce Discovery Workbench
- **No** corrige al participante en vivo
- Registra Validation Notes post-sesión con categorías del producto

### Tamaño de muestra (ciclo 01)

| Fase | Sesiones | Objetivo |
|------|----------|----------|
| Piloto interno | 1 (dry run) | Calibrar timing y plantilla |
| Hot validation | 2–3 Site Directors | Evidencia de valor repetible |
| Síntesis | — | Decisión Promotion vs. iteración Discovery |

---

## 5. Escenario

### Escenario principal — “Primera reconstrucción institucional”

**Duración:** 45–90 minutos  
**Premisa al participante:**

> “Kadarn ha procesado algunos documentos de vuestra institución. Queremos ver si lo que reconstruye os resulta útil para entender vuestra huella de evidencia — y qué haríais a partir de aquí.”

### Secuencia (no saltar pasos)

| Paso | Acción del participante | Observamos |
|------|-------------------------|------------|
| S0 | Login → `/workspace/discovery` | ¿Encuentra el entry point sin ayuda? |
| S1 | Abrir o seleccionar sesión Discovery | TTFV start |
| S2 | **Institutional Evidence Snapshot** | ¿Reconoce inventario documental? ¿Entiende “Requires review”? |
| S3 | **Institutional Profile** | ¿La síntesis tiene sentido institucional? |
| S4 | **Possible Capabilities** + **Claim Candidates** | ¿Distigue “posible” vs. afirmación final? |
| S5 | **Evidence Gaps** | ¿Identifica gaps que ya conocía? ¿Alguno sorprendente? |
| S6 | **Institutional Narrative** (si disponible) | ¿Lo leería en voz alta a un colega? |
| S7 | **Provenance** (desde una entidad) | ¿Confía en la trazabilidad? ¿O le resulta ruido técnico? |
| S8 | **Validation Notes** — registrar 1 nota | ¿El formulario es claro? |
| S9 | **Curation** — registrar 1 acción (si hay run) | ¿Entiende qué está haciendo? |
| S10 | Pregunta de cierre (§6) | WOW / anti-WOW |

**TTFV end:** Momento en que el participante dice *“ya entiendo qué ha reconstruido Kadarn”* — no cuando termina el pipeline técnicamente.

### Variantes de escenario

| Variante | Cuándo usar | Cambio |
|----------|-------------|--------|
| **A — Pipeline en vivo** | Entorno estable | Participante sube 1 documento y espera (observar tolerancia a espera) |
| **B — Sesión precocinada** | Primera sesión del ciclo | Pipeline ya corrido; foco en comprensión, no en latencia |
| **C — Gap deliberado** | Segunda sesión | Dataset sin documento clave; observar reacción en Evidence Gaps |

### Reglas del facilitador

1. **No** explicar arquitectura, agentes ni Layer 0/1 salvo que el participante pregunte
2. **No** defender el producto — registrar fricción tal cual
3. **Sí** desbloquear login, permisos o errores 500
4. **Sí** repetir la premisa de provisionalidad si el participante interpreta “certificación”

---

## 6. Preguntas

### Preguntas en voz alta (facilitador → participante)

**Comprensión institucional**

1. *“¿Reconocéis vuestra institución en lo que veis?”* — ¿Qué sí? ¿Qué no?
2. *“¿Hay algo aquí que no debería estar — o que falta?”*
3. *“Si un sponsor viera esto mañana, ¿qué parte os enorgullecería y qué parte os preocuparía?”*

**Valor y siguiente paso**

4. *“¿Qué haríais ahora con esta información?”* (acción concreta)
5. *“¿Qué documento subiríais primero para mejorar esta reconstrucción?”*
6. *“¿Pagaríais tiempo de vuestro equipo para mantener esto actualizado?”* — ¿Por qué?

**Confianza y lenguaje**

7. *“¿Kadarn os está ‘certificando’ algo aquí, o reconstruyendo con lo que tiene?”*
8. *“¿Confiáis en que podéis rastrear de dónde salió [entidad/capability X]?”*

**Cierre — moment of truth**

9. *“¿En qué momento de la sesión Kadarn dejó de ser ‘una herramienta más’ y empezó a ser útil?”* — Si nunca: *“¿Qué faltó?”*
10. *“¿Recomendaríais a un colega director que hiciera esto con sus documentos?”* — Escala 0–10 (NPS informal)

### Preguntas silenciosas (observador — no preguntar en voz alta)

- ¿El participante evita pestañas técnicas (Pipeline, JSON raw)?
- ¿Vuelve a una pestaña por iniciativa propia?
- ¿Lee descripciones de incertidumbre o las ignora?
- ¿Usa lenguaje forbidden (“verified”, “approved”, “trust score”) por su cuenta?

---

## 7. Métricas

### Métricas de producto (registrar en cada sesión)

| Métrica | Definición | Objetivo Cycle-01 | Fuente |
|---------|------------|---------------------|--------|
| **TTFV** | Tiempo hasta “entiendo la reconstrucción” | < 20 min (escenario B) | Cronómetro + cita |
| **Recognition rate** | % elementos citados correctamente por el participante | ≥ 60% en snapshot/profile | Notas scribe |
| **Action intent** | ¿Al menos 1 acción concreta post-sesión? | Sí en ≥ 2/3 sesiones | Pregunta 4 |
| **Trust calibration** | ¿Distigue provisional vs. canónico? | Sí | Pregunta 7 |
| **Note capture** | Validation Notes registradas | ≥ 1 por sesión | Producto |
| **Curation capture** | Curation actions registradas | ≥ 1 por sesión (si hay run) | Producto |
| **Recommendation score** | Pregunta 10 | ≥ 7/10 en ≥ 2/3 sesiones | Encuesta |
| **Tab engagement** | Pestañas visitadas sin prompting | ≥ 5 de 14 | Observación |

### Métricas de software (registrar pero no optimizar en Cycle-01)

| Métrica | Uso |
|---------|-----|
| Pipeline completion time | Contexto para TTFV técnico — `metrics.ttfvMinutes` en dashboard |
| Error rate | Bloqueantes vs. fricciones |
| Empty states shown | Señal de persistencia pipeline |

### Métricas prohibidas como éxito de producto

- Precision/recall de extracción
- “Trust Score” o “Site Score”
- Cobertura de código o tests passing (necesarios pero no suficientes)

---

## 8. TTFV — Time To First Value

### Definición Kadarn (producto)

**TTFV** = tiempo desde que el Site Director abre la sesión Discovery hasta que articula, sin ayuda, **qué Kadarn reconstruyó sobre su institución y por qué le importa**.

No confundir con:

- Tiempo de ejecución del pipeline (`ttfvMinutes` en métricas técnicas)
- Tiempo hasta completar todas las pestañas

### Cómo medir

```
TTFV_start: click "Open Session" o selección de sesión existente
TTFV_end:   participante responde P1+P4 con contenido específico institucional
TTFV_minutes = end - start
```

### Umbrales Cycle-01

| Rango | Interpretación |
|-------|----------------|
| < 15 min | Excelente — hipótesis de valor fuerte |
| 15–25 min | Aceptable — optimizar jerarquía visual / snapshot |
| 25–40 min | Riesgo — revisar entry point y copy |
| > 40 min o nunca | Fallo de producto para este persona — no avanzar a Promotion |

### Registro TTFV (plantilla)

```yaml
ttfv_start: HH:MM
ttfv_end: HH:MM
ttfv_minutes: N
ttfv_trigger_quote: "<cita literal del participante>"
technical_pipeline_minutes: N  # opcional, desde dashboard metrics
```

---

## 9. WOW Moment

### Definición

El **WOW Moment** es el instante observable en que el participante pasa de escéptico/neutral a **comprometido** — típicamente al reconocer algo específico e inesperado sobre su institución.

### Señales positivas (checklist)

- [ ] Cita un investigador, estudio o capacidad **sin prompt**
- [ ] Dice *“no sabía que teníais eso”* refiriéndose a Kadarn, no al facilitador
- [ ] Pide ver de dónde salió un dato (Provenance por iniciativa propia)
- [ ] Identifica un gap accionable y describe qué documento aportaría
- [ ] Querría mostrárselo a un colega antes de terminar la sesión

### Anti-WOW (señales de fallo)

- [ ] *“Esto es un dashboard más”*
- [ ] *“No reconozco nada”* tras revisar snapshot completo
- [ ] Interpreta outputs como certificación oficial
- [ ] Abandona antes de S5 (Gaps)
- [ ] No puede articular una acción concreta al cierre

### Registro WOW (plantilla)

```yaml
wow_occurred: yes | no | partial
wow_minute: N  # minuto de sesión
wow_quote: "<cita literal>"
wow_surface: snapshot | profile | capabilities | gaps | narrative | provenance | other
wow_observer_confidence: high | medium | low
```

---

## 10. Fricciones

### Taxonomía de fricciones

| Tipo | Código | Ejemplo |
|------|--------|---------|
| **Comprensión** | F-COMP | No entiende “Claim candidate” |
| **Confianza** | F-TRUST | Cree que Kadarn “aprueba” capabilities |
| **Navegación** | F-NAV | No encuentra Validation Notes |
| **Datos** | F-DATA | Pipeline vacío / empty states |
| **Lenguaje** | F-LANG | Jerga técnica (“Layer 0”, “agent output”) |
| **Espera** | F-WAIT | Pipeline demasiado lento |
| **Acción** | F-ACT | No sabe qué hacer tras ver Gaps |
| **Técnica** | F-TECH | Error 500, login, permisos |

### Severidad

| Nivel | Criterio | Acción |
|-------|----------|--------|
| **P0 — Bloqueante** | Impide completar escenario | Fix antes de siguiente sesión |
| **P1 — Alta** | Reduce TTFV o WOW | Priorizar en síntesis 48h |
| **P2 — Media** | Molestia pero completable | Backlog Discovery UX |
| **P3 — Baja** | Cosmética | Registrar, no actuar en freeze |

### Registro por fricción

```yaml
- id: F-001
  type: F-COMP
  severity: P1
  minute: 12
  surface: capabilities
  quote: "<cita>"
  suggested_fix: "<hipótesis, no implementación>"
```

---

## 11. Hallazgos

### Plantilla de informe de sesión

```markdown
# Informe — VALIDATION-001-Cycle-01-Session-XX

**Fecha:** YYYY-MM-DD  
**Participante:** Site Director — <org>  
**Facilitador:** <nombre>  
**Variante escenario:** A | B | C  
**Duración:** N min  

## Resumen ejecutivo (3 frases max)

## TTFV
- Minutos: N
- Cita trigger: "..."

## WOW Moment
- ¿Ocurrió?: yes/no/partial
- Cita: "..."

## Métricas rápidas
| Métrica | Valor |
|---------|-------|
| Recognition rate | N% |
| Recommendation score | N/10 |
| Validation notes | N |
| Curation actions | N |
| Tabs visitadas | N/14 |

## Top 3 fricciones
1. ...
2. ...
3. ...

## Citas literales (mínimo 5)
- "..."

## Hipótesis de valor confirmadas / refutadas
- [ ] H1: El Site Director reconoce su institución
- [ ] H2: Evidence Gaps generan acción
- [ ] H3: El lenguaje de incertidumbre calibra expectativas

## Recomendación sesión
- [ ] Avanzar a Promotion
- [ ] Iterar Discovery (acotado)
- [ ] Pivotar hipótesis
```

### Consolidación multi-sesión

Tras 2–3 sesiones, producir **VALIDATION-001-Cycle-01-Synthesis.md** con:

- Patrones comunes (fricciones repetidas ≥ 2 sesiones)
- TTFV mediana y rango
- % sesiones con WOW
- Decisión explícita sobre Evidence Promotion Pipeline

---

## 12. Cambios

### Reglas para proponer cambios post-validación

1. Todo cambio debe **trackearse a un hallazgo** (id de fricción o cita)
2. Durante el freeze, solo entran **P0 bloqueantes**
3. Tras el freeze, priorizar cambios que reduzcan TTFV y aumenten WOW — no features nuevas
4. Copy > arquitectura > UI > API (en ese orden de preferencia)

### Plantilla de cambio

```yaml
change_id: CHG-001
finding_ref: F-001
description: "Renombrar X en snapshot panel"
type: copy | ux | bug | architecture
in_freeze: yes | no
effort: S | M | L
expected_impact: "Reduce F-COMP en capabilities"
```

### Cambios explícitamente fuera de alcance hasta decisión Promotion

- Evidence Core writes
- Promotion workflows
- Claim confidence scoring
- Marketplace features
- Nuevas pestañas Discovery

---

## 13. Priorización

### Matriz de priorización post-validación

| Impacto en TTFV/WOW | Esfuerzo bajo | Esfuerzo alto |
|---------------------|---------------|---------------|
| **Alto** | Hacer ahora (Sprint +1) | Planificar (Sprint +2) |
| **Bajo** | Backlog | No hacer |

### Criterios de gate — Evidence Promotion Pipeline

**Todos** deben cumplirse para abrir Promotion:

- [ ] ≥ 2/3 sesiones con TTFV < 25 min
- [ ] ≥ 2/3 sesiones con WOW = yes o partial
- [ ] ≥ 2/3 sesiones con action intent concreta
- [ ] 0 interpretaciones de “certificación” sin corrección
- [ ] Síntesis documentada y revisada por producto + arquitectura
- [ ] Freeze Discovery levantado formalmente

Si **no** se cumplen: iteración acotada Discovery (máx. 1 sprint) y **nuevo ciclo** VALIDATION-001-Cycle-02.

---

## Anexo A — Mapa de superficies Discovery

Referencia rápida para observadores — ver [DISCOVERY-INTERACTION-DASHBOARD-REPORT.md](../engineering/DISCOVERY-INTERACTION-DASHBOARD-REPORT.md).

| Pestaña | Pregunta de producto que responde |
|---------|-----------------------------------|
| Pipeline | ¿En qué estado está el procesamiento? (observador; Site Director opcional) |
| Institutional Evidence Snapshot | ¿Qué documentos y señales hay? |
| Institutional Profile | ¿Cuál es la síntesis institucional? |
| Source Documents | ¿Qué artefactos entraron? |
| Entities / Relationships | ¿Qué actores y conexiones sugiere Kadarn? |
| Timeline | ¿Qué cronología reconstruye? |
| Possible Capabilities | ¿Qué capacidades operativas son plausibles? |
| Claim Candidates | ¿Qué claims podrían sostenerse con revisión? |
| Evidence Gaps | ¿Qué falta para fortalecer claims? |
| Institutional Narrative | ¿Cómo lo contaría Kadarn en prosa? |
| Curation | ¿Cómo registro mi juicio humano? |
| Validation Notes | ¿Cómo dejo feedback estructurado? |
| Provenance | ¿De dónde salió este item? |

---

## Anexo B — Categorías Validation Notes (producto)

Usar las categorías nativas del producto al registrar feedback:

`GOT_RIGHT` · `MISSED` · `FALSE_POSITIVE` · `FALSE_NEGATIVE` · `SURPRISING` · `DOCUMENT_TO_REQUEST` · `USER_REACTION` · `TTFV` · `GENERAL`

---

## Anexo C — Relación con otros documentos

| Documento | Relación |
|-----------|----------|
| [site-experience.md](../ux/site-experience.md) | Persona Site Director — Moment of Truth |
| [DISCOVERY-INTERACTION-DASHBOARD-REPORT.md](../engineering/DISCOVERY-INTERACTION-DASHBOARD-REPORT.md) | Superficie técnica bajo validación |
| [KADARN-DOCTRINE.md](../foundation/KADARN-DOCTRINE.md) | Por qué importa la continuidad institucional |
| [FIRST-BIOBANK-PILOT-RUNBOOK.md](../pilots/FIRST-BIOBANK-PILOT-RUNBOOK.md) | Piloto operacional distinto — no sustituye VALIDATION-001 |

---

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 2026-06-28 | Protocolo inicial — Discovery Workbench Cycle-01 |

---

## Conclusión estratégica

Kadarn ha llegado al punto en que **la pregunta correcta ya no es “¿compila?”** sino **“¿un director de site obtiene valor con documentos reales?”**.

Este protocolo existe para que esa pregunta se responda con **evidencia**, no con intuición del equipo.

**Congelar Discovery. Validar con humanos reales. Decidir Promotion con datos.**

Ese orden reduce el riesgo de construir funcionalidades avanzadas sobre una experiencia que aún no ha sido contrastada en el mundo real.
