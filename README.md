# Kadarn Platform

> Biospecimen Network Operating System (BNOS)
> Multi-organization infrastructure platform for biospecimen and clinical data programs.

**Status:** Sprint 0 — Foundation

---

## Repository Structure

```
kadarn-platform/
├── apps/
│   ├── web/              # Next.js frontend (pending)
│   └── backend/          # Supabase + migrations
├── docs/
│   ├── adr/              # Architecture Decision Records
│   └── architecture/     # Architecture documentation
└── scripts/              # Utility scripts
```

## Architecture Decisions (ADRs)

| # | Title | Status |
|---|-------|--------|
| 001 | Platform Core vs. Service Layer Separation | ✅ (from prototype) |
| 002 | Multi-Tenant Architecture & Organization Model | ✅ Current |

## Guiding Principles

1. **Technology ≠ Service Execution** — The platform is neutral infrastructure.
2. **Multi-tenant with RLS** — Shared database, not per-tenant databases.
3. **Organization-Capability Model** — Organizations have capabilities, not rigid types.
4. **Supabase Auth + OIDC-ready** — Start fast, stay portable.
5. **Audit Trail from Sprint 0** — No audit = no action.
6. **Salvage, don't inherit** — Learn from the prototype, don't copy its debt.

## Roadmap

See `docs/architecture/roadmap.md`

## Reference

Prototype archive: `../Kadarn/` tagged as `archive/pre-kadarn-platform-prototype`
