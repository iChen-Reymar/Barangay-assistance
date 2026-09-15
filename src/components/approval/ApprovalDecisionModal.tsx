import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { DecisionType } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'
import { formatDecisionDate } from '../../services/decisionStorage'

interface ApprovalDecisionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (notes: string, overrideStatus?: RequestStatus) => void
  decisionType: DecisionType
  itemTitle: string
  itemSubtitle?: string
  currentStatus?: string
  allowOverrideStatus?: boolean
}

const decisionLabels: Record<DecisionType, string> = {
  approve: 'Approve',
  reject: 'Reject',
  override: 'Override Decision',
}

const decisionDescriptions: Record<DecisionType, string> = {
  approve: 'This will mark the item as approved. Add optional notes for the record.',
  reject: 'This will mark the item as rejected. Notes are required for accountability.',
  override: 'This will replace the previous decision. Notes are required explaining the override.',
}

const overrideOptions: RequestStatus[] = ['APPROVED', 'REJECTED', 'UNDER REVIEW', 'PENDING']

export function ApprovalDecisionModal({
  open,
  onClose,
  onSubmit,
  decisionType,
  itemTitle,
  itemSubtitle,
  currentStatus,
  allowOverrideStatus = false,
}: ApprovalDecisionModalProps) {
  const [notes, setNotes] = useState('')
  const [overrideStatus, setOverrideStatus] = useState<RequestStatus>('APPROVED')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNotes('')
    setOverrideStatus('APPROVED')
    setError('')
  }, [open, decisionType])

  const notesRequired = decisionType === 'reject' || decisionType === 'override'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (notesRequired && !notes.trim()) {
      setError('Notes are required for this decision.')
      return
    }
    onSubmit(notes.trim(), decisionType === 'override' ? overrideStatus : undefined)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${decisionLabels[decisionType]} — ${itemTitle}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
          {itemSubtitle && <p className="font-medium text-gray-900">{itemSubtitle}</p>}
          {currentStatus && (
            <p className="mt-1 text-gray-600">
              Current status: <span className="font-semibold">{currentStatus}</span>
            </p>
          )}
          <p className="mt-2 text-gray-500">{decisionDescriptions[decisionType]}</p>
          <p className="mt-2 text-xs text-gray-400">
            Timestamp: {formatDecisionDate(new Date().toISOString())}
          </p>
        </div>

        {decisionType === 'override' && allowOverrideStatus && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              New Status
            </label>
            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value as RequestStatus)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {overrideOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Decision Notes {notesRequired ? '(Required)' : '(Optional)'}
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              decisionType === 'approve'
                ? 'e.g. Verified documents and eligibility criteria met.'
                : 'Explain the reason for this decision...'
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decisionType === 'reject' ? 'danger' : 'primary'}
            className="w-full sm:w-auto"
          >
            Confirm {decisionLabels[decisionType]}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
