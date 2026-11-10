import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SupportingDocumentViewModal } from '../approval/SupportingDocumentViewModal'
import { formatDate } from '../../services/authStorage'
import { formatDecisionDate } from '../../services/decisionStorage'
import { getAssociationMembers, subscribeMemberStorage, verifyMemberRecord } from '../../services/memberStorage'
import {
  addStaffBeneficiary,
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
  updateStaffBeneficiary,
  verifyStaffBeneficiary,
} from '../../services/staffBeneficiaryStorage'
import {
  buildDocumentPreview,
  downloadSupportingDocument,
  type DocumentPreview,
} from '../../services/supportingDocumentService'
import { downloadRequestDocument, resolveRequestDocumentUrl } from '../../services/documentStorage'
import type { AssociationMember } from '../../data/associationMockData'
import type { StaffBeneficiary } from '../../data/staffMockData'
import type {
  DocumentStatus,
  QualificationCheck,
  QualificationStatus,
  ReviewableAssistanceItem,
  SupportingDocument,
} from '../../types/approval'

interface MemberQualificationModalProps {
  open: boolean
  onClose: () => void
  association: string | null
  requests: ReviewableAssistanceItem[]
  onVerifyDocument: (
    itemId: string,
    documentId: string,
    status: DocumentStatus,
    documentName?: string,
    memberName?: string,
    reason?: string,
  ) => void
  onVerifyQualification: (
    itemId: string,
    checkId: string,
    status: QualificationStatus,
    notes?: string,
  ) => void
  reviewerName: string
}

type ReviewPerson =
  | { kind: 'member'; id: string; member: AssociationMember }
  | { kind: 'beneficiary'; id: string; beneficiary: StaffBeneficiary }

function docStatusVariant(status: DocumentStatus) {
  if (status === 'verified') return 'success' as const
  if (status === 'rejected') return 'danger' as const
  return 'warning' as const
}

function qualStatusVariant(status: QualificationStatus) {
  if (status === 'passed') return 'success' as const
  if (status === 'failed') return 'danger' as const
  if (status === 'pending') return 'warning' as const
  return 'neutral' as const
}

function qualStatusLabel(status: QualificationStatus) {
  if (status === 'passed') return 'Verified'
  if (status === 'failed') return 'Failed'
  if (status === 'pending') return 'Pending'
  return 'N/A'
}

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function personName(person: ReviewPerson) {
  return person.kind === 'member' ? person.member.name : person.beneficiary.name
}

function isMasterlistDocument(doc: SupportingDocument) {
  return /masterlist/i.test(doc.name) || doc.type.trim().toLowerCase() === 'member list'
}

function asMemberInformation(doc: SupportingDocument, person: ReviewPerson): SupportingDocument {
  if (!isMasterlistDocument(doc)) return doc
  return {
    ...doc,
    name: `${personName(person)} Information`,
    type: 'Personal Information',
  }
}

