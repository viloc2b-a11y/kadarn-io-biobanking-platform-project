# Instructions for AI Agents Working on KADARN

Read `START_HERE.md`, `PROJECT_STATE.md`, and `DOCUMENT_MAP.md` before proposing or making project changes.

## Mandatory behavior

- Treat explicit Human Gate decisions as the highest authority.
- Inspect the implementation before claiming a feature exists.
- Separate `IMPLEMENTED`, `DECIDED_NOT_IMPLEMENTED`, `PLANNED`, `INFERRED`, and `UNKNOWN`.
- Use Markdown documents as repository working copies; preserve DOCX files in `docs/99-source-archive/`.
- Do not create a new master plan when an accepted controlling document already exists.
- Do not silently resolve contradictions or replace historical records.
- Do not broaden the MVP away from institution-first biospecimen, IVD/diagnostics, biobanking, translational research, and sites without an explicit Human decision.
- Do not describe KADARN as a certifier.
- Keep evidence provenance, contradiction, explainability, aging, and institution ownership intact.
- Update `PROJECT_STATE.md` whenever a material change moves the continuation point.

## Session handoff

Every completed work session must leave:

1. the verified baseline used;
2. files changed;
3. tests or validation performed;
4. unresolved gaps;
5. one exact continuation point.

If repository coordinates or the current implementation cannot be verified, say so plainly and stop before execution that depends on them.

