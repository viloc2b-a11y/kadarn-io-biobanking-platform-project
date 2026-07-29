# Kadarn Evidence Blueprint

Este blueprint operativo define cómo estructurar la recogida de datos de instituciones para soportar la cadena **Claim → Evidence → Confidence Graph → Sponsor Intelligence → Feedback → Nueva evidencia**. La lógica está inspirada en enfoques de *knowledge graphs* con incertidumbre, *provenance-enhanced statements*, trazabilidad temporal y *claim-level auditability*, todos útiles para modelar afirmaciones, soporte, conflicto, procedencia y confianza sin reducir el sistema a un repositorio documental.[cite:31][cite:32][cite:33][cite:34][cite:35]

## Objetivo operativo

Kadarn debe capturar capacidad institucional como un activo verificable, portable y acumulativo. Para lograrlo, la unidad operativa no es el documento, sino el **claim institucional** respaldado por evidencia trazable, con contexto, fecha, procedencia, conflictos y un estado de confianza explícito.[cite:33][cite:34][cite:35]

## Arquitectura lógica

| Capa | Función | Output principal |
|---|---|---|
| Claim Layer | Define qué afirma la institución | Claim estructurado |
| Evidence Layer | Adjunta y fragmenta soporte verificable | Evidence objects + evidence facts |
| Provenance Layer | Registra origen, autoría, validación y transformaciones | Provenance records |
| Confidence Layer | Estima nivel de soporte, frescura, consistencia y contradicción | Confidence graph |
| Intelligence Layer | Traduce la red en respuestas para sponsors/CROs/vendors | Decision views / sponsor intelligence |
| Feedback Layer | Incorpora resultados posteriores y corrige o enriquece claims | New evidence cycle |

Esta separación coincide con la literatura que recomienda representar afirmaciones y evidencia como nodos y relaciones trazables, en lugar de guardar solo enunciados planos o scores opacos.[cite:31][cite:33][cite:34]

## Objetos canónicos

### 1. Institution
Entidad organizacional que produce y/o consume evidencia.

Campos mínimos:
- `institution_id`
- `institution_type` (`site`, `hospital`, `biobank`, `lab`, `SMO`)
- `legal_name`
- `display_name`
- `country`
- `region`
- `therapeutic_focus[]`
- `capability_domains[]`
- `status`
- `created_at`
- `updated_at`

### 2. Claim
Afirmación concreta sobre una capacidad institucional. La literatura de *claim-level auditability* sugiere que cada afirmación relevante tenga trazabilidad directa hacia la evidencia que la respalda o la contradice.[cite:34]

Campos mínimos:
- `claim_id`
- `institution_id`
- `claim_family`
- `claim_type`
- `statement`
- `context`
- `valid_time_window`
- `status`
- `evidence_requirements`
- `created_by`
- `created_at`
- `updated_at`

### 3. Evidence Object
Elemento probatorio bruto o semiestructurado asociado a uno o varios claims. Los marcos de *provenance verification* muestran que la evidencia debe conservar su origen y la relación exacta con la afirmación, no solo estar anexada en un bucket documental.[cite:33][cite:35]

Campos mínimos:
- `evidence_id`
- `institution_id`
- `evidence_type`
- `title`
- `source_type`
- `source_ref`
- `capture_date`
- `event_date`
- `document_hash`
- `storage_uri`
- `privacy_class`
- `extracted_facts[]`
- `linked_claim_ids[]`
- `review_status`

### 4. Provenance Record
Registro de procedencia de una afirmación o evidencia. Los trabajos de *provenance-enhanced statements* sostienen que la procedencia no es solo metadata técnica, sino parte del significado operativo de una afirmación.[cite:33]

Campos mínimos:
- `provenance_id`
- `target_type` (`claim`, `evidence`, `fact`, `feedback`)
- `target_id`
- `asserted_by`
- `asserted_role`
- `source_actor`
- `verification_actor`
- `verification_method`
- `transformation_history[]`
- `created_at`
- `verified_at`

### 5. Confidence Node / Edge
Representa la evaluación de confianza de un claim dentro del grafo. Los enfoques de incertidumbre en knowledge graphs recomiendan desagregar la confianza en dimensiones como soporte, consistencia, recencia y conflicto, en vez de depender de una sola puntuación plana.[cite:31]

Campos mínimos:
- `confidence_id`
- `claim_id`
- `support_strength`
- `source_reliability`
- `recency_score`
- `consistency_score`
- `contradiction_load`
- `confidence_level`
- `confidence_explanation`
- `last_computed_at`

