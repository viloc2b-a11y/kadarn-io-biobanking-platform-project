// Sprint 28E — Review & Evidence Lifecycle
// Event-based review model. Claims never modified — only events.
export type ReviewEventType = 'review_requested' | 'review_approved' | 'review_rejected' | 'counter_evidence' | 'right_of_response' | 'expired' | 'republished'
export interface ReviewEvent { eventId: string; claimId: string; eventType: ReviewEventType; actor: string; justification?: string; timestamp: string }
export class ReviewLifecycleEngine {
  private events: ReviewEvent[] = []; private counter = 0
  requestReview(claimId: string, actor: string): ReviewEvent { return this.addEvent(claimId, 'review_requested', actor) }
  approve(claimId: string, actor: string, justification?: string): ReviewEvent { return this.addEvent(claimId, 'review_approved', actor, justification) }
  reject(claimId: string, actor: string, justification?: string): ReviewEvent { return this.addEvent(claimId, 'review_rejected', actor, justification) }
  addCounterEvidence(claimId: string, actor: string, justification: string): ReviewEvent { return this.addEvent(claimId, 'counter_evidence', actor, justification) }
  rightOfResponse(claimId: string, actor: string, justification: string): ReviewEvent { return this.addEvent(claimId, 'right_of_response', actor, justification) }
  getEvents(claimId: string): ReviewEvent[] { return this.events.filter(e => e.claimId === claimId) }
  getStatus(claimId: string): ReviewEventType | 'none' { const evts = this.getEvents(claimId); return evts.length > 0 ? evts[evts.length - 1].eventType : 'none' }
  private addEvent(claimId: string, eventType: ReviewEventType, actor: string, justification?: string): ReviewEvent { const e: ReviewEvent = { eventId: `rev:${++this.counter}`, claimId, eventType, actor, justification, timestamp: new Date().toISOString() }; this.events.push(e); return e }
}