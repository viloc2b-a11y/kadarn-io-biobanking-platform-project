# ADR-015: Knowledge Engine — Semantic Understanding Layer

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn's existing modules use inconsistent terminology. A specimen labeled
"whole blood" in one biobank may be "WB" in another, "Blood (venous)" in a
third, or "EDTA whole blood" in a fourth. Discovery queries miss matches
because terms don't align.

The Knowledge Graph (KRM-RAO §4.3) requires a semantic layer that maps
domain concepts across terminologies. Without it:
- Discovery returns incomplete results
- Feasibility can't accurately assess available specimens
- Cross-system integration requires manual term mapping

---

## Decision: Build a Controlled Vocabulary Engine

### 1. Vocabulary Sets

Controlled vocabularies are organized into sets:

| Set | Purpose | Examples |
|-----|---------|----------|
| `specimen_type` | Biospecimen classification | whole_blood, plasma, ffpe, tissue |
| `processing_method` | How specimens were processed | centrifugation, fixation, embedding |
| `storage_condition` | Storage temperature/preservation | minus_80, ln2, ffpe, rna_later |
| `container_type` | Primary container | sst_vial, edta_tube, cryovial, slide |
| `regulatory_doc_type` | Governance documents | mta, dua, irb_approval, consent |
| `diagnosis` | Disease taxonomy placeholder | C50 (breast cancer), C18.9 (colon) |

### 2. Term Mapping

Each vocabulary term maps to:
- **Preferred label** (canonical name)
- **Synonyms** (alternative names across systems)
- **External codes** (ICD-10, SNOMED CT, LOINC, NCIt, MONDO)
- **Parent/child relationships** (hierarchical: "whole_blood" ⊂ "blood" ⊂ "specimen")

### 3. Normalization Service

The Knowledge Engine provides:

- `normalizeTerm(vocabulary, term)` → canonical term (fuzzy match)
- `getSynonyms(vocabulary, term)` → all known synonyms
- `mapToExternal(term, codingSystem)` → external code
- `expandQuery(term)` → term + all descendants for broad search
- `getHierarchy(term)` → parent/child relationships

### 4. Integration

Other engines and services call the Knowledge Engine for:
- **Discovery**: expand search terms to include synonyms
- **Feasibility**: normalize specimen types across sites
- **Integration Engine**: map external system codes to Kadarn terms
- **Policy Engine**: resolve terminology in policy conditions

---

## Consequences

### Positive

- Consistent terminology across the platform
- Discovery finds more matches (synonym expansion)
- External system integration is simpler (mapping service)

### Negative

- Vocabularies require ongoing curation
- Initial vocabularies are starter sets — need domain expert input

### Neutral

- External code mappings (ICD, SNOMED, LOINC) are additive
- The engine handles known terms; unknown terms pass through as-is
