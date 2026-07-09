// ==========================================================================
// KTP-1.3 — Hybrid Trial Interview (Adaptive)
// ==========================================================================
// Captures institutional readiness for hybrid, decentralized, and at-home
// clinical trials. Follows the adaptive interview pattern: gate questions
// control subtree visibility. Institutions only answer what's relevant.
//
// Claim families covered (see docs/domain/claim-taxonomy-v1.1-hybrid-trial.md):
//   1. clinical_trials.hybrid.site_execution
//   2. clinical_trials.hybrid.at_home_coordination
//   3. clinical_trials.hybrid.data_integrity
//   4. clinical_trials.hybrid.patient_access_diversity
//   5. clinical_trials.hybrid.biospecimen_at_home
//   6. clinical_trials.hybrid.remote_monitoring
//   7. clinical_trials.hybrid.vendor_nurse_coordination
//   8. clinical_trials.hybrid.protocol_compliance
//   9. clinical_trials.hybrid.safety_escalation
//  10. clinical_trials.hybrid.historical_experience
//
// Design rules:
//   - Gate questions prevent universal questioning
//   - N/A declaration closes the branch without penalty
//   - No duplication of Organization, People, Infrastructure, or Documents data
//   - Each question maps to a claim family and evidence expectation
//   - Unknown is the default — not collected ≠ incapable
// ==========================================================================

import type { InterviewSection } from '@/lib/onboarding/interview-engine'

// ==========================================================================
// HELPER: Question builder with hybrid-trial domain and claim mapping
// ==========================================================================

interface HTQuestion {
  id: string
  section: string
  number: number
  question: string
  help: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date'
  options?: { value: string; label: string; description?: string }[]
  required: boolean
  generatesClaim: string
  feedsCapability: string | null
  affectsReadiness: string
  isGate?: boolean
  condition?: { questionId: string; operator: 'equals' | 'not_equals' | 'contains' | 'is_truthy' | 'is_falsy'; value: string | boolean }
}

// Inline builder to reduce boilerplate
const q = (def: HTQuestion): import('@/lib/onboarding/interview-engine').InterviewQuestion => ({
  ...def,
  domain: 'hybrid-trial',
  generatesClaim: def.generatesClaim || null,
  feedsCapability: def.feedsCapability || null,
  affectsReadiness: def.affectsReadiness || null,
})

// ==========================================================================
// HYBRID TRIAL INTERVIEW
// ==========================================================================

