import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { GeneratedAssistanceRow } from '../../services/aiProcessing'

interface PriorityHouseholdsModalProps {
  open: boolean
  onClose: () => void
  requestId: string
  program: string
  rows: GeneratedAssistanceRow[]
}

function classificationVariant(level: GeneratedAssistanceRow['classification']) {
  if (level === 'HIGH') return 'danger' as const
  if (level === 'MEDIUM') return 'warning' as const
  return 'success' as const
}

export function PriorityHouseholdsModal({
  open,
  onClose,
  requestId,
  program,
  rows,
}: PriorityHouseholdsModalProps) {
  const prioritized = [...rows].sort((left, right) => left.rank - right.rank || right.score - left.score)

  return (
    <Modal open={open} onClose={onClose} title="Priority Household Members" size="xl">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="break-all text-xs font-semibold uppercase text-gray-400">{requestId}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-green-800">{program}</p>
            <Badge variant="success">
              {`${prioritized.length} ${prioritized.length === 1 ? 'household' : 'households'}`}
            </Badge>
          </div>
        </div>

        {prioritized.length === 0 ? (
          <p className="rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            No request-linked priority households were found for this generated list.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Household Member</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Program</th>
                </tr>
              </thead>
              <tbody>
                {prioritized.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-bold text-gray-900">#{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{row.score}/100</td>
                    <td className="px-4 py-3"><Badge variant={classificationVariant(row.classification)}>{row.classification}</Badge></td>
                    <td className="px-4 py-3 text-gray-700">{row.program}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
