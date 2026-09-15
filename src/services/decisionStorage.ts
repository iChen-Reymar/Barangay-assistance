import {
  assistanceRequests,
  pendingRecommendations,
  type RequestStatus,
  type VulnerabilityLevel,
} from '../data/mockData'
import { staffAssistanceRequests } from '../data/staffMockData'
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

function seedItems(): ReviewableAssistanceItem[] {
  const assistance: ReviewableAssistanceItem[] = assistanceRequests.map((row, index) =>
    enrichReviewableItem({
      id: `asst-${index + 1}`,
      source: 'assistance',
      association: row.association,
      requestType: row.requestType,
      vulnerability: row.vulnerability,
      date: row.date,
      status: row.status,
      decisions: [],
    }),
  )

  const recommendations: ReviewableAssistanceItem[] = pendingRecommendations.map((row, index) =>
    enrichReviewableItem({
      id: `rec-${index + 1}`,
      source: 'recommendation',
      association: row.name,
      requestType: row.program,
      vulnerability: row.level,
      date: row.date.replace('Submitted ', ''),
      status: 'PENDING' as RequestStatus,
      score: row.score,
      program: row.program,
      description: row.description,
      previousAssistance: row.previousAssistance,
      decisions: [],
    }),
  )

  const staffAssistance: ReviewableAssistanceItem[] = staffAssistanceRequests.map((row) =>
    enrichReviewableItem({
      id: row.id,
      source: 'assistance',
      association: row.association,
      requestType: row.program,
      vulnerability: (row.priority >= 80 ? 'HIGH' : row.priority >= 60 ? 'MEDIUM' : 'LOW') as VulnerabilityLevel,
      date: row.date,
      status: row.status,
      score: row.priority,
      decisions: [],
    }),
  )

  return [...assistance, ...staffAssistance, ...recommendations]
}

export function initializeDecisionStorage() {
  if (!localStorage.getItem(ITEMS_KEY)) {
    writeItems(seedItems())
  }
}

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

export function subscribeDecisionStorage(callback: () => void) {
  window.addEventListener(UPDATED_EVENT, callback)
  return () => window.removeEventListener(UPDATED_EVENT, callback)
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