### 6. Feedback Event
Evento posterior emitido por sponsor, CRO u otro actor que confirma, limita o contradice un claim previo. Los marcos auditables recomiendan tratar contradicciones y validaciones posteriores como parte del sistema vivo de evidencia, no como notas externas.[cite:34]

Campos mínimos:
- `feedback_id`
- `institution_id`
- `related_claim_id`
- `feedback_source_type`
- `feedback_source_id`
- `feedback_type`
- `feedback_statement`
- `feedback_weight`
- `event_date`
- `attachments[]`
- `resolution_status`

## Taxonomía inicial de claims

Conviene iniciar con una taxonomía cerrada y gobernada; los modelos de incertidumbre empeoran cuando las afirmaciones se formulan con tipologías ambiguas o inconsistentes.[cite:31]

| Claim family | Qué describe | Ejemplo |
|---|---|---|
| `operational_execution` | Capacidad operacional repetida | "Maintains visit continuity in longitudinal studies" |
| `sample_handling` | Procesamiento y cadena de custodia de muestras | "Can process PBMC within protocol-defined window" |
| `regulatory_quality` | Calidad documental, auditorías, inspecciones | "Passed sponsor audit without critical findings" |
| `scientific_experience` | Experiencia por indicación, fase o modalidad | "Has prior execution in oncology phase II" |
| `infrastructure_readiness` | Activos físicos y técnicos | "Has validated -80C storage" |
| `network_continuity` | Continuidad con vendors/biobanks/labs | "Has sustained workflow with vendor X" |

## Workflow operativo

### Etapa 1. Claim intake
- La institución selecciona un claim de catálogo o propone uno nuevo.
- El sistema obliga a añadir contexto: ventana temporal, indicación, tipo de muestra, vendor, región y volumen cuando aplique.
- El claim queda en estado `draft` hasta que exista evidencia mínima asociada.

### Etapa 2. Evidence intake
- El usuario sube documentos, logs, certificados o resúmenes estructurados.
- Ningún documento puede existir “suelto”; todo Evidence Object debe apuntar a al menos un claim o quedar en cola de clasificación.
- Cada evidencia recibe `source_type`, `event_date`, `capture_date`, `privacy_class` y `review_status`.

### Etapa 3. Evidence extraction
- Un pipeline manual o asistido extrae hechos atómicos del material subido.
- Los hechos se normalizan como `evidence facts` reutilizables: fechas, vendors, tipo de muestra, fase de estudio, tiempos operativos, hallazgos, capacidades observadas.
- Las transformaciones quedan registradas en el historial de procedencia.[cite:33][cite:35]

### Etapa 4. Validation
- Reglas de soporte determinan si la evidencia soporta el claim de forma directa, indirecta, contextual o conflictiva.
- Claims de alto impacto pasan por revisión humana.
- El claim cambia a `supported`, `partially_supported`, `disputed` o `stale`.

### Etapa 5. Confidence computation
- El sistema calcula dimensiones de confianza: soporte, confiabilidad de fuente, recencia, consistencia y contradicción.[cite:31]
- El resultado no debe limitarse a un score único; debe incluir explicación y conflictos visibles.[cite:33][cite:34]

### Etapa 6. Sponsor intelligence
- Las consultas deben responder preguntas decisionales, no solo devolver listas de documentos.
- Las vistas para sponsors/CROs deben mostrar claim, evidencia clave, nivel de confianza, limitaciones y huecos.

### Etapa 7. Feedback loop
- Un sponsor/CRO/vendoр/biobank agrega feedback contextual o de resultado.
- Ese feedback crea nueva evidencia, ajusta el confidence graph y puede iniciar revalidación del claim.[cite:34]

## Estados sugeridos

### Claim status
- `draft`
- `pending_evidence`
- `under_review`
- `supported`
- `partially_supported`
- `verified`
- `disputed`
- `stale`
- `archived`

### Evidence review status
- `uploaded`
- `classified`
- `extracted`
- `linked`
- `reviewed`
- `accepted`
- `rejected`
- `restricted`

### Feedback resolution
- `open`
- `triaged`
- `incorporated`
- `disputed`
- `closed`

## Reglas de confianza

Basado en enfoques de uncertainty management, la confianza debe ser multidimensional y explicable.[cite:31]

