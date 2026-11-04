const AID_RECORDS_KEY = 'barangay_aid_records'
const UPDATED_EVENT = 'aid-records-updated'

export type AidRecordStatus = 'RECEIVED' | 'PENDING'

export type AidRecord = {
  id: string
  associationName: string
  memberId: string
  memberName: string
  program: string
  dateReceived: string
  quantity: string
  comments: string
  status: AidRecordStatus
  submittedBy: string
  submittedAt: string
}

function readRecords(): AidRecord[] {
  const raw = localStorage.getItem(AID_RECORDS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as AidRecord[] : []
  } catch {
    return []
  }
}

function writeRecords(records: AidRecord[]) {
  localStorage.setItem(AID_RECORDS_KEY, JSON.stringify(records))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function getAidRecords(associationName?: string): AidRecord[] {
  const records = readRecords()
  if (!associationName) return records
  const key = associationName.trim().toLowerCase()
  return records.filter((row) => row.associationName.trim().toLowerCase() === key)
}

export function submitAidRecord(input: Omit<AidRecord, 'id' | 'submittedAt' | 'status'>): AidRecord {
  const record: AidRecord = {
    ...input,
    id: crypto.randomUUID(),
    status: 'RECEIVED',
    submittedAt: new Date().toISOString(),
  }
  writeRecords([record, ...readRecords()])
  return record
}

export function subscribeAidRecords(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}
