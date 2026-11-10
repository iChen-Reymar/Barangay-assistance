export type SyncPhase = 'idle' | 'syncing' | 'saved' | 'failed'

export interface SyncSnapshot {
  phase: SyncPhase
  pending: number
  error?: string
}

let snapshot: SyncSnapshot = { phase: 'idle', pending: 0 }
const listeners = new Set<() => void>()
let retryHandler: (() => Promise<void>) | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null

export function getSyncSnapshot() {
  return snapshot
}

export function subscribeSyncStatus(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishSyncStatus(next: SyncSnapshot) {
  snapshot = next
  for (const listener of listeners) listener()
  if (idleTimer) clearTimeout(idleTimer)
  if (next.phase === 'saved') {
    idleTimer = setTimeout(() => {
      snapshot = { phase: 'idle', pending: 0 }
      for (const listener of listeners) listener()
    }, 2200)
  }
}

export function registerSyncRetry(handler: () => Promise<void>) {
  retryHandler = handler
}

export async function retrySynchronization() {
  if (retryHandler) await retryHandler()
}
