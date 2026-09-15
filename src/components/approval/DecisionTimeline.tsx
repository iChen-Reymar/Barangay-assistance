import { CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import type { DecisionRecord } from '../../types/approval'
import { formatDecisionDate } from '../../services/decisionStorage'

interface DecisionTimelineProps {
  decisions: DecisionRecord[]
  compact?: boolean
}

const decisionStyles: Record<
  DecisionRecord['decision'],
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  approve: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Approved' },
  reject: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' },
  override: { icon: RotateCcw, color: 'text-orange-600 bg-orange-50', label: 'Overridden' },
}

export function DecisionTimeline({ decisions, compact = false }: DecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-gray-500">No decisions recorded yet.</p>
    )
  }

  const sorted = [...decisions].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime(),
  )

  if (compact) {
    const latest = sorted[0]
    const style = decisionStyles[latest.decision]
    const Icon = style.icon
    return (
      <div className="flex items-start gap-2 text-sm">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color.split(' ')[0]}`} />
        <div>
          <p className="font-medium text-gray-900">
            {style.label} · {formatDecisionDate(latest.decidedAt)}
          </p>
          <p className="text-xs text-gray-500">By {latest.decidedBy}</p>
          {latest.notes && <p className="mt-1 text-xs text-gray-600">{latest.notes}</p>}
        </div>
      </div>
    )
  }

  return (
    <ol className="space-y-4">
      {sorted.map((record, index) => {
        const style = decisionStyles[record.decision]
        const Icon = style.icon
        return (
          <li key={record.id} className="relative flex gap-3 pl-1">
            {index < sorted.length - 1 && (
              <span className="absolute left-4 top-8 h-full w-px bg-gray-200" aria-hidden />
            )}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{style.label}</span>
                <span className="text-xs text-gray-400">{formatDecisionDate(record.decidedAt)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {record.decidedBy}
                {record.decidedByEmail ? ` · ${record.decidedByEmail}` : ''}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {record.previousStatus} → <span className="font-medium text-gray-700">{record.newStatus}</span>
              </p>
              {record.notes && (
                <p className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {record.notes}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
