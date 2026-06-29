package kadarn

# Starter Rego bundle for OPA sidecar shadow evaluations.
# Kadarn production policies remain JSON-evaluated via LocalOpaClient fallback.

default allow := false

allow {
  input.action == "read"
  input.actor.role == "kadarn_internal"
}