function informationLines(person: ReviewPerson, association: string) {
  if (person.kind === 'member') {
    const member = person.member
    return [
      `Name: ${member.name}`,
      `Association: ${association}`,
      `Age: ${member.age}`,
      `Contact Number: ${member.contactNumber}`,
      `Address: ${member.address}`,
      `Family Size: ${member.familySize}`,
      `Date Joined: ${member.dateJoined}`,
      `Membership: ${member.membershipStatus}`,
      `Assistance Status: ${member.assistanceStatus}`,
      `Vulnerability: ${member.vulnerabilitySource === 'ml' ? `${member.vulnerability} (${member.vulnerabilityScore ?? '—'}/100)` : 'Awaiting AI generation'}`,
      `Senior Citizen: ${member.isSenior ? 'Yes' : 'No'}`,
      `PWD: ${member.isPwd ? 'Yes' : 'No'}`,
      ...(member.notes ? [`Notes: ${member.notes}`] : []),
    ]
  }

  const beneficiary = person.beneficiary
  return [
    `Name: ${beneficiary.name}`,
    `Association: ${association}`,
    `Record ID: ${beneficiary.id}`,
    `Family Size: ${beneficiary.familySize}`,
    `Monthly Income: ₱ ${beneficiary.monthlyIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    `Vulnerability: ${beneficiary.vulnerability}`,
    `Verification: ${beneficiary.verification}`,
    ...(beneficiary.age !== undefined ? [`Age: ${beneficiary.age}`] : []),
    ...(beneficiary.contactNumber ? [`Contact Number: ${beneficiary.contactNumber}`] : []),
    ...(beneficiary.address ? [`Address: ${beneficiary.address}`] : []),
  ]
}

function downloadTextFile(filename: string, lines: string[]) {
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = window.document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

function isCertificateDocument(doc: SupportingDocument) {
  return /residency|barangay certificate/i.test(doc.name)
}

function isGovernmentIdDocument(doc: SupportingDocument) {
  return /government id/i.test(doc.name)
}

type ListedDocument = SupportingDocument & { missing?: boolean }

function memberFileDocument(
  member: AssociationMember,
  kind: 'certificate' | 'id',
): ListedDocument {
  const file = kind === 'certificate' ? member.barangayCertificate : member.governmentId
  const label = kind === 'certificate' ? 'Barangay Certificate of Residency' : 'Valid Government ID'
  const type = kind === 'certificate' ? 'Certificate' : 'Identification'
  if (!file) {
    return {
      id: `member:${member.id}:${kind}`,
      name: label,
      type,
      uploadedAt: new Date().toISOString(),
      fileSize: '—',
      status: 'uploaded',
      missing: true,
    }
  }
  return {
    id: `member:${member.id}:${kind}`,
    name: label,
    type,
    uploadedAt: file.uploadedAt,
    fileSize: file.fileSize,
    status: file.status,
    verifiedBy: file.verifiedBy,
    verifiedAt: file.verifiedAt,
    rejectionReason: file.rejectionReason,
    dataUrl: file.dataUrl,
  }
}

function documentsForPerson(request: ReviewableAssistanceItem, person: ReviewPerson): ListedDocument[] {
  return (request.documents ?? []).map((doc) => {
    if (person.kind === 'member' && isCertificateDocument(doc)) {
      return memberFileDocument(person.member, 'certificate')
    }
    if (person.kind === 'member' && isGovernmentIdDocument(doc)) {
      return memberFileDocument(person.member, 'id')
    }
    return asMemberInformation(doc, person)
  })
}

function statusRank(status: string) {
  if (status === 'rejected' || status === 'failed') return 3
  if (status === 'verified' || status === 'passed') return 2
  if (status === 'uploaded' || status === 'pending') return 1
  return 0
}

interface DocumentGroup {
  key: string
  doc: ListedDocument
  targets: { request: ReviewableAssistanceItem; documentId: string }[]
}

function mergedDocuments(requests: ReviewableAssistanceItem[], person: ReviewPerson): DocumentGroup[] {
  const groups = new Map<string, DocumentGroup>()
  for (const request of requests) {
    for (const doc of documentsForPerson(request, person)) {
      const key = doc.id.startsWith('member:') ? doc.id : doc.name.trim().toLowerCase()
      const current = groups.get(key)
      const target = { request, documentId: doc.id }
      if (!current) {
        groups.set(key, { key, doc, targets: [target] })
        continue
      }
      current.targets.push(target)
      if (
        statusRank(doc.status) > statusRank(current.doc.status) ||
        (doc.rejectionReason && !current.doc.rejectionReason)
      ) {
        current.doc = doc
      }
    }
  }
  return [...groups.values()]
}

interface QualificationGroup {
  key: string
  check: QualificationCheck
  targets: { requestId: string; checkId: string }[]
}

function mergedQualifications(requests: ReviewableAssistanceItem[]): QualificationGroup[] {
  const groups = new Map<string, QualificationGroup>()
  for (const request of requests) {
    for (const check of request.qualifications ?? []) {
      const key = check.criterion.trim().toLowerCase()
      const current = groups.get(key)
      const target = { requestId: request.id, checkId: check.id }
      if (!current) {
        groups.set(key, { key, check, targets: [target] })
        continue
      }
      current.targets.push(target)
      if (statusRank(check.status) > statusRank(current.check.status)) current.check = check
    }
  }
  return [...groups.values()]
}

export function MemberQualificationModal({
  open,
  onClose,
  association,
  requests,
  onVerifyDocument,
  onVerifyQualification,
  reviewerName,
}: MemberQualificationModalProps) {
  const [members, setMembers] = useState<AssociationMember[]>([])
  const [beneficiaries, setBeneficiaries] = useState<StaffBeneficiary[]>([])
  const [person, setPerson] = useState<ReviewPerson | null>(null)
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null)
  const [previewRequest, setPreviewRequest] = useState<ReviewableAssistanceItem | null>(null)

  useEffect(() => {
    if (!open || !association) return
    const load = () => {
      setMembers(getAssociationMembers(association))
      setBeneficiaries(
        getStaffBeneficiaries().filter((row) => sameAssociation(row.association, association)),
      )
    }
    load()
    const stopMembers = subscribeMemberStorage(load)
    const stopBeneficiaries = subscribeStaffBeneficiaryStorage(load)
    return () => {
      stopMembers()
      stopBeneficiaries()
    }
  }, [open, association])

  useEffect(() => {
    queueMicrotask(() => {
      setPerson(null)
      setDocumentPreview(null)
    })
  }, [association, open])

  useEffect(() => {
    queueMicrotask(() => {
      setPerson((current) => {
        if (!current) return current
        if (current.kind === 'member') {
          const next = members.find((member) => member.id === current.id)
          if (!next) return null
          return { kind: 'member', id: next.id, member: next }
        }
        const next = beneficiaries.find((row) => row.id === current.id)
        if (!next) return current
        return { kind: 'beneficiary', id: next.id, beneficiary: next }
      })
    })
  }, [members, beneficiaries])

  if (!association) return null

  const associationName = association
  const people: ReviewPerson[] =
    members.length > 0
      ? members.map((member) => ({ kind: 'member', id: member.id, member }))
      : beneficiaries.map((beneficiary) => ({ kind: 'beneficiary', id: beneficiary.id, beneficiary }))

  async function openDocument(request: ReviewableAssistanceItem, doc: SupportingDocument) {
    setPreviewRequest(request)
    if (doc.type === 'Personal Information' && person) {
      setDocumentPreview({
        document: doc,
        kind: 'text',
        title: doc.name,
        lines: informationLines(person, associationName),
      })
      return
    }
    if (doc.dataUrl) {
      setDocumentPreview({
        document: doc,
        kind: 'image',
        title: doc.name,
        lines: [
          `Document type: ${doc.type}`,
          `File: ${doc.name}`,
          `File size: ${doc.fileSize}`,
          `Status: ${doc.status.toUpperCase()}`,
        ],
      })
      return
    }
    if (doc.storagePath) {
      try {
        const url = await resolveRequestDocumentUrl(doc)
        const resolved = url ? { ...doc, dataUrl: url } : doc
        setDocumentPreview(buildDocumentPreview(resolved, {
          association: request.association,
          requestId: request.id,
          requestType: request.requestType,
        }))
      } catch {
        setDocumentPreview(buildDocumentPreview(doc, {
          association: request.association,
          requestId: request.id,
          requestType: request.requestType,
        }))
      }
      return
    }
    setDocumentPreview(
      buildDocumentPreview(doc, {
        association: request.association,
        requestId: request.id,
        requestType: request.requestType,
      }),
    )
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={person ? personName(person) : association} size="xl">
        {person ? (
          <PersonReview
            person={person}
            association={association}
            requests={requests}
            onBack={() => setPerson(null)}
            onVerifyDocument={onVerifyDocument}
            onVerifyQualification={onVerifyQualification}
            onViewDocument={openDocument}
            reviewerName={reviewerName}
            assessment={beneficiaries.find((row) => row.memberId === person.id || row.id === person.id)}
          />
        ) : (
          <MemberList
            association={association}
            people={people}
            usingBeneficiaries={members.length === 0 && beneficiaries.length > 0}
            onSelect={setPerson}
          />
        )}
      </Modal>

      <SupportingDocumentViewModal
        open={documentPreview !== null}
        onClose={() => setDocumentPreview(null)}
        preview={documentPreview}
        onDownload={() => {
          if (!documentPreview || !previewRequest) return
          if (documentPreview.document.type === 'Personal Information' && person) {
            downloadTextFile(
              `${personName(person)} Information.txt`,
              informationLines(person, associationName),
            )
            return
          }
          if (documentPreview.document.dataUrl) {
            downloadDataUrl(documentPreview.document.dataUrl, documentPreview.document.name)
            return
          }
          if (documentPreview.document.storagePath) {
            void downloadRequestDocument(documentPreview.document)
            return
          }
          downloadSupportingDocument(documentPreview.document, {
            association: previewRequest.association,
            requestId: previewRequest.id,
            requestType: previewRequest.requestType,
          })
        }}
      />
    </>
  )
}

function MemberList({
  association,
  people,
  usingBeneficiaries,
  onSelect,
}: {
  association: string
  people: ReviewPerson[]
  usingBeneficiaries: boolean
  onSelect: (person: ReviewPerson) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {usingBeneficiaries
          ? `No association member records are on file. These beneficiaries are linked to ${association}.`
          : `Select a member to review their details, documents, and qualification.`}
      </p>
      {people.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          No members are linked to this association yet.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
          {people.map((person) => {
            const level = person.kind === 'member' ? person.member.vulnerability : person.beneficiary.vulnerability
            const assessed = person.kind === 'member'
              ? person.member.vulnerabilitySource === 'ml'
              : person.beneficiary.vulnerabilitySource === 'ml'
            return (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => onSelect(person)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span>
                    <span className="block font-medium text-gray-900">{personName(person)}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {person.kind === 'member'
                        ? `${person.member.membershipStatus} · ${person.member.assistanceStatus}${person.member.staffVerified ? ' · VERIFIED' : ''}`
                        : person.beneficiary.verification}
                    </span>
                  </span>
                  {assessed ? (
                    <Badge variant={level === 'HIGH' ? 'danger' : level === 'MEDIUM' ? 'warning' : 'success'}>
                      {level}
                    </Badge>
                  ) : <Badge variant="neutral">AWAITING AI</Badge>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PersonReview({
  person,
  association,
  requests,
  onBack,
  onVerifyDocument,
  onVerifyQualification,
  onViewDocument,
  reviewerName,
  assessment,
}: {
  person: ReviewPerson
  association: string
  requests: ReviewableAssistanceItem[]
  onBack: () => void
  onVerifyDocument: (
    itemId: string,
    documentId: string,
    status: DocumentStatus,
    documentName?: string,
    memberName?: string,
    reason?: string,
  ) => void
  onVerifyQualification: (
    itemId: string,
    checkId: string,
    status: QualificationStatus,
    notes?: string,
  ) => void
  onViewDocument: (request: ReviewableAssistanceItem, doc: SupportingDocument) => void
  reviewerName: string
  assessment?: StaffBeneficiary
}) {
  const verified = person.kind === 'member'
    ? person.member.staffVerified === true && assessment?.verification === 'VERIFIED'
    : person.beneficiary.verification === 'VERIFIED'
  const verifiedBy = person.kind === 'member' ? person.member.staffVerifiedBy : undefined
  const verifiedAt = person.kind === 'member' ? person.member.staffVerifiedAt : undefined

  function markVerified() {
    if (verified) return
    if (person.kind === 'member') {
      verifyMemberRecord(person.member.id, reviewerName)
      return
    }
    verifyStaffBeneficiary(person.beneficiary.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {association} members
        </button>
        {person.kind === 'beneficiary' && verified ? (
          <Badge variant="success">VERIFIED</Badge>
        ) : person.kind === 'beneficiary' ? (
          <Button size="sm" onClick={markVerified}>
            Verified
          </Button>
        ) : null}
      </div>
      {person.kind === 'member' && verified && verifiedBy && verifiedAt ? (
        <p className="text-xs text-green-700">
          Qualification verified by {verifiedBy} on {formatDate(verifiedAt)}.
        </p>
      ) : null}
      {person.kind === 'beneficiary' && !verified ? (
        <p className="text-xs text-gray-500">
          You can mark this record verified even when some documents are not complete.
        </p>
      ) : null}

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FileText className="h-4 w-4 text-primary" />
          Details
        </h3>
        {person.kind === 'member' ? (
          <MemberDetails member={person.member} association={association} />
        ) : (
          <BeneficiaryDetails beneficiary={person.beneficiary} association={association} />
        )}
      </section>

      {person.kind === 'member' ? (
        <MemberHouseholdVerification
          key={person.member.id}
          member={person.member}
          existing={assessment}
          reviewerName={reviewerName}
        />
      ) : null}

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FileText className="h-4 w-4 text-primary" />
          Documents
        </h3>
        {requests.length === 0 ? (
          <EmptyNote>No assistance requests are linked to this association.</EmptyNote>
        ) : (
          <RequestDocuments
            requests={requests}
            person={person}
            onVerifyDocument={onVerifyDocument}
            onViewDocument={onViewDocument}
          />
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Qualification
        </h3>
        {requests.length === 0 ? (
          <EmptyNote>No qualification checks are linked to this association.</EmptyNote>
        ) : (
          <RequestQualifications requests={requests} onVerifyQualification={onVerifyQualification} />
        )}
      </section>
    </div>
  )
}

interface HouseholdVerificationForm {
  familySize: number
  monthlyIncome: number
  workingHouseholdMembers: number
  age: number
  employmentStatus: string
  housingCondition: string
}

function MemberHouseholdVerification({
  member,
  existing,
  reviewerName,
}: {
  member: AssociationMember
  existing?: StaffBeneficiary
  reviewerName: string
}) {
  const [form, setForm] = useState<HouseholdVerificationForm>(() => ({
    familySize: existing?.familySize ?? member.familySize,
    monthlyIncome: existing?.monthlyIncome ?? member.monthlyIncome ?? 0,
    workingHouseholdMembers: existing?.workingHouseholdMembers ?? member.workingHouseholdMembers ?? 0,
    age: existing?.age ?? member.age,
    employmentStatus: existing?.employmentStatus ?? member.employmentStatus ?? '',
    housingCondition: existing?.housingCondition ?? member.housingCondition ?? '',
  }))
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (form.familySize < 1) return setError('Family size must be at least 1.')
    if (form.monthlyIncome <= 0) return setError('Monthly income must be greater than zero.')
    if (form.workingHouseholdMembers < 0 || form.workingHouseholdMembers > form.familySize) {
      return setError('Working household members must be between 0 and the family size.')
    }
    if (form.age < 1) return setError('Age is required.')
    if (!form.employmentStatus.trim()) return setError('Employment status is required.')
    if (!form.housingCondition.trim()) return setError('Housing condition is required.')

    const record: StaffBeneficiary = {
      ...(existing ?? {}),
      id: existing?.id ?? crypto.randomUUID(),
      memberId: member.id,
      name: member.name.trim(),
      association: member.associationName || 'Unassigned',
      familySize: form.familySize,
      monthlyIncome: form.monthlyIncome,
      workingHouseholdMembers: form.workingHouseholdMembers,
      age: form.age,
      employmentStatus: form.employmentStatus,
      housingCondition: form.housingCondition,
      vulnerability: member.vulnerability,
      verification: 'VERIFIED',
      vulnerabilityIndicators: existing?.vulnerabilityIndicators ?? [
        ...(member.isPwd ? ['PWD Member (Person with Disability)'] : []),
        ...(member.isSenior ? ['Elderly Member (60+)'] : []),
      ],
    }
    if (existing) updateStaffBeneficiary(record)
    else addStaffBeneficiary(record)
    verifyMemberRecord(member.id, reviewerName)
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Member Qualification Data
        </h3>
        {member.staffVerified && existing?.verification === 'VERIFIED' ? <Badge variant="success">VERIFIED</Badge> : null}
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs text-gray-500">
          Complete these household fields and verify the member for ML vulnerability scoring.
        </p>
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase text-gray-500">
            Family Size
            <input type="number" min={1} required value={form.familySize || ''} onChange={(event) => setForm((current) => ({ ...current, familySize: Number(event.target.value) || 0 }))} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs font-semibold uppercase text-gray-500">
            Monthly Income
            <input type="number" min={0.01} step="0.01" required value={form.monthlyIncome || ''} onChange={(event) => setForm((current) => ({ ...current, monthlyIncome: Number(event.target.value) || 0 }))} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs font-semibold uppercase text-gray-500">
            Working Members
            <input type="number" min={0} max={form.familySize} required value={form.workingHouseholdMembers} onChange={(event) => setForm((current) => ({ ...current, workingHouseholdMembers: Number(event.target.value) || 0 }))} className={`mt-1 ${inputClass}`} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase text-gray-500">
            Age
            <input type="number" min={1} required value={form.age || ''} onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) || 0 }))} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs font-semibold uppercase text-gray-500">
            Employment
            <select required value={form.employmentStatus} onChange={(event) => setForm((current) => ({ ...current, employmentStatus: event.target.value }))} className={`mt-1 ${inputClass}`}>
              <option value="">Select status</option>
              <option>Employed</option>
              <option>Self-Employed</option>
              <option>Seasonal Worker</option>
              <option>Unemployed</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase text-gray-500">
            Housing Condition
            <select required value={form.housingCondition} onChange={(event) => setForm((current) => ({ ...current, housingCondition: event.target.value }))} className={`mt-1 ${inputClass}`}>
              <option value="">Select condition</option>
              <option>Concrete</option>
              <option>Light Materials</option>
              <option>Temporary</option>
              <option>Makeshift / Salvaged</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            <CheckCircle className="h-4 w-4" />
            {member.staffVerified && existing?.verification === 'VERIFIED' ? 'Update Verification' : 'Save & Verify Member'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function MemberDetails({ member, association }: { member: AssociationMember; association: string }) {
  return (
    <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
      <Field label="Association" value={association} />
      <Field label="Age" value={String(member.age)} />
      <Field label="Contact Number" value={member.contactNumber} />
      <Field label="Family Size" value={String(member.familySize)} />
      <Field label="Address" value={member.address} wide />
      <Field label="Date Joined" value={member.dateJoined} />
      <Field label="Membership" value={member.membershipStatus} />
      <Field label="Assistance Status" value={member.assistanceStatus} />
      <Field
        label="Vulnerability"
        value={member.vulnerabilitySource === 'ml'
          ? `${member.vulnerability} · ${member.vulnerabilityScore ?? '—'}/100`
          : 'Awaiting AI generation'}
      />
      <Field label="Senior Citizen" value={member.isSenior ? 'Yes' : 'No'} />
      <Field label="PWD" value={member.isPwd ? 'Yes' : 'No'} />
      <Field label="Verification" value={member.staffVerified ? 'VERIFIED' : 'UNVERIFIED'} />
      {member.notes ? <Field label="Notes" value={member.notes} wide /> : null}
    </dl>
  )
}

function BeneficiaryDetails({
  beneficiary,
  association,
}: {
  beneficiary: StaffBeneficiary
  association: string
}) {
  return (
    <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
      <Field label="Association" value={association} />
      <Field label="Record ID" value={beneficiary.id} />
      <Field label="Family Size" value={String(beneficiary.familySize)} />
      <Field
        label="Monthly Income"
        value={`₱ ${beneficiary.monthlyIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
      />
      <Field label="Vulnerability" value={beneficiary.vulnerability} />
      <Field label="Verification" value={beneficiary.verification} />
      {beneficiary.age !== undefined ? <Field label="Age" value={String(beneficiary.age)} /> : null}
      {beneficiary.contactNumber ? <Field label="Contact Number" value={beneficiary.contactNumber} /> : null}
      {beneficiary.address ? <Field label="Address" value={beneficiary.address} wide /> : null}
    </dl>
  )
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[10px] font-semibold uppercase text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value}</dd>
    </div>
  )
}

