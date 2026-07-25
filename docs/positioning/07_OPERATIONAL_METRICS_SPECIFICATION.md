# Operational Metrics — Conceptual Specification

**Status:** Product concept — no implementation changes required

---

## Definition

Operational Metrics are dynamic institutional performance indicators that track how an institution operates in practice. They are distinct from static Claims — Claims assert what an institution *can* do; Metrics show what an institution *actually does* and *how well*.

## Core Principle

Metrics are not claims. They are quantitative observations about institutional behavior over time.

## Metric Catalog

### Enrollment Performance
| Metric | Definition | Source |
|--------|------------|--------|
| Enrollment Rate | Patients enrolled per month (avg) | Study records / CTMS |
| Screen Failure Rate | % of screened patients not enrolled | Study records |
| Randomization Rate | Patients randomized per month | Study records |
| Enrollment vs Target | Current enrollment as % of target | Study records |
| Diversity Enrollment | % of patients from underrepresented groups | Demographics data |

### Activation Timelines
| Metric | Definition | Source |
|--------|------------|--------|
| Site Activation Time | Days from award to first patient screened | Study records |
| Regulatory Approval Time | Days from submission to IRB/EC approval | Study records |
| Contract Execution Time | Days from CDNA to signed contract | Study records |
| Budget Negotiation Time | Days from budget proposal to approval | Study records |

### Retention & Completion
| Metric | Definition | Source |
|--------|------------|--------|
| Retention Rate | % of enrolled patients completing study | Study records |
| Dropout Rate | % of patients discontinuing early | Study records |
| Protocol Deviation Rate | Deviations per patient per year | Study records |
| Visit Compliance | % of scheduled visits completed | Study records |
| Data Query Rate | Queries per data point entered | EDC |

### Startup Metrics
| Metric | Definition | Source |
|--------|------------|--------|
| Site Qualification Time | Days from outreach to qualification | Study records |
| Staff Training Time | Days to complete site staff training | Training records |
| Lab Setup Time | Days from award to lab ready | Lab records |
| Supply Order Time | Days from award to supplies on site | Logistics records |

### Responsiveness
| Metric | Definition | Source |
|--------|------------|--------|
| Feasibility Response Time | Days to respond to feasibility questionnaire | Internal tracking |
| Question Resolution Time | Days to answer sponsor questions | Internal tracking |
| Document Submission Time | Days to submit regulatory documents | Internal tracking |
| Query Resolution Time | Days to resolve data queries | EDC |

## Implementation Approach

Operational Metrics are **not stored in the Evidence Graph**. They are:

1. **Imported** — From CTMS, EDC, or other operational systems via integration
2. **Calculated** — From study records and operational data
3. **Displayed** — As indicators alongside evidence-based claims

### Storage (Conceptual)

```sql
CREATE TABLE operational_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES organizations(id),
    metric_key TEXT NOT NULL,       -- e.g. 'enrollment_rate'
    metric_value NUMERIC NOT NULL,  -- e.g. 12.5
    metric_unit TEXT,               -- e.g. 'patients/month'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source TEXT,                    -- e.g. 'ctms', 'manual_entry'
    confidence NUMERIC(3,2),        -- confidence in this metric value
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Relationship to Discovery Readiness

Operational Metrics contribute to the Discovery Readiness Score in the following ways:

| Metric Group | Discovery Readiness Factor | Weight |
|-------------|--------------------------|--------|
| Enrollment Performance | Recruitment Capability | 10% |
| Activation Timelines | Operational Readiness | 5% |
| Retention & Completion | Operational Readiness | 5% |
| Startup Metrics | Operational Readiness | 3% |
| Responsiveness | Profile Completeness | 2% |

## MVP Implementation Path

1. **Phase 1**: Manual metric entry (institution enters their own metrics)
2. **Phase 2**: CTMS integration (automated metric import)
3. **Phase 3**: EDC integration (data quality metrics)
4. **Phase 4**: Trend analysis and benchmark comparisons