export const HYBRID_TRIAL_INTERVIEW: InterviewSection[] = [

  // ========================================================================
  // MODULE 1: Core Hybrid Readiness (always shown)
  // ========================================================================
  {
    id: 'ht-core',
    domain: 'hybrid-trial',
    title: 'Hybrid Trial Experience',
    description: 'Your institution\'s experience with hybrid, decentralized, and at-home clinical trials. If you have none, we\'ll skip the historical module — this does not penalize your readiness.',
    questions: [
      q({
        id: 'ht_has_hybrid_exp', section: 'core', number: 1,
        question: 'Has your institution participated in hybrid or decentralized clinical trials (DCTs)?',
        help: 'Hybrid/DCT trials include any combination of site-based and at-home visits, remote monitoring, eConsent, or direct-to-patient shipping.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we have participated in hybrid or DCT studies' },
          { value: 'no', label: 'No — we have not participated in hybrid or DCT studies' },
        ],
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: 'Hybrid Trial Historical Experience',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_count', section: 'core', number: 2,
        question: 'How many hybrid or DCT studies has your institution participated in?',
        help: 'Include all studies with at least one decentralized component (at-home visits, remote monitoring, eConsent, direct-to-patient).',
        type: 'number', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: 'Hybrid Trial Historical Experience',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_phases', section: 'core', number: 3,
        question: 'Which trial phases have you conducted in hybrid/DCT format?',
        help: 'Select all that apply.',
        type: 'checkbox', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        options: [
          { value: 'phase_i', label: 'Phase I' },
          { value: 'phase_ii', label: 'Phase II' },
          { value: 'phase_iii', label: 'Phase III' },
          { value: 'phase_iv', label: 'Phase IV / Post-Market' },
          { value: 'observational', label: 'Observational / Registry' },
          { value: 'device', label: 'Device Study' },
        ],
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: null,
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_components', section: 'core', number: 4,
        question: 'Which decentralized components have you used?',
        help: 'This helps us understand the breadth of your hybrid experience.',
        type: 'checkbox', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        options: [
          { value: 'at_home_visits', label: 'At-Home Visits (home health / mobile research nurses)' },
          { value: 'remote_monitoring', label: 'Remote Monitoring (wearables, sensors, home devices)' },
          { value: 'econsent', label: 'Electronic Informed Consent (eConsent)' },
          { value: 'dtp_shipping', label: 'Direct-to-Patient Shipping (IP or biospecimen kits)' },
          { value: 'telemedicine', label: 'Telemedicine Visits' },
          { value: 'patient_app', label: 'Patient-Facing App or ePRO' },
          { value: 'local_lab', label: 'Local Lab / Imaging (decentralized assessments)' },
        ],
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: null,
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_therapeutic', section: 'core', number: 5,
        question: 'In which therapeutic areas have you conducted hybrid/DCT studies?',
        help: 'Optional — enter as free text or comma-separated list.',
        type: 'textarea', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: null,
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_lessons', section: 'core', number: 6,
        question: 'Do you have documented lessons learned from prior hybrid/DCT studies?',
        help: 'Upload these in the Documents section. Lessons learned strengthen your historical experience claim.',
        type: 'radio', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        options: [
          { value: 'yes', label: 'Yes — we have documented lessons learned' },
          { value: 'no', label: 'Not formally documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: null,
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_hybrid_exp_sponsors', section: 'core', number: 7,
        question: 'Which sponsors or CROs have you conducted hybrid/DCT studies with?',
        help: 'Optional — this can help with sponsor references.',
        type: 'textarea', required: false,
        condition: { questionId: 'ht_has_hybrid_exp', operator: 'equals', value: 'yes' },
        generatesClaim: 'clinical_trials.hybrid.historical_experience',
        feedsCapability: null,
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 2: Site-Based Execution (always shown)
  // ========================================================================
  {
    id: 'ht-site-execution',
    domain: 'hybrid-trial',
    title: 'Site-Based Execution',
    description: 'Even in hybrid trials, physical site infrastructure matters. This evaluates your site-based execution capability.',
    questions: [
      q({
        id: 'ht_site_dedicated_space', section: 'site-execution', number: 8,
        question: 'Do you have dedicated research space for site-based hybrid trial visits?',
        help: 'This includes exam rooms, infusion areas, monitoring rooms, and specimen processing space.',
        type: 'radio', required: true,
        options: [
          { value: 'dedicated', label: 'Yes — dedicated research wing, floor, or suite' },
          { value: 'shared', label: 'Shared — clinical and research spaces overlap' },
          { value: 'minimal', label: 'Minimal — limited or no dedicated research space' },
        ],
        generatesClaim: 'clinical_trials.hybrid.site_execution',
        feedsCapability: 'Hybrid Site Execution',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_site_exam_rooms', section: 'site-execution', number: 9,
        question: 'How many exam/consult rooms are available for research visits?',
        help: 'Count rooms dedicated to or regularly used for research, not total facility rooms.',
        type: 'number', required: true,
        generatesClaim: 'clinical_trials.hybrid.site_execution',
        feedsCapability: 'Hybrid Site Execution',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_site_staff_deployed', section: 'site-execution', number: 10,
        question: 'Do you have dedicated research staff for site-based protocol visits?',
        help: 'This includes PIs, sub-investigators, coordinators, and research nurses assigned to site visits.',
        type: 'radio', required: true,
        options: [
          { value: 'dedicated', label: 'Yes — dedicated research team for site visits' },
          { value: 'shared', label: 'Shared — clinical staff also conduct research visits' },
          { value: 'minimal', label: 'Minimal — limited research staff availability' },
        ],
        generatesClaim: 'clinical_trials.hybrid.site_execution',
        feedsCapability: 'Hybrid Site Execution',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_site_visit_sop', section: 'site-execution', number: 11,
        question: 'Do you have a documented site visit execution SOP?',
        help: 'Upload in the Documents section. Evidence Class B. Required for moderate confidence.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — SOP documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — SOP exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal site visit SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.site_execution',
        feedsCapability: 'Hybrid Site Execution',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 3: At-Home Coordination — GATE
  // ========================================================================
  {
    id: 'ht-home-gate',
    domain: 'hybrid-trial',
    title: 'At-Home Visits',
    description: 'At-home visits are the defining feature of decentralized trials. We only ask if this applies to you.',
    questions: [
      q({
        id: 'ht_has_home_visits', section: 'at-home', number: 12,
        question: 'Do you conduct or plan to conduct at-home patient visits as part of clinical trials?',
        help: 'At-home visits include any research activity conducted at the patient\'s home by your staff or contracted providers. If no, we skip all at-home, vendor, and biospecimen-at-home modules — this does not penalize readiness.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we conduct or plan to conduct at-home visits' },
          { value: 'no', label: 'No — we do not conduct at-home visits' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 4: At-Home Coordination — Details (gated)
  // ========================================================================
  {
    id: 'ht-home-details',
    domain: 'hybrid-trial',
    title: 'At-Home Coordination Details',
    description: 'How you coordinate and manage at-home patient visits.',
    gateCondition: { questionId: 'ht_has_home_visits', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_home_resp_matrix', section: 'at-home', number: 13,
        question: 'Do you have a documented responsibility matrix for at-home visits?',
        help: 'A responsibility matrix defines who does what: PI oversight, CRC scheduling, home health RN procedures, vendor coordination, and escalation. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal responsibility matrix' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_home_workflow_sop', section: 'at-home', number: 14,
        question: 'Do you have a documented at-home visit workflow SOP?',
        help: 'Should cover scheduling, confirmation, visit execution, documentation, and data entry. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal at-home workflow SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_home_comm_workflow', section: 'at-home', number: 15,
        question: 'Do you have a documented communication workflow for at-home visits?',
        help: 'Defines how the site, home health provider, patient, and sponsor communicate during at-home visit execution. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal communication workflow' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_home_escalation_pathway', section: 'at-home', number: 16,
        question: 'Do you have a documented escalation pathway for at-home incidents?',
        help: 'Defines what happens if a patient has an adverse event at home, if the home health provider encounters an unsafe environment, or if a visit cannot be completed. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal escalation pathway' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_home_patient_comm', section: 'at-home', number: 17,
        question: 'What patient communication channels do you use for at-home visits?',
        help: 'Select all that apply.',
        type: 'checkbox', required: false,
        options: [
          { value: 'phone', label: 'Phone call' },
          { value: 'sms', label: 'SMS / Text message' },
          { value: 'portal', label: 'Patient portal / secure messaging' },
          { value: 'video', label: 'Video call / Telehealth' },
          { value: 'home_device', label: 'Home device / Tablet provided to patient' },
          { value: 'email', label: 'Email' },
        ],
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_home_providers_contracted', section: 'at-home', number: 18,
        question: 'How many home health providers or agencies are you contracted with?',
        help: 'Enter 0 if you use only internal staff for home visits.',
        type: 'number', required: true,
        generatesClaim: 'clinical_trials.hybrid.at_home_coordination',
        feedsCapability: 'At-Home Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 5: Vendor / Home Nurse Coordination (gated: has home visits)
  // ========================================================================
  {
    id: 'ht-vendor-details',
    domain: 'hybrid-trial',
    title: 'Vendor & Home Nurse Coordination',
    description: 'How you qualify, train, and monitor external vendors and home nursing providers.',
    gateCondition: { questionId: 'ht_has_home_visits', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_vendor_qual_sop', section: 'vendor', number: 19,
        question: 'Do you have a vendor qualification SOP?',
        help: 'Covers how you evaluate, select, and onboard home health agencies, mobile phlebotomy services, and nursing providers. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal vendor qualification process' },
        ],
        generatesClaim: 'clinical_trials.hybrid.vendor_nurse_coordination',
        feedsCapability: 'Vendor / Home Nurse Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_vendor_training_sop', section: 'vendor', number: 20,
        question: 'Do you have a vendor training SOP?',
        help: 'Covers protocol-specific training, competency assessment, and documentation for vendor staff. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal vendor training process' },
        ],
        generatesClaim: 'clinical_trials.hybrid.vendor_nurse_coordination',
        feedsCapability: 'Vendor / Home Nurse Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_vendor_perf_tracking', section: 'vendor', number: 21,
        question: 'Do you track vendor performance metrics?',
        help: 'Includes on-time visit rates, protocol compliance, safety events, and patient satisfaction for vendor-delivered services. Evidence Class C.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — we track and document vendor performance' },
          { value: 'partial', label: 'Partially — informal tracking, no formal metrics' },
          { value: 'no', label: 'No — we do not track vendor performance' },
        ],
        generatesClaim: 'clinical_trials.hybrid.vendor_nurse_coordination',
        feedsCapability: 'Vendor / Home Nurse Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_vendor_ip_training', section: 'vendor', number: 22,
        question: 'If home nurses administer investigational product, do you provide IP-specific training?',
        help: 'Only answer if applicable. Evidence Class B. Conditional — required if IP administration at home is declared.',
        type: 'radio', required: false,
        options: [
          { value: 'yes', label: 'Yes — IP-specific training documented' },
          { value: 'no', label: 'No — home nurses do not administer IP' },
          { value: 'na', label: 'Not applicable — we do not use home nurses for IP administration' },
        ],
        generatesClaim: 'clinical_trials.hybrid.vendor_nurse_coordination',
        feedsCapability: 'Vendor / Home Nurse Coordination',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 6: Biospecimen-at-Home — GATE (gated: has home visits)
  // ========================================================================
  {
    id: 'ht-bio-home-gate',
    domain: 'hybrid-trial',
    title: 'Biospecimen Collection at Home',
    description: 'Collecting biospecimens at home adds unique requirements. We only ask if this applies.',
    gateCondition: { questionId: 'ht_has_home_visits', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_has_bio_home', section: 'biospecimen-home', number: 23,
        question: 'Do you collect biospecimens during at-home visits?',
        help: 'Includes blood draws, saliva, urine, or any biological sample collected at the patient\'s home by your staff or contracted providers. If no, we skip biospecimen-at-home, chain of custody, shipping, and temperature modules.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we collect biospecimens during at-home visits' },
          { value: 'no', label: 'No — we do not collect biospecimens at home' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 7: Biospecimen-at-Home — Collection (gated)
  // ========================================================================
  {
    id: 'ht-bio-collection',
    domain: 'hybrid-trial',
    title: 'At-Home Collection Procedures',
    description: 'How you collect and handle biospecimens in the home environment.',
    gateCondition: { questionId: 'ht_has_bio_home', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_bio_collection_sop', section: 'biospecimen-home', number: 24,
        question: 'Do you have a documented at-home collection SOP?',
        help: 'Covers collection kit preparation, patient identification, specimen collection procedure, stabilization, and packaging. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal at-home collection SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_bio_kits_validated', section: 'biospecimen-home', number: 25,
        question: 'Are your at-home collection kits validated?',
        help: 'Validation includes stability testing, transport simulation, and collection procedure verification. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — kits validated with documented results' },
          { value: 'partial', label: 'Partially — some kits validated, others pending' },
          { value: 'no', label: 'No — kits not formally validated' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_bio_sample_workflow', section: 'biospecimen-home', number: 26,
        question: 'Do you have a documented sample workflow for at-home collection?',
        help: 'Defines handling from collection through stabilization, packaging, labeling, and handoff to courier. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal sample workflow' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_bio_specimen_types_home', section: 'biospecimen-home', number: 27,
        question: 'What specimen types do you collect at home?',
        help: 'Select all that apply.',
        type: 'checkbox', required: true,
        options: [
          { value: 'whole_blood', label: 'Whole Blood (venipuncture)' },
          { value: 'fingerstick', label: 'Capillary Blood (fingerstick)' },
          { value: 'saliva', label: 'Saliva' },
          { value: 'urine', label: 'Urine' },
          { value: 'stool', label: 'Stool' },
          { value: 'nasal', label: 'Nasal / Nasopharyngeal Swab' },
          { value: 'other', label: 'Other specimen type' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 8: Chain of Custody — At-Home (gated)
  // ========================================================================
  {
    id: 'ht-chain-custody',
    domain: 'hybrid-trial',
    title: 'Chain of Custody — Home to Lab',
    description: 'Maintaining traceability from the moment of collection at home through lab receipt.',
    gateCondition: { questionId: 'ht_has_bio_home', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_custody_sop', section: 'chain-custody', number: 28,
        question: 'Do you have a documented chain of custody SOP for at-home collections?',
        help: 'Must cover every handoff: collector → packaging → courier pickup → transport → lab receipt. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal chain of custody SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_custody_documentation', section: 'chain-custody', number: 29,
        question: 'How do you document chain of custody for at-home collections?',
        help: 'Evidence Class C — operational records are required for moderate confidence.',
        type: 'radio', required: true,
        options: [
          { value: 'digital', label: 'Digital — electronic chain of custody with timestamps' },
          { value: 'paper', label: 'Paper — physical custody forms with signatures' },
          { value: 'mixed', label: 'Mixed — combination of digital and paper' },
          { value: 'none', label: 'Not formally documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_custody_handoff_points', section: 'chain-custody', number: 30,
        question: 'How many documented handoff points are in your chain of custody?',
        help: 'Typical: collector → packaging → courier → lab. More handoffs = more documentation needed.',
        type: 'number', required: false,
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 9: Shipping / Courier — At-Home (gated)
  // ========================================================================
  {
    id: 'ht-shipping',
    domain: 'hybrid-trial',
    title: 'Shipping & Courier — Home Pickups',
    description: 'How specimens move from patient homes to your lab.',
    gateCondition: { questionId: 'ht_has_bio_home', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_ship_courier_workflow', section: 'shipping', number: 31,
        question: 'Do you have a documented courier/shipping workflow for home pickups?',
        help: 'Covers scheduling, pickup windows, packaging requirements, and handoff procedures. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal courier workflow' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_ship_provider_count', section: 'shipping', number: 32,
        question: 'How many courier providers do you use for home pickups?',
        help: 'Enter 0 if you do not use couriers for home pickups.',
        type: 'number', required: true,
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_ship_intl', section: 'shipping', number: 33,
        question: 'Do you ship biospecimens internationally from patient homes?',
        help: 'International shipping requires IATA-certified staff and additional documentation.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — we ship internationally from patient homes' },
          { value: 'domestic_only', label: 'No — domestic shipping only' },
          { value: 'no_shipping', label: 'No — we do not ship from patient homes' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_ship_iata_cert', section: 'shipping', number: 34,
        question: 'Do you have IATA-certified staff for dangerous goods shipping?',
        help: 'Required if shipping internationally or shipping Category B biological substances. Upload certificates in Documents.',
        type: 'radio', required: false,
        options: [
          { value: 'yes', label: 'Yes — IATA-certified staff on file' },
          { value: 'no', label: 'No — no IATA-certified staff' },
          { value: 'na', label: 'Not applicable — no international or dangerous goods shipping' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 10: Temperature / Cold Chain — At-Home (gated)
  // ========================================================================
  {
    id: 'ht-temp-chain',
    domain: 'hybrid-trial',
    title: 'Temperature & Cold Chain — Home to Lab',
    description: 'Maintaining temperature control during home-to-lab transport is critical for specimen integrity.',
    gateCondition: { questionId: 'ht_has_bio_home', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_temp_monitoring_home', section: 'temperature', number: 35,
        question: 'Do you monitor temperature during home-to-lab transport?',
        help: 'Continuous temperature monitoring with data loggers is the standard for regulated studies. Evidence Class C.',
        type: 'radio', required: true,
        options: [
          { value: 'continuous', label: 'Yes — continuous monitoring with data loggers' },
          { value: 'checkpoints', label: 'Partially — temperature checked at pickup and receipt only' },
          { value: 'passive', label: 'Passive — validated packaging, no active monitoring' },
          { value: 'none', label: 'No — temperature not monitored during transport' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_temp_excursion_process', section: 'temperature', number: 36,
        question: 'Do you have a documented temperature excursion process?',
        help: 'Defines what happens when temperature goes out of range: who is notified, how the specimen is assessed, and what corrective action is taken.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented process with escalation and resolution tracking' },
          { value: 'yes_not_uploaded', label: 'Yes — process exists but not documented' },
          { value: 'no', label: 'No — no formal temperature excursion process' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_temp_packaging_validated', section: 'temperature', number: 37,
        question: 'Is your cold chain packaging validated for home-to-lab transport duration?',
        help: 'Validation should cover the maximum expected transport time from the farthest patient home to your lab.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — packaging validated for transport duration' },
          { value: 'partial', label: 'Partially — validated for some routes/conditions' },
          { value: 'no', label: 'No — packaging not formally validated' },
        ],
        generatesClaim: 'clinical_trials.hybrid.biospecimen_at_home',
        feedsCapability: 'Biospecimen-at-Home',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 11: Hybrid Data Integrity (always shown)
  // ========================================================================
  {
    id: 'ht-data-integrity',
    domain: 'hybrid-trial',
    title: 'Hybrid Data Integrity',
    description: 'Maintaining data integrity when data flows from multiple sources: site EMR, at-home devices, eConsent, remote monitoring feeds.',
    questions: [
      q({
        id: 'ht_data_source_doc_sop', section: 'data-integrity', number: 38,
        question: 'Do you have a source documentation SOP covering all data collection points?',
        help: 'Must cover site-based, at-home, and remote data sources. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded, covers all collection points' },
          { value: 'yes_site_only', label: 'Partially — covers site-based only, not at-home/remote' },
          { value: 'no', label: 'No — no formal source documentation SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_integrity_sop', section: 'data-integrity', number: 39,
        question: 'Do you have a data integrity / data review SOP?',
        help: 'Must define how data from different sources is reconciled and reviewed before database lock. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal data integrity SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_ehr_edc_platforms', section: 'data-integrity', number: 40,
        question: 'Which EHR/EDC/eSource/eConsent platforms do you use?',
        help: 'Select all that apply. This helps map your data flow.',
        type: 'checkbox', required: true,
        options: [
          { value: 'ehr_emr', label: 'EHR / EMR (electronic health record)' },
          { value: 'edc', label: 'EDC (electronic data capture)' },
          { value: 'esource', label: 'eSource (direct data entry)' },
          { value: 'econsent', label: 'eConsent (electronic informed consent)' },
          { value: 'epro', label: 'ePRO / eCOA (patient-reported outcomes)' },
          { value: 'ctms', label: 'CTMS (clinical trial management system)' },
          { value: 'other', label: 'Other platform' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_workflow_documented', section: 'data-integrity', number: 41,
        question: 'Are your EHR/EDC/eSource/eConsent workflows documented?',
        help: 'Each platform should have documented workflow procedures. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'all', label: 'Yes — all platforms have documented workflows' },
          { value: 'some', label: 'Partially — some platforms documented, others not' },
          { value: 'no', label: 'No — workflows not formally documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_audit_trail', section: 'data-integrity', number: 42,
        question: 'Do you maintain audit trails for data changes across platforms?',
        help: 'Evidence Class C. Audit trail records are operational evidence of data integrity.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — audit trails maintained and exportable' },
          { value: 'partial', label: 'Partially — some platforms have audit trails, others do not' },
          { value: 'no', label: 'No — audit trails not maintained' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_query_process', section: 'data-integrity', number: 43,
        question: 'Do you have a documented query management process?',
        help: 'Covers how data queries are raised, tracked, resolved, and closed. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal query management process' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_review_workflow', section: 'data-integrity', number: 44,
        question: 'Do you have a documented data review workflow before database lock?',
        help: 'Defines who reviews data, how discrepancies between site and remote data are resolved, and sign-off process. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal data review workflow' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_data_part11_compliant', section: 'data-integrity', number: 45,
        question: 'Do you have 21 CFR Part 11 compliance documentation for your eSource/eConsent systems?',
        help: 'Evidence Class A. Required if you use eSource or eConsent. Upload system validation and Part 11 assessment documents.',
        type: 'radio', required: false,
        options: [
          { value: 'yes', label: 'Yes — Part 11 compliance documented' },
          { value: 'no', label: 'No — Part 11 compliance not documented' },
          { value: 'na', label: 'Not applicable — we do not use eSource or eConsent' },
        ],
        generatesClaim: 'clinical_trials.hybrid.data_integrity',
        feedsCapability: 'Hybrid Data Integrity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 12: Patient Access & Diversity (always shown)
  // ========================================================================
  {
    id: 'ht-patient-access',
    domain: 'hybrid-trial',
    title: 'Patient Access & Diversity',
    description: 'Hybrid trials can expand access to diverse populations. This evaluates your reach.',
    questions: [
      q({
        id: 'ht_patient_panel_size', section: 'patient-access', number: 46,
        question: 'What is your active patient panel size?',
        help: 'Estimated number of active patients across all therapeutic areas who could potentially participate in research.',
        type: 'number', required: true,
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_patient_panel_documented', section: 'patient-access', number: 47,
        question: 'Is your patient panel demographics documented?',
        help: 'Demographics documentation should characterize your panel by age, gender, race, ethnicity, and therapeutic area. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — not formally documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_geo_reach', section: 'patient-access', number: 48,
        question: 'What is your geographic reach?',
        help: 'Hybrid trials can extend your reach beyond your physical location. Select the widest reach you can serve.',
        type: 'radio', required: true,
        options: [
          { value: 'single_city', label: 'Single city / metro area' },
          { value: 'state_region', label: 'State / Region (multiple cities)' },
          { value: 'national', label: 'National (multiple states/regions)' },
          { value: 'multi_country', label: 'Multi-Country (international reach)' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_languages', section: 'patient-access', number: 49,
        question: 'What languages do you support for patient-facing research activities?',
        help: 'Include languages for which you have translated consent forms, staff fluency, or interpreter services.',
        type: 'checkbox', required: true,
        options: [
          { value: 'english', label: 'English' },
          { value: 'spanish', label: 'Spanish' },
          { value: 'mandarin', label: 'Mandarin Chinese' },
          { value: 'cantonese', label: 'Cantonese' },
          { value: 'vietnamese', label: 'Vietnamese' },
          { value: 'arabic', label: 'Arabic' },
          { value: 'french', label: 'French' },
          { value: 'portuguese', label: 'Portuguese' },
          { value: 'russian', label: 'Russian' },
          { value: 'korean', label: 'Korean' },
          { value: 'hindi', label: 'Hindi' },
          { value: 'other', label: 'Other language(s)' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_language_access_doc', section: 'patient-access', number: 50,
        question: 'Do you have documented language accessibility services?',
        help: 'For each supported non-English language, upload documentation of interpreter services, translated materials, or bilingual staff. Evidence Class B.',
        type: 'radio', required: false,
        options: [
          { value: 'yes', label: 'Yes — language accessibility documented for all supported languages' },
          { value: 'partial', label: 'Partially — documented for some languages' },
          { value: 'no', label: 'No — not formally documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_underserved_access', section: 'patient-access', number: 51,
        question: 'Do you have underserved community access programs?',
        help: 'Includes community partnerships, referral networks, mobile clinics, or transportation assistance for underserved populations.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — active underserved access programs' },
          { value: 'planned', label: 'In development — programs planned but not yet active' },
          { value: 'no', label: 'No — no specific underserved access programs' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_underserved_programs_detail', section: 'patient-access', number: 52,
        question: 'Describe your underserved community access programs.',
        help: 'Include community partners, referral networks, and any documented outcomes.',
        type: 'textarea', required: false,
        condition: { questionId: 'ht_underserved_access', operator: 'equals', value: 'yes' },
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 13: Retention (always shown)
  // ========================================================================
  {
    id: 'ht-retention',
    domain: 'hybrid-trial',
    title: 'Patient Retention',
    description: 'Retention is critical in hybrid trials where patients have less frequent site contact.',
    questions: [
      q({
        id: 'ht_retention_tracked', section: 'retention', number: 53,
        question: 'Do you track patient retention rates across studies?',
        help: 'Retention = patients who complete the study / patients enrolled. Evidence Class C.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — retention tracked and documented per study' },
          { value: 'partial', label: 'Partially — tracked informally, not formally documented' },
          { value: 'no', label: 'No — retention not systematically tracked' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_retention_rate', section: 'retention', number: 54,
        question: 'What is your approximate overall patient retention rate?',
        help: 'Estimated percentage across all studies in the past 3 years.',
        type: 'number', required: false,
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_retention_strategies', section: 'retention', number: 55,
        question: 'What retention strategies do you use for hybrid/DCT studies?',
        help: 'Select all that apply.',
        type: 'checkbox', required: false,
        options: [
          { value: 'transportation', label: 'Transportation assistance' },
          { value: 'flexible_hours', label: 'Flexible visit hours (evenings/weekends)' },
          { value: 'telemedicine', label: 'Telemedicine follow-ups' },
          { value: 'reminders', label: 'Automated appointment reminders' },
          { value: 'stipends', label: 'Patient stipends / compensation' },
          { value: 'home_visits', label: 'Home visit option to reduce travel' },
          { value: 'care_coordination', label: 'Care coordination / navigation' },
          { value: 'community_engagement', label: 'Community engagement / education' },
        ],
        generatesClaim: 'clinical_trials.hybrid.patient_access_diversity',
        feedsCapability: 'Patient Access & Diversity',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 14: Remote Monitoring — GATE
  // ========================================================================
  {
    id: 'ht-remote-mon-gate',
    domain: 'hybrid-trial',
    title: 'Remote Monitoring',
    description: 'Remote monitoring extends data collection beyond the clinic using wearables, sensors, and home devices.',
    questions: [
      q({
        id: 'ht_has_remote_mon', section: 'remote-monitoring', number: 56,
        question: 'Do you deploy remote monitoring devices in clinical trials?',
        help: 'Includes wearables (activity trackers, ECG patches, glucose monitors), home monitoring devices (BP cuffs, spirometers, scales), and patient-facing apps. If no, we skip the remote monitoring module.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we deploy remote monitoring devices' },
          { value: 'no', label: 'No — we do not use remote monitoring' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 15: Remote Monitoring — Details (gated)
  // ========================================================================
  {
    id: 'ht-remote-mon-details',
    domain: 'hybrid-trial',
    title: 'Remote Monitoring Capabilities',
    description: 'How you deploy, manage, and integrate remote monitoring.',
    gateCondition: { questionId: 'ht_has_remote_mon', operator: 'equals', value: 'yes' },
    questions: [
      q({
        id: 'ht_rm_monitoring_sop', section: 'remote-monitoring', number: 57,
        question: 'Do you have a remote monitoring SOP?',
        help: 'Covers device deployment, patient training, data ingestion, and alert management. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal remote monitoring SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_rm_device_sop', section: 'remote-monitoring', number: 58,
        question: 'Do you have a device management SOP?',
        help: 'Covers inventory, calibration, deployment, retrieval, cleaning, and maintenance. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal device management SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_rm_patient_training', section: 'remote-monitoring', number: 59,
        question: 'Do you provide documented patient training for deployed devices?',
        help: 'Training materials should include device use, troubleshooting, and data transmission verification. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — documented training with comprehension verification' },
          { value: 'informal', label: 'Informal — verbal training, not documented' },
          { value: 'no', label: 'No — no formal patient training' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_rm_data_ingestion', section: 'remote-monitoring', number: 60,
        question: 'How is remote monitoring data ingested into your clinical data flow?',
        help: 'Evidence Class B/C depending on automation level.',
        type: 'radio', required: true,
        options: [
          { value: 'automated', label: 'Automated — direct integration with EDC or data platform' },
          { value: 'semi_automated', label: 'Semi-automated — device data downloaded and uploaded' },
          { value: 'manual', label: 'Manual — data transcribed from device reports' },
          { value: 'no_integration', label: 'No integration — remote data not in clinical data flow' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_rm_alert_mgmt', section: 'remote-monitoring', number: 61,
        question: 'Do you have documented alert management procedures for device-generated alerts?',
        help: 'Defines how device alerts (e.g., abnormal vital signs, device malfunction, data loss) are triaged, escalated, and documented.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal alert management process' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_rm_device_types', section: 'remote-monitoring', number: 62,
        question: 'What types of remote monitoring devices have you deployed?',
        help: 'Select all that apply.',
        type: 'checkbox', required: false,
        options: [
          { value: 'activity', label: 'Activity / Sleep Trackers' },
          { value: 'ecg', label: 'ECG / Cardiac Monitors' },
          { value: 'glucose', label: 'Continuous Glucose Monitors' },
          { value: 'bp', label: 'Blood Pressure Monitors' },
          { value: 'spirometer', label: 'Spirometers' },
          { value: 'scale', label: 'Smart Scales' },
          { value: 'pulse_ox', label: 'Pulse Oximeters' },
          { value: 'thermometer', label: 'Smart Thermometers' },
          { value: 'patient_app', label: 'Patient-Facing App / ePRO' },
          { value: 'other', label: 'Other device type' },
        ],
        generatesClaim: 'clinical_trials.hybrid.remote_monitoring',
        feedsCapability: 'Remote Monitoring',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 16: Safety Escalation (always shown)
  // ========================================================================
  {
    id: 'ht-safety',
    domain: 'hybrid-trial',
    title: 'Safety Escalation',
    description: 'Managing safety events across distributed settings: site, at-home, and remote.',
    questions: [
      q({
        id: 'ht_safety_escalation_sop', section: 'safety', number: 63,
        question: 'Do you have a documented safety escalation SOP covering site, remote, and at-home settings?',
        help: 'Must include AE/SAE detection, reporting timelines, and escalation pathways for each setting. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded, covers all settings' },
          { value: 'yes_site_only', label: 'Partially — covers site only, not at-home/remote' },
          { value: 'no', label: 'No — no formal safety escalation SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_safety_emergency_sop', section: 'safety', number: 64,
        question: 'Do you have an emergency response SOP for non-site settings?',
        help: 'Must define what happens if a patient has a medical emergency at home or if a remote monitoring device detects a critical alert. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal emergency response SOP for non-site settings' },
        ],
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_safety_home_escalation', section: 'safety', number: 65,
        question: 'Do you have a documented at-home safety escalation pathway?',
        help: 'Specifically for incidents during at-home visits: who the home health provider contacts, how the PI is notified, and emergency services integration.',
        type: 'radio', required: false,
        condition: { questionId: 'ht_has_home_visits', operator: 'equals', value: 'yes' },
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — at-home safety escalation not separately documented' },
        ],
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_safety_drills', section: 'safety', number: 66,
        question: 'Do you conduct safety escalation drills?',
        help: 'Drills test whether escalation pathways work in practice. Evidence Class C. At least annual drills are recommended.',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — drills conducted and documented at least annually' },
          { value: 'occasional', label: 'Occasionally — drills conducted but not regularly scheduled' },
          { value: 'no', label: 'No — escalation drills not conducted' },
        ],
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_safety_drill_freq', section: 'safety', number: 67,
        question: 'How many safety escalation drills have you conducted in the past 12 months?',
        help: 'Enter number of documented drills.',
        type: 'number', required: false,
        condition: { questionId: 'ht_safety_drills', operator: 'is_truthy', value: true },
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_safety_ae_reporting', section: 'safety', number: 68,
        question: 'Do your AE/SAE reporting procedures account for distributed trial settings?',
        help: 'For example: how is an AE detected during a telemedicine visit reported? How is a remote monitoring alert escalated to a safety report?',
        type: 'radio', required: true,
        options: [
          { value: 'yes', label: 'Yes — AE/SAE procedures cover site, remote, and at-home detection' },
          { value: 'site_only', label: 'Partially — AE/SAE procedures cover site-based detection only' },
          { value: 'no', label: 'No — AE/SAE procedures not adapted for distributed settings' },
        ],
        generatesClaim: 'clinical_trials.hybrid.safety_escalation',
        feedsCapability: 'Safety Escalation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },

  // ========================================================================
  // MODULE 17: Protocol Compliance Documentation (always shown)
  // ========================================================================
  {
    id: 'ht-compliance',
    domain: 'hybrid-trial',
    title: 'Protocol Compliance Documentation',
    description: 'Tracking protocol compliance across distributed trial settings.',
    questions: [
      q({
        id: 'ht_compliance_deviation_sop', section: 'compliance', number: 69,
        question: 'Do you have a documented protocol deviation tracking SOP?',
        help: 'Must cover deviation identification, classification, documentation, and reporting across site, remote, and at-home settings. Evidence Class B. Required.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded, covers all settings' },
          { value: 'yes_site_only', label: 'Partially — covers site only' },
          { value: 'no', label: 'No — no formal deviation tracking SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.protocol_compliance',
        feedsCapability: 'Protocol Compliance Documentation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_compliance_monitoring_sop', section: 'compliance', number: 70,
        question: 'Do you have a documented compliance monitoring SOP?',
        help: 'Defines how compliance is monitored across distributed settings, monitoring frequency, and documentation standards. Evidence Class B.',
        type: 'radio', required: true,
        options: [
          { value: 'yes_uploaded', label: 'Yes — documented and uploaded' },
          { value: 'yes_not_uploaded', label: 'Yes — exists but not yet uploaded' },
          { value: 'no', label: 'No — no formal compliance monitoring SOP' },
        ],
        generatesClaim: 'clinical_trials.hybrid.protocol_compliance',
        feedsCapability: 'Protocol Compliance Documentation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
      q({
        id: 'ht_compliance_capa_linked', section: 'compliance', number: 71,
        question: 'Are CAPA records linked to protocol deviations?',
        help: 'Evidence Class C. CAPA linkage demonstrates that deviations lead to corrective actions.',
        type: 'radio', required: false,
        options: [
          { value: 'yes', label: 'Yes — CAPA records are linked to deviations' },
          { value: 'separate', label: 'CAPA records exist but not linked to deviations' },
          { value: 'no', label: 'No — no CAPA system or no linkage' },
        ],
        generatesClaim: 'clinical_trials.hybrid.protocol_compliance',
        feedsCapability: 'Protocol Compliance Documentation',
        affectsReadiness: 'Hybrid Trial Readiness',
      }),
    ],
  },
]

// ==========================================================================
// Summary
// ==========================================================================

export const HYBRID_TRIAL_TOTAL_QUESTIONS = HYBRID_TRIAL_INTERVIEW.reduce(
  (sum, s) => sum + s.questions.length, 0,
)

// Gate summary:
//   ht_has_hybrid_exp = no     → 7 historical questions hidden (modules 1 detail questions)
//   ht_has_home_visits = no    → 5 modules hidden (~25 questions): at-home details, vendor, bio-home gate + details, chain custody, shipping, temperature
//   ht_has_bio_home = no       → 4 modules hidden (~14 questions): collection, chain custody, shipping, temperature
//   ht_has_remote_mon = no     → 1 module hidden (~7 questions): remote monitoring details
//
// Minimum visible: ~30 questions (core + site execution + data integrity + patient access + retention + safety + compliance)
// Maximum visible: all 71 questions
