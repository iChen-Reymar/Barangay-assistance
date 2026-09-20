import {
  classificationFromScore,
  priorityList as seedPriorityList,
  type PriorityListEntry,
  type RequestStatus,
  type VulnerabilityLevel,
} from '../data/mockData'

const PRIORITY_KEY = 'barangay_priority_list'
const UPDATED_EVENT = 'priority-list-updated'

export type PriorityListUpdateInput = {
  association: string
  score: number
  recommended: string
  previousAid: 'None' | 'Yes'
  status: RequestStatus
  notes?: string
}

function readEntries(): PriorityListEntry[] {
  const raw = localStorage.getItem(PRIORITY_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as PriorityListEntry[]
  } catch {
    return []
  }
}

function writeEntries(entries: PriorityListEntry[]) {
  localStorage.setItem(PRIORITY_KEY, JSON.stringify(entries))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

function withRanks(entries: PriorityListEntry[]): PriorityListEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function initializePriorityStorage() {
  if (!localStorage.getItem(PRIORITY_KEY)) {
    writeEntries(seedPriorityList)
  }
}

export function getPriorityList(): PriorityListEntry[] {
  initializePriorityStorage()
  return withRanks(readEntries())
}

export function getPriorityEntryById(id: string): PriorityListEntry | null {
  return getPriorityList().find((entry) => entry.id === id) ?? null
}

export function updatePriorityEntry(
  id: string,
  input: PriorityListUpdateInput,
): PriorityListEntry | null {
  const entries = readEntries()
  const index = entries.findIndex((entry) => entry.id === id)
  if (index === -1) return null

  const score = Math.min(100, Math.max(0, Math.round(input.score)))
  const classification: VulnerabilityLevel = classificationFromScore(score)

  const updated: PriorityListEntry = {
    ...entries[index],
    association: input.association.trim(),
    score,
    classification,
    recommended: input.recommended.trim(),
    previousAid: input.previousAid,
    status: input.status,
    notes: input.notes?.trim() || undefined,
  }

  const next = [...entries]
  next[index] = updated
  writeEntries(withRanks(next))
  return getPriorityEntryById(id)
}

export function subscribePriorityStorage(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}
