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

export type AidRecordInput = Omit<AidRecord, 'id' | 'submittedAt' | 'status'>

export type AidRecordBatchResult = {
  records: AidRecord[]
  skipped: AidRecordInput[]
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

function recordIdentity(record: Pick<AidRecord, 'associationName' | 'memberId' | 'program' | 'dateReceived'>) {
  return [record.associationName, record.memberId, record.program, record.dateReceived]
    .map((value) => value.trim().toLowerCase())
    .join('|')
}

export function submitAidRecords(inputs: AidRecordInput[]): AidRecordBatchResult {
  const existing = readRecords()
  const identities = new Set(existing.map(recordIdentity))
  const submittedAt = new Date().toISOString()
  const records: AidRecord[] = []
  const skipped: AidRecordInput[] = []

  for (const input of inputs) {
    const identity = recordIdentity(input)
    if (identities.has(identity)) {
      skipped.push(input)
      continue
    }
    identities.add(identity)
    records.push({
      ...input,
      id: crypto.randomUUID(),
      status: 'RECEIVED',
      submittedAt,
    })
  }

  if (records.length > 0) writeRecords([...records, ...existing])
  return { records, skipped }
}

export function submitAidRecord(input: AidRecordInput): AidRecord {
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
