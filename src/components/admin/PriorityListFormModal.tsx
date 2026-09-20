import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { classificationFromScore, type PriorityListEntry, type RequestStatus } from '../../data/mockData'
import { getActiveProgramNames } from '../../services/programStorage'
import type { PriorityListUpdateInput } from '../../services/priorityStorage'

interface PriorityListFormModalProps {
  open: boolean
  onClose: () => void
  entry: PriorityListEntry | null
  onSave: (id: string, input: PriorityListUpdateInput) => void
}

const statusOptions: RequestStatus[] = ['PENDING', 'UNDER REVIEW', 'APPROVED', 'REJECTED']

export function PriorityListFormModal({ open, onClose, entry, onSave }: PriorityListFormModalProps) {
  const programOptions = useMemo(() => {
    const active = getActiveProgramNames()
    if (entry && !active.includes(entry.recommended)) {
      return [entry.recommended, ...active]
    }
    return active.length > 0 ? active : ['Food Assistance', 'Medical Assistance', 'Livelihood Training']
  }, [entry, open])

  const [association, setAssociation] = useState('')
  const [score, setScore] = useState(0)
  const [recommended, setRecommended] = useState('')
  const [previousAid, setPreviousAid] = useState<'None' | 'Yes'>('None')
  const [status, setStatus] = useState<RequestStatus>('PENDING')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !entry) return
    setAssociation(entry.association)
    setScore(entry.score)
    setRecommended(entry.recommended)
    setPreviousAid(entry.previousAid)
    setStatus(entry.status)
    setNotes(entry.notes ?? '')
    setError('')
  }, [open, entry])

  const previewClassification = classificationFromScore(score)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!entry) return
    if (!association.trim()) {
      setError('Association name is required.')
      return
    }
    if (!recommended.trim()) {
      setError('Recommended assistance is required.')
      return
    }
    onSave(entry.id, {
      association,
      score,
      recommended,
      previousAid,
      status,
      notes,
    })
    onClose()
  }

  if (!entry) return null

  return (
    <Modal open={open} onClose={onClose} title="Edit Priority Entry" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Rank</label>
            <input
              type="text"
              value={`#${entry.rank}`}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Classification (auto)
            </label>
            <input
              type="text"
              value={previewClassification}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Association
            </label>
            <input
              type="text"
              value={association}
              onChange={(e) => setAssociation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Vulnerability Score (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Recommended Assistance
            </label>
            <select
              value={recommended}
              onChange={(e) => setRecommended(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {programOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Previous Aid
            </label>
            <select
              value={previousAid}
              onChange={(e) => setPreviousAid(e.target.value as 'None' | 'Yes')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="None">None</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Reviewer Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Internal notes for this priority ranking..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}