function EmptyNote({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">{children}</p>
  )
}

function RequestDocuments({
  requests,
  person,
  onVerifyDocument,
  onViewDocument,
}: {
  requests: ReviewableAssistanceItem[]
  person: ReviewPerson
  onVerifyDocument: (
    itemId: string,
    documentId: string,
    status: DocumentStatus,
    documentName?: string,
    memberName?: string,
    reason?: string,
  ) => void
  onViewDocument: (request: ReviewableAssistanceItem, doc: SupportingDocument) => void
}) {
  const documents = mergedDocuments(requests, person)
  const [notifiedIds, setNotifiedIds] = useState<string[]>([])
  const [rejecting, setRejecting] = useState<DocumentGroup | null>(null)

  function applyDocument(
    group: DocumentGroup,
    status: DocumentStatus,
    reason?: string,
  ) {
    const seen = new Set<string>()
    for (const target of group.targets) {
      const key = target.documentId.startsWith('member:')
        ? target.documentId
        : `${target.request.id}:${target.documentId}`
      if (seen.has(key)) continue
      seen.add(key)
      onVerifyDocument(
        target.request.id,
        target.documentId,
        status,
        group.doc.name,
        personName(person),
        reason,
      )
    }
  }

  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <EmptyNote>No supporting documents uploaded.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {documents.map((group) => {
            const doc = group.doc
            const request = group.targets[0]?.request
            return (
            <li
              key={group.key}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  {doc.missing ? (
                    <Badge variant="neutral">NOT UPLOADED</Badge>
                  ) : (
                    <Badge variant={docStatusVariant(doc.status)}>{doc.status.toUpperCase()}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {doc.missing
                    ? 'Not uploaded by the association head yet.'
                    : doc.type === 'Personal Information'
                      ? `Personal Information · ${personName(person)}`
                      : `${doc.type} · ${doc.fileSize} · Uploaded ${formatDecisionDate(doc.uploadedAt)}`}
                </p>
                {doc.verifiedBy && doc.verifiedAt && (
                  <p className={`mt-1 text-xs ${doc.status === 'rejected' ? 'text-red-600' : 'text-green-600'}`}>
                    {doc.status === 'rejected' ? 'Rejected' : 'Verified'} by {doc.verifiedBy} on {formatDate(doc.verifiedAt)}
                  </p>
                )}
                {doc.status === 'rejected' && doc.rejectionReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {doc.rejectionReason}</p>
                )}
                {notifiedIds.includes(group.key) && (
                  <p className="mt-1 text-xs text-red-600">The association head has been notified.</p>
                )}
              </div>
              {!doc.missing && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => request && onViewDocument(request, doc)}>
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!request) return
                    if (doc.type === 'Personal Information') {
                      downloadTextFile(
                        `${personName(person)} Information.txt`,
                        informationLines(person, request.association),
                      )
                      return
                    }
                    if (doc.dataUrl) {
                      downloadDataUrl(doc.dataUrl, doc.name)
                      return
                    }
                    downloadSupportingDocument(doc, {
                      association: request.association,
                      requestId: request.id,
                      requestType: request.requestType,
                    })
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                {doc.status !== 'verified' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => applyDocument(group, 'verified')}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejecting(group)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
              )}
            </li>
            )
          })}
        </ul>
      )}
      <RejectCommentModal
        open={rejecting !== null}
        memberName={personName(person)}
        documentName={rejecting?.doc.name ?? ''}
        onClose={() => setRejecting(null)}
        onDone={(reason) => {
          if (!rejecting) return
          applyDocument(rejecting, 'rejected', reason)
          setNotifiedIds((current) =>
            current.includes(rejecting.key) ? current : [...current, rejecting.key],
          )
          setRejecting(null)
        }}
      />
    </div>
  )
}

