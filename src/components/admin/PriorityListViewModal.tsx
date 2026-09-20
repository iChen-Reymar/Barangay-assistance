import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ScoreDisplay, StatusBadge, VulnerabilityBadge } from './StatusBadge'
import type { PriorityListEntry } from '../../data/mockData'

interface PriorityListViewModalProps {
  open: boolean
  onClose: () => void
  entry: PriorityListEntry | null
  onEdit: (entry: PriorityListEntry) => void
}

export function PriorityListViewModal({ open, onClose, entry, onEdit }: PriorityListViewModalProps) {
  if (!entry) return null

  return (
    <Modal open={open} onClose={onClose} title="Priority List Entry" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Rank #{entry.rank}</p>
            <h3 className="text-lg font-bold text-gray-900">{entry.association}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <VulnerabilityBadge level={entry.classification} />
            <StatusBadge status={entry.status} />
          </div>
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Vulnerability Score</dt>
            <dd className="mt-1">
              <ScoreDisplay score={entry.score} />
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Classification</dt>
            <dd className="mt-1 text-gray-900">{entry.classification}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Recommended Assistance</dt>
            <dd className="mt-1 text-gray-900">{entry.recommended}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Previous Aid</dt>
            <dd className="mt-1 text-gray-900">{entry.previousAid}</dd>
          </div>
          {entry.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Reviewer Notes</dt>
              <dd className="mt-1 text-gray-700">{entry.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onEdit(entry)
              onClose()
            }}
          >
            Edit Entry
          </Button>
        </div>
      </div>
    </Modal>
  )
}
