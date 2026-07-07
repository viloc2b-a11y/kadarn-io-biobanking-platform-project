// ==========================================================================
// Platform event taxonomy — AF-4.0 Sprint 1
// ==========================================================================

export type PlatformEventType =
  | 'RequestReceived'
  | 'RequestCompleted'
  | 'ErrorRecorded'
  | 'HealthCheckFailed'
  | 'MetricRecorded'

export interface PlatformEventBase {
  type: PlatformEventType
  timestamp: string
  correlationId: string
  requestId: string
  traceId?: string
  source: string
}

export interface RequestReceivedEvent extends PlatformEventBase {
  type: 'RequestReceived'
  method: string
  route: string
}

export interface RequestCompletedEvent extends PlatformEventBase {
  type: 'RequestCompleted'
  method: string
  route: string
  status: number
  durationMs: number
}

export interface ErrorRecordedEvent extends PlatformEventBase {
  type: 'ErrorRecorded'
  errorCode: string
  message: string
}

export type PlatformEvent =
  | RequestReceivedEvent
  | RequestCompletedEvent
  | ErrorRecordedEvent
