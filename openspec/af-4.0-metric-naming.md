# AF-4.0 Metric Naming Conventions

**Pattern:** `kadarn_<subsystem>_<metric>_<unit>`

## Subsystems

| Prefix | Subsystem |
|--------|-----------|
| `http` | API HTTP layer |
| `discovery` | Evidence discovery pipeline |
| `published_view` | Published View service |
| `delivery` | KEMS-007 Delivery Layer (reserved) |
| `queue` | Background jobs / event bus |
| `evidence` | Evidence Core operations |

## Standard HTTP metrics (Sprint 1)

| Metric | Type | Labels |
|--------|------|--------|
| `kadarn_http_requests_total` | counter | method, route, status |
| `kadarn_http_request_duration_seconds` | histogram | method, route |
| `kadarn_http_errors_total` | counter | method, route, status, code |

## Rules

- Use snake_case
- Units as suffix: `_total`, `_seconds`, `_bytes`
- Route label: normalized path template (e.g. `/api/v1/discovery/report`)
- Never include PII in labels