### Dimensiones
- `support_strength`: cantidad y calidad del soporte directo.
- `source_reliability`: credibilidad de la fuente; un tercero verificador pesa distinto a una auto-declaración.[cite:33][cite:35]
- `recency_score`: evidencia reciente pesa más que evidencia antigua.[cite:32]
- `consistency_score`: múltiples objetos apuntan a la misma conclusión.
- `contradiction_load`: evidencia o feedback conflictivo reduce confianza.[cite:34]

### Niveles sugeridos
- `low`
- `moderate`
- `high`
- `verified`

### Ejemplo de lógica inicial
- `verified`: evidencia fuerte reciente + verificación humana o de tercero + sin contradicciones materiales.
- `high`: múltiples soportes directos recientes + consistencia alta.
- `moderate`: soporte suficiente pero parcial, indirecto o menos reciente.
- `low`: auto-declaración o evidencia insuficiente.

## Blueprint JSON

### 1. Institution

```json
{
  "institution_id": "inst_001",
  "institution_type": "site",
  "legal_name": "South Texas Research Institute LLC",
  "display_name": "South Texas Research Institute",
  "country": "US",
  "region": "Texas",
  "therapeutic_focus": ["oncology", "immunology"],
  "capability_domains": ["sample_handling", "scientific_experience", "regulatory_quality"],
  "status": "active",
  "created_at": "2026-07-05T18:00:00Z",
  "updated_at": "2026-07-05T18:00:00Z"
}
```

### 2. Claim

```json
{
  "claim_id": "clm_1001",
  "institution_id": "inst_001",
  "claim_family": "sample_handling",
  "claim_type": "pbmc_processing",
  "statement": "Institution can process PBMC samples within protocol-defined collection-to-freeze windows.",
  "context": {
    "sample_type": "PBMC",
    "indications": ["oncology", "immunology"],
    "operating_context": "interventional clinical trials",
    "geography": "Texas",
    "vendors": ["vendor_lab_alpha"]
  },
  "valid_time_window": {
    "start": "2025-01-01",
    "end": null
  },
  "status": "under_review",
  "evidence_requirements": {
    "minimum_direct_evidence": 2,
    "requires_recent_evidence_within_days": 365,
    "requires_third_party_or_human_verification": true
  },
  "created_by": {
    "actor_id": "usr_site_21",
    "role": "site_admin"
  },
  "created_at": "2026-07-05T18:01:00Z",
  "updated_at": "2026-07-05T18:01:00Z"
}
```

### 3. Evidence Object

```json
{
  "evidence_id": "evd_501",
  "institution_id": "inst_001",
  "evidence_type": "sop_document",
  "title": "PBMC Processing SOP v3.2",
  "source_type": "institution_upload",
  "source_ref": "upload_8844",
  "capture_date": "2026-07-05",
  "event_date": "2026-05-12",
  "document_hash": "sha256:5f9b2b6f5d8c8a91c1aa3b1de1a8f5b5",
  "storage_uri": "s3://kadarn/evidence/inst_001/evd_501.pdf",
  "privacy_class": "restricted",
  "extracted_facts": [
    {
      "fact_id": "fact_9001",
      "predicate": "describes_process_for",
      "value": "PBMC processing",
      "confidence": "high"
    },
    {
      "fact_id": "fact_9002",
      "predicate": "requires_collection_to_freeze_window_minutes",
      "value": 120,
      "confidence": "high"
    }
  ],
  "linked_claim_ids": ["clm_1001"],
  "review_status": "reviewed"
}
```

### 4. Provenance Record

```json
{
  "provenance_id": "prv_7001",
  "target_type": "evidence",
  "target_id": "evd_501",
  "asserted_by": {
    "actor_id": "usr_site_21",
    "role": "site_admin"
  },
  "source_actor": {
    "actor_type": "institution",
    "actor_id": "inst_001"
  },
  "verification_actor": {
    "actor_type": "kadarn_reviewer",
    "actor_id": "rev_02"
  },
  "verification_method": "human_review_plus_schema_validation",
  "transformation_history": [
    {
      "step": "upload",
      "timestamp": "2026-07-05T18:03:00Z"
    },
    {
      "step": "ocr_extraction",
      "timestamp": "2026-07-05T18:04:00Z"
    },
    {
      "step": "fact_mapping",
      "timestamp": "2026-07-05T18:05:00Z"
    },
    {
      "step": "human_review",
      "timestamp": "2026-07-05T18:07:00Z"
    }
  ],
  "created_at": "2026-07-05T18:03:00Z",
  "verified_at": "2026-07-05T18:07:00Z"
}
```

### 5. Confidence Node

