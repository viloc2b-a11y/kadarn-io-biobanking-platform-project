import type { PlatformEvent } from '@kadarn/types/events/platform-events'
import { getLogger } from './logger.js'

type EventListener = (event: PlatformEvent) => void

const listeners: EventListener[] = []

export function onPlatformEvent(listener: EventListener): () => void {
  listeners.push(listener)
  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

export function emitPlatformEvent(event: PlatformEvent): void {
  getLogger().info(`platform.event.${event.type}`, {
    correlationId: event.correlationId,
    requestId: event.requestId,
    source: event.source,
  })
  for (const listener of listeners) {
    try { listener(event) } catch { /* non-blocking */ }
  }
}
