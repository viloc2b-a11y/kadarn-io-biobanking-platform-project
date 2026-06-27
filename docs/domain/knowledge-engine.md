# Kadarn Knowledge Engine

**Version:** 1.0  
**Status:** Accepted  
**Canonical:** `docs/domain/knowledge-engine.md`

---

## 1. Purpose

The Knowledge Engine provides semantic understanding — controlled
vocabularies, term normalization, synonym resolution, and external
code mapping. It is the foundation for the Knowledge Graph (KRM-RAO §4.3).

Without it, a search for "whole blood" misses specimens labeled "WB",
"Blood (venous)", or "EDTA whole blood" in different biobanks.

---

## 2. Vocabulary Sets

| Set | Terms | Purpose |
|-----|-------|---------|
| `specimen_type` | 20+ | Canonical biospecimen types |
| `processing_method` | 10+ | Standard processing protocols |
| `storage_condition` | 10+ | Storage and preservation methods |
| `container_type` | 15+ | Primary collection containers |
| `regulatory_doc_type` | 8+ | Governance document categories |
| `diagnosis` | Starter | Disease taxonomy placeholder |

---

## 3. Services

### normalizeTerm
Fuzzy-match a term against a vocabulary set, returning the canonical form.
Unknown terms pass through unchanged.

### getSynonyms
Returns all known synonyms for a canonical term, enabling query expansion.

### mapToExternal
Returns the external code for a term in a given coding system (ICD-10,
SNOMED CT, LOINC, NCIt, MONDO).

### expandQuery
Returns the input term plus all its hyponyms (children) for broad search.

### getHierarchy
Returns parent/child relationships for a term in the concept hierarchy.
