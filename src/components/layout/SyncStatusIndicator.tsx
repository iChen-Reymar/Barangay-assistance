import { AlertTriangle, Check, LoaderCircle, RefreshCw } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getSyncSnapshot, retrySynchronization, subscribeSyncStatus } from '../../services/syncStatus'

export function SyncStatusIndicator() {
  const state = useSyncExternalStore(subscribeSyncStatus, getSyncSnapshot, getSyncSnapshot)
  if (state.phase === 'idle') return null

  if (state.phase === 'failed') {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg" role="alert">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">Some changes are not synchronized.</span>
        <button type="button" onClick={() => void retrySynchronization()} className="flex items-center gap-1 font-semibold hover:underline">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium shadow-lg ${state.phase === 'saved' ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-600'}`} role="status">
      {state.phase === 'saved' ? <Check className="h-4 w-4" /> : <LoaderCircle className="h-4 w-4 animate-spin" />}
      {state.phase === 'saved' ? 'All changes saved' : `Saving ${state.pending || 1} change${state.pending === 1 ? '' : 's'}...`}
    </div>
  )
}
