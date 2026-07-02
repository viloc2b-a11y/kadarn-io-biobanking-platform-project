# Demo Scripts — Sprint 25F

**Date:** 2026-07-02

---

## Sponsor Demo Script (8 minutes)

### Screen 1: Sponsor Login → Sponsor Search
- Log in as "Global Pharma"
- Navigate to Sponsor Search

### Screen 2: Search for Capabilities
- Enter: "PBMC" in capabilities field
- Enter: "Phase I" in capabilities field  
- Enter: "Texas" in geography field
- Click Search

### Screen 3: Anonymous Results
- 2 matching institutions (Vilo Research Center, Lone Star SMO)
- Identity hidden: "Institution #1" and "Institution #2"
- Readiness shown: Presentation Ready, Needs Additional Evidence
- Strengths and concerns visible
- Click "Request Discovery Workspace" on Vilo match

### Screen 4: Discovery Workspace
- Pre-populated from search
- Add: study title "Phase II Oncology Trial"
- Add: therapeutic area "Oncology"
- Add: sample needs "PBMC, Plasma"
- Add: timeline "Q1 2027"
- Add: budget range
- Click "Generate Opportunity Brief"

### Screen 5: Opportunity Brief (Institution View — switch to Vilo login)
- Log in as Vilo Research Center
- Notification: "New Opportunity Brief received"
- Open brief: study summary, requirements, workload estimate
- Review "Why Kadarn matched you"
- Click "Grant Consent"

### Screen 6: Consent → Mutual Reveal
- Review requested access: PBMC Processing, PBMC asset
- Select scope: "Research Assets"
- Duration: 90 days
- Click "Grant"
- Mutual Reveal triggered automatically

### Screen 7: Feasibility Passport (Sponsor View — switch back)
- Sponsor sees Vilo Research Center identity now
- Living Feasibility Passport shows:
  - Capabilities: PBMC Processing (healthy, 2 evidence)
  - Research Assets: PBMC
  - Readiness: Presentation Ready
  - Recommendations: No action needed
- Version 1, generated just now

### Screen 8: Collaboration Workspace
- Both parties can access workspace
- Sections: Overview, Claims, Evidence, Timeline, Documents, Questions, Decisions
- End of demo

---

## Institution Demo Script (5 minutes)

### Screen 1: Site Director Login
- Log in as Vilo Research Center
- Recognition Dashboard visible

### Screen 2: Recognition Overview
- Capabilities detected: 8
- Research Assets enabled: 7
- Sponsor Readiness: Presentation Ready
- Evidence Gaps: 0 blocking

### Screen 3: Research Assets
- Grid showing Plasma, Serum, PBMC, Whole Blood, Clinical Dataset, Longitudinal Dataset, AI-ready Dataset
- Each asset with supporting capability

### Screen 4: Evidence Gaps
- 0 blocking gaps
- 2 non-blocking gaps: SOP governance, metadata completeness

### Screen 5: Sponsor Readiness
- Strengths: Strong biospecimen processing, Established clinical operations, Research asset portfolio
- No concerns
- Next step: Continue monitoring

### Screen 6: Generate Recognition Report
- Click "Generate Report"
- Report renders with all sections: Executive Summary, Capabilities, Assets, Evidence, Gaps, Readiness, Recommendations

### Screen 7: Executive Profile
- Navigate to Executive Profile
- Hero: Vilo Research Center, Houston TX
- Overview stats: 8 capabilities, 7 assets
- All sections populated

### Screen 8: Public Profile
- Show kadarn.io/institutions/vilo-research-center
- Public view: no internal IDs, no private evidence, no recommendations
- Clean, professional layout

---

## Kadarn Internal Demo Script (3 minutes)

### Screen 1: Health Dashboard
- `GET /api/health` → healthy, uptime, memory
- All 7 connectors: ClinicalTrials.gov, PubMed, CrossRef, OpenAlex, ORCID, ROR, FDA

### Screen 2: Visibility Inspector
- Policy matrix: Public=hidden, Sponsor=discovery, Institution=restricted, Internal=private
- Per-claim visibility policies

### Screen 3: Firewall Status
- Accepted: 1,247
- Accepted with warning: 83
- Quarantined: 12
- Rejected: 5
- Review queue: 3 open items

---

*These scripts should be executable by any team member without engineering support.*