function RejectCommentModal({
  open,
  memberName,
  documentName,
  onClose,
  onDone,
}: {
  open: boolean
  memberName: string
  documentName: string
  onClose: () => void
  onDone: (reason: string) => void
}) {
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) queueMicrotask(() => setComment(''))
  }, [open, memberName, documentName])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null
  const reason = comment.trim()

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <form
        className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white shadow-xl sm:rounded-lg"
        onSubmit={(event) => {
          event.preventDefault()
          if (!reason) return
          onDone(reason)
        }}
      >
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Reject document</h2>
          <p className="mt-1 text-sm text-gray-500">
            {memberName} · {documentName}
          </p>
        </div>
        <div className="px-5 py-4">
          <label htmlFor="rejection-comment" className="mb-1.5 block text-sm font-medium text-gray-700">
            Why is this rejected?
          </label>
          <textarea
            id="rejection-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            required
            autoFocus
            placeholder="Explain what the association head needs to correct."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!reason}>
            Done
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function RequestQualifications({
  requests,
  onVerifyQualification,
}: {
  requests: ReviewableAssistanceItem[]
  onVerifyQualification: (
    itemId: string,
    checkId: string,
    status: QualificationStatus,
    notes?: string,
  ) => void
}) {
  const qualifications = mergedQualifications(requests)

  function applyCheck(group: QualificationGroup, status: QualificationStatus, notes?: string) {
    const seen = new Set<string>()
    for (const target of group.targets) {
      const key = `${target.requestId}:${target.checkId}`
      if (seen.has(key)) continue
      seen.add(key)
      onVerifyQualification(target.requestId, target.checkId, status, notes)
    }
  }

  return (
    <div className="space-y-3">
      {qualifications.length === 0 ? (
        <EmptyNote>No qualification checks configured.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {qualifications.map((group) => {
            const check = group.check
            return (
            <li key={group.key} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                  {check.status === 'passed' && <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />}
                  {check.status === 'failed' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
                  {check.status === 'pending' && <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}
                  {check.status === 'not_applicable' && (
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{check.criterion}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{check.description}</p>
                    {check.verifiedBy && check.verifiedAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        Verified by {check.verifiedBy} · {formatDecisionDate(check.verifiedAt)}
                      </p>
                    )}
                    {check.notes && <p className="mt-1 text-xs text-gray-600">{check.notes}</p>}
                  </div>
                </div>
                <Badge variant={qualStatusVariant(check.status)}>{qualStatusLabel(check.status)}</Badge>
              </div>
              {check.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <Button size="sm" onClick={() => applyCheck(group, 'passed')}>
                    Mark Verified
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyCheck(group, 'failed', 'Did not meet eligibility criteria.')}
                  >
                    Mark Failed
                  </Button>
                </div>
              )}
            </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
