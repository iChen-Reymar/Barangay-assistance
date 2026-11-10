import { useEffect, useMemo, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { MemberQualificationModal } from '../../components/staff/MemberQualificationModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useReviewActor } from '../../hooks/useReviewActor'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import type { AssociationMember } from '../../data/associationMockData'
import type { StaffBeneficiary } from '../../data/staffMockData'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { getAssociationMembers, subscribeMemberStorage, verifyMemberAttachment } from '../../services/memberStorage'
import {
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
} from '../../services/staffBeneficiaryStorage'
import {
  getAssistanceItems,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function isOpenRequest(request: ReviewableAssistanceItem) {
  return request.status !== 'LIST GENERATED' && request.status !== 'APPROVED' && request.status !== 'REJECTED'
}

function qualificationSummary(requests: ReviewableAssistanceItem[]) {
  const checks = requests.flatMap((item) => item.qualifications ?? [])
  const passed = checks.filter((check) => check.status === 'passed').length
  return { passed, pending: checks.filter((check) => check.status === 'pending').length, total: checks.length }
}

export default function StaffVerifyQualificationPage() {
  const displayUser = useStaffDisplayUser()
  const actor = useReviewActor()
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [members, setMembers] = useState<AssociationMember[]>(() => getAssociationMembers())
  const [beneficiaries, setBeneficiaries] = useState<StaffBeneficiary[]>(() => getStaffBeneficiaries())
  const [associationNames, setAssociationNames] = useState<string[]>(() =>
    getAssociations().map((association) => association.name),
  )
  const [selectedAssociation, setSelectedAssociation] = useState<string | null>(null)

  useEffect(() => {
    const stopItems = subscribeDecisionStorage(() => setItems(getAssistanceItems()))
    const stopMembers = subscribeMemberStorage(() => setMembers(getAssociationMembers()))
    const stopBeneficiaries = subscribeStaffBeneficiaryStorage(() => setBeneficiaries(getStaffBeneficiaries()))
    const stopAssociations = subscribeAssociationStorage(() =>
      setAssociationNames(getAssociations().map((association) => association.name)),
    )
    return () => {
      stopItems()
      stopMembers()
      stopBeneficiaries()
      stopAssociations()
    }
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; requests: ReviewableAssistanceItem[] }>()
    const add = (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const key = trimmed.toLowerCase()
      if (!map.has(key)) map.set(key, { name: trimmed, requests: [] })
    }
    for (const name of associationNames) add(name)
    for (const member of members) add(member.associationName ?? '')
    for (const item of items) {
      if (!isOpenRequest(item)) continue
      add(item.association)
      map.get(item.association.trim().toLowerCase())?.requests.push(item)
    }
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name))
  }, [associationNames, members, items])

  const associationRequests = selectedAssociation
    ? items.filter((item) => isOpenRequest(item) && sameAssociation(item.association, selectedAssociation))
    : []

  function handleVerifyDocument(
    itemId: string,
    documentId: string,
    status: DocumentStatus,
    documentName?: string,
    memberName?: string,
    reason?: string,
  ) {
    const memberDocument = documentId.match(/^member:(.+):(certificate|id)$/)
    if (memberDocument && (status === 'verified' || status === 'rejected')) {
      verifyMemberAttachment(
        memberDocument[1],
        memberDocument[2] === 'certificate' ? 'barangayCertificate' : 'governmentId',
        status,
        actor.name,
        selectedAssociation ?? undefined,
        reason,
      )
      return
    }
    verifyDocument(
      itemId,
      documentId,
      status,
      { name: actor.name, email: actor.email },
      documentName,
      memberName,
      selectedAssociation ?? undefined,
      reason,
    )
    setItems(getAssistanceItems())
  }

  function handleVerifyQualification(itemId: string, checkId: string, status: QualificationStatus, notes?: string) {
    verifyQualification(itemId, checkId, status, { name: actor.name, email: actor.email }, notes)
    setItems(getAssistanceItems())
  }

  return (
    <>
      <DashboardNavbar
        title="Verify Qualification"
        searchPlaceholder="Search beneficiaries and requests..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <p className="mb-4 text-sm text-gray-500">
          Choose an association to see its members, then open a member to review details, documents, and qualification.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Beneficiary / Association</th>
                <th className="px-4 py-3">Assistance</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Qualifications</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No associations are recorded yet.
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const summary = qualificationSummary(group.requests)
                  const memberCount = members.filter((row) =>
                    sameAssociation(row.associationName ?? '', group.name),
                  ).length
                  const beneficiaryCount = beneficiaries.filter((row) =>
                    sameAssociation(row.association, group.name),
                  ).length
                  return (
                    <tr key={group.name} className="border-b border-gray-50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAssociation(group.name)}
                          className="text-left font-medium text-gray-900 hover:text-primary hover:underline"
                        >
                          {group.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {group.requests.length > 0
                          ? [...new Set(group.requests.map((request) => request.requestType))].join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{memberCount > 0 ? memberCount : beneficiaryCount}</td>
                      <td className="px-4 py-3">
                        {summary.total === 0 ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <Badge variant={summary.pending > 0 ? 'warning' : 'success'}>
                            {`${summary.passed}/${summary.total} passed`}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelectedAssociation(group.name)}>
                          View Members
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <MemberQualificationModal
        open={selectedAssociation !== null}
        onClose={() => setSelectedAssociation(null)}
        association={selectedAssociation}
        requests={associationRequests}
        onVerifyDocument={handleVerifyDocument}
        onVerifyQualification={handleVerifyQualification}
        reviewerName={actor.name}
      />
    </>
  )
}