```json
{
  "confidence_id": "cnf_1001",
  "claim_id": "clm_1001",
  "support_strength": 0.82,
  "source_reliability": 0.76,
  "recency_score": 0.91,
  "consistency_score": 0.88,
  "contradiction_load": 0.10,
  "confidence_level": "high",
  "confidence_explanation": "Claim is supported by current SOP, recent operational records, and reviewer validation. No material contradictions detected.",
  "last_computed_at": "2026-07-05T18:10:00Z"
}
```

### 6. Feedback Event

```json
{
  "feedback_id": "fbk_3001",
  "institution_id": "inst_001",
  "related_claim_id": "clm_1001",
  "feedback_source_type": "sponsor",
  "feedback_source_id": "spn_778",
  "feedback_type": "contextual_validation",
  "feedback_statement": "Site demonstrated PBMC processing capability during immunology protocol startup; execution acceptable with vendor_lab_alpha workflow.",
  "feedback_weight": "high",
  "event_date": "2026-08-21",
  "attachments": ["evd_8801"],
  "resolution_status": "incorporated"
}
```

## Evidence packet example

Cada claim debe poder inspeccionarse como un paquete auditable.

```json
{
  "claim_id": "clm_1001",
  "institution_id": "inst_001",
  "claim_status": "supported",
  "evidence_packet": {
    "direct_support_count": 3,
    "indirect_support_count": 1,
    "conflicting_evidence_count": 0,
    "evidence_ids": ["evd_501", "evd_502", "evd_503", "evd_601"],
    "latest_evidence_date": "2026-07-01",
    "third_party_validation": true
  },
  "confidence": {
    "level": "high",
    "explanation": "Supported by multiple recent sources with human review and no unresolved conflicts."
  }
}
```

## Sponsor Intelligence view example

La salida para sponsors/CROs no debe ser una carpeta de archivos, sino una vista decisional basada en claims y soporte trazable.[cite:33][cite:34]

```json
{
  "query_id": "qry_9001",
  "query_type": "site_selection",
  "filters": {
    "sample_type": "PBMC",
    "indication": "immunology",
    "region": "Texas"
  },
  "results": [
    {
      "institution_id": "inst_001",
      "display_name": "South Texas Research Institute",
      "matched_claims": [
        {
          "claim_id": "clm_1001",
          "statement": "Institution can process PBMC samples within protocol-defined collection-to-freeze windows.",
          "confidence_level": "high",
          "key_evidence_ids": ["evd_501", "evd_502"],
          "known_limitations": ["Validated mainly with vendor_lab_alpha workflow"],
          "open_questions": []
        }
      ],
      "overall_decision_readiness": "strong_candidate"
    }
  ]
}
```

## Governing rules

### 1. Ningún documento huérfano
Todo archivo debe estar ligado a un claim, a una cola temporal de clasificación o a un feedback event.

### 2. Ningún claim sin contexto
Toda afirmación debe tener dominio, ventana temporal y contexto operativo.

### 3. La procedencia es obligatoria
Todo claim, hecho extraído y feedback debe registrar quién afirmó, quién verificó y qué transformaciones ocurrieron.[cite:33][cite:35]

### 4. La contradicción no se borra
La evidencia conflictiva se conserva y se modela; no debe eliminarse para “limpiar” perfiles.[cite:31][cite:34]

### 5. La confianza es explicable
No se debe mostrar un score sin explicación textual y trazabilidad a evidencias.[cite:31][cite:34]

### 6. La evidencia envejece
Claims sensibles al tiempo deben degradar su confianza si no reciben nueva evidencia dentro de su ventana de vigencia.[cite:32]

## MVP recomendado

Para un MVP funcional, conviene empezar con un alcance estrecho y gobernable:
- 25 a 40 claims canónicos.
- 5 a 8 tipos de evidencia por claim.
- Reglas determinísticas de confianza antes de modelos complejos.
- Revisión humana para claims de alto impacto.
- Tres consultas iniciales de Sponsor Intelligence: selección de sitios, validación de capacidad específica y continuidad operacional.

Esta secuencia sigue el principio de que la trazabilidad y la auditabilidad deben construirse primero; la automatización avanzada puede venir después sin perder integridad semántica.[cite:34][cite:35]

## Próximo entregable sugerido

El siguiente paso lógico es transformar este blueprint en un **schema técnico** con:
- tablas o colecciones,
- JSON Schema por objeto,
- reglas de transición de estados,
- pesos iniciales del confidence engine,
- y APIs mínimas para intake, review, publish y query.
