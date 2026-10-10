import { type RequestStatus } from '../data/mockData'
import { enrichReviewableItem } from '../data/requestDetailsSeed'
import type {
  DecisionInput,
  DecisionRecord,
  DocumentStatus,
  QualificationStatus,
  ReviewableAssistanceItem,
} from '../types/approval'

const ITEMS_KEY = 'barangay_reviewable_items'
const UPDATED_EVENT = 'decision-storage-updated'

function readItems(): ReviewableAssistanceItem[] {
  const raw = localStorage.getItem(ITEMS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ReviewableAssistanceItem[]
  } catch {
    return []
  }
}

function writeItems(items: ReviewableAssistanceItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function initializeDecisionStorage() {}

export function formatDecisionDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getReviewableItems(): ReviewableAssistanceItem[] {
  initializeDecisionStorage()
  return readItems().map((item) => enrichReviewableItem(item))
}

export function getAssistanceItems(): ReviewableAssistanceItem[] {
  return getReviewableItems().filter((item) => item.source === 'assistance')
}

export function getAssociationAssistanceItems(associationName: string): ReviewableAssistanceItem[] {
  const name = associationName.trim().toLowerCase()
  return getAssistanceItems().filter((item) => item.association.trim().toLowerCase() === name)
}

export function submitAssociationAssistanceRequest(input: {
  association: string
  program: string
  memberCount: number
  purpose: string
  requestedAssistance: string
  supportingInfo: string
  submittedBy: string
  contactNumber?: string
  email?: string
}): ReviewableAssistanceItem {
  const now = new Date()
  initializeDecisionStorage()
  const existing = readItems()
  const usedNumbers = existing
    .map((entry) => /^asst-(\d+)$/.exec(entry.id)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number)
  const nextNumber = (usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0) + 1

  const item: ReviewableAssistanceItem = {
    id: `asst-${nextNumber}`,
    source: 'assistance',
    association: input.association.trim(),
    requestType: input.program.trim(),
    program: input.program.trim(),
    vulnerability: 'MEDIUM',
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'PENDING',
    description: input.purpose.trim(),
    decisions: [],
    details: {
      submittedBy: input.submittedBy.trim(),
      contactNumber: input.contactNumber?.trim() || '—',
      email: input.email,
      address: 'Barangay Buru-un, Iligan City',
      memberCount: input.memberCount,
      purpose: input.purpose.trim(),
      requestedItems: input.requestedAssistance.trim(),
      supportingInfo: input.supportingInfo.trim() || '—',
      submittedAt: now.toISOString(),
    },
  }

  writeItems([item, ...existing])
  return enrichReviewableItem(item)
}

export function getRecommendationItems(): ReviewableAssistanceItem[] {
  return getReviewableItems().filter((item) => item.source === 'recommendation')
}

export function getItemById(id: string): ReviewableAssistanceItem | null {
  return getReviewableItems().find((item) => item.id === id) ?? null
}

function statusForDecision(input: DecisionInput, currentStatus: RequestStatus): RequestStatus {
  if (input.decision === 'approve') return 'APPROVED'
  if (input.decision === 'reject') return 'REJECTED'
  return input.overrideStatus ?? currentStatus
}

export function submitAssistanceDecision(
  itemId: string,
  input: DecisionInput,
): ReviewableAssistanceItem | null {
  const items = readItems()
  const index = items.findIndex((item) => item.id === itemId)
  if (index === -1) return null

  const current = items[index]
  const previousStatus = current.status
  const newStatus = statusForDecision(input, current.status)

  const record: DecisionRecord = {
    id: crypto.randomUUID(),
    decision: input.decision,
    notes: input.notes,
    decidedBy: input.reviewedBy,
    decidedByEmail: input.reviewedByEmail,
    decidedAt: new Date().toISOString(),
    previousStatus,
    newStatus,
  }

  items[index] = {
    ...current,
    status: newStatus,
    decisions: [record, ...current.decisions],
  }

  writeItems(items)
  return enrichReviewableItem(items[index])
}

export function verifyDocument(
  itemId: string,
  documentId: string,
  status: DocumentStatus,
  reviewer: { name: string; email?: string },
): ReviewableAssistanceItem | null {
  const items = readItems()
  const index = items.findIndex((item) => item.id === itemId)
  if (index === -1) return null

  const current = enrichReviewableItem(items[index])
  const now = new Date().toISOString()
  const documents = (current.documents ?? []).map((doc) =>
    doc.id === documentId
      ? {
          ...doc,
          status,
          verifiedBy: reviewer.name,
          verifiedAt: now,
        }
      : doc,
  )

  items[index] = { ...current, documents }
  writeItems(items)
  return enrichReviewableItem(items[index])
}

export function verifyQualification(
  itemId: string,
  checkId: string,
  status: QualificationStatus,
  reviewer: { name: string; email?: string },
  notes?: string,
): ReviewableAssistanceItem | null {
  const items = readItems()
  const index = items.findIndex((item) => item.id === itemId)
  if (index === -1) return null

  const current = enrichReviewableItem(items[index])
  const now = new Date().toISOString()
  const qualifications = (current.qualifications ?? []).map((check) =>
    check.id === checkId
      ? {
          ...check,
          status,
          verifiedBy: reviewer.name,
          verifiedAt: now,
          notes: notes ?? check.notes,
        }
      : check,
  )

  items[index] = { ...current, qualifications }
  writeItems(items)
  return enrichReviewableItem(items[index])
}

function isOlderThan(isoDate: string, days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(isoDate).getTime() < cutoff
}

export function anonymizeRejectedAssistanceRecords(retentionDays: number): number {
  const items = readItems()
  let count = 0
  const updated = items.map((item) => {
    if (item.status !== 'REJECTED') return item
    const latestDecision = item.decisions[0]
    if (!latestDecision || !isOlderThan(latestDecision.decidedAt, retentionDays)) return item
    if (item.association.startsWith('Anonymized')) return item
    count += 1
    return {
      ...item,
      association: `Anonymized Request ${item.id.slice(0, 6).toUpperCase()}`,
      details: item.details
        ? {
            ...item.details,
            submittedBy: 'Anonymized',
            contactNumber: '***-***-****',
            email: undefined,
            address: 'Redacted',
            supportingInfo: 'Redacted per data retention policy.',
          }
        : item.details,
      documents: [],
    }
  })
  if (count > 0) writeItems(updated)
  return count
}

export function purgeRejectedAssistanceOlderThan(days: number): number {
  const items = readItems()
  const kept = items.filter((item) => {
    if (item.status !== 'REJECTED') return true
    const latestDecision = item.decisions[0]
    if (!latestDecision) return true
    return !isOlderThan(latestDecision.decidedAt, days)
  })
  const removed = items.length - kept.length
  if (removed > 0) writeItems(kept)
  return removed
}

export function subscribeDecisionStorage(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ITEMS_KEY) callback()
  }
  window.addEventListener(UPDATED_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(UPDATED_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function getRecentAssistanceDecisions(limit = 10): DecisionRecord[] {
  return getReviewableItems()
    .flatMap((item) =>
      item.decisions.map((decision) => ({
        ...decision,
        itemTitle: item.association,
        itemType: item.requestType,
      })),
    )
    .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
    .slice(0, limit)
}
