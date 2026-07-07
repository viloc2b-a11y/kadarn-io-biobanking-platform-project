# AF-4.0 API Governance (Sprint 6)

## Versioning

- Header: `X-Kadarn-Api-Version: v1` (set by API middleware)
- URL prefix: `/api/v1/*` for current surfaces
- Legacy `/api/*` deprecated with `Deprecation: true` header

## Error catalog

All public errors use `KadarnErrorCode` from `@kadarn/types/errors`. SDK re-exports catalog.

## Backward compatibility

- Response envelope: `{ ok, data|error, request_id, correlation_id, generated_at }`
- No breaking field removals without ADR + minor version bump

## OpenAPI

- Legacy spec: `apps/api/openapi.yaml`
- v1 extension: `apps/api/openapi-v1.yaml`
- Docs UI: `GET /api/docs`

## SDK

- Package: `@kadarn/sdk`
- Smoke: `KadarnClient.health()`, `.passport()`, `.discoveryReport()`

## Gate

- [x] SDK package created
- [x] Error catalog in types
- [ ] Full OpenAPI for all 105 v1 routes (incremental)
