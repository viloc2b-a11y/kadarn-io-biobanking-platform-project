// ==========================================================================
// Sponsor Intelligence — Portfolio Monitoring (DERIVED alerts) (KTP-1.6)
// ==========================================================================

import type { SponsorAlert } from './dto'
import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

const ALERT_COUNTER = { count: 0 }

export function detectChanges(
  previous: ReadinessEvaluation[],
  current: ReadinessEvaluation[]
): SponsorAlert[] {
  const alerts: SponsorAlert[] = []

  const prevMap = new Map(previous.map((p) => [p.organization_id, p]))
  const currMap = new Map(current.map((c) => [c.organization_id, c]))

  // Detect new institutions
  for (const [id, currEval] of currMap) {
    if (!prevMap.has(id)) {
      alerts.push(makeAlert('new_institution', currEval, null, currEval.readiness_status, 'info'))
    }
  }

  // Detect changes in existing institutions
  for (const [id, prevEval] of prevMap) {
    const currEval = currMap.get(id)
    if (!currEval) continue // institution removed — not an alert case for now

    // Readiness increased
    const statusOrder = ['not_ready', 'partial', 'conditionally_ready', 'ready']
    const prevIdx = statusOrder.indexOf(prevEval.readiness_status)
    const currIdx = statusOrder.indexOf(currEval.readiness_status)

    if (currIdx > prevIdx) {
      alerts.push(makeAlert('readiness_increased', currEval, prevEval.readiness_status, currEval.readiness_status, 'info'))
    } else if (currIdx < prevIdx) {
      alerts.push(makeAlert('readiness_declined', currEval, prevEval.readiness_status, currEval.readiness_status, 'critical'))
    }

    // Capability lost: check if any capability went from supported to needs_evidence
    const prevCaps = prevEval.evaluation_snapshot?.capabilities ?? []
    const currCaps = currEval.evaluation_snapshot?.capabilities ?? []

    for (const prevCap of prevCaps) {
      const currCap = currCaps.find((c: any) => c.name === prevCap.name)
      if (currCap && prevCap.status === 'supported' && (currCap.status === 'needs_more_evidence' || currCap.status === 'not_detected')) {
        alerts.push(makeAlert('capability_lost', currEval, prevCap.name, currCap.name || prevCap.name, 'warning'))
      }
    }
  }

  return alerts
}

function makeAlert(
  alertType: SponsorAlert['alertType'],
  evaluation: ReadinessEvaluation,
  previousValue: string | null,
  newValue: string,
  severity: SponsorAlert['severity']
): SponsorAlert {
  ALERT_COUNTER.count++

  const messages: Record<SponsorAlert['alertType'], string> = {
    readiness_increased: `${evaluation.organization_name ?? evaluation.organization_id}: readiness improved from ${previousValue} to ${newValue}`,
    readiness_declined: `${evaluation.organization_name ?? evaluation.organization_id}: readiness declined from ${previousValue} to ${newValue}`,
    capability_lost: `${evaluation.organization_name ?? evaluation.organization_id}: lost capability '${newValue}'`,
    evidence_expired: `${evaluation.organization_name ?? evaluation.organization_id}: evidence has expired for program`,
    new_institution: `${evaluation.organization_name ?? evaluation.organization_id}: new institution added to portfolio`,
  }

  return {
    alertId: `alert-${String(ALERT_COUNTER.count).padStart(4, '0')}`,
    alertType,
    institutionId: evaluation.organization_id,
    institutionName: evaluation.organization_name ?? evaluation.organization_id,
    programTypeKey: evaluation.program_type_key ?? 'institutional',
    message: messages[alertType],
    severity,
    triggeredAt: new Date().toISOString(),
    previousValue,
    newValue,
  }
}
