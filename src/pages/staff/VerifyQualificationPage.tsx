import { useEffect, useMemo, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { MemberQualificationModal } from '../../components/staff/MemberQualificationModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useReviewActor } from '../../hooks/useReviewActor'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import type { AssociationMember } from '../../data/associationMockData'
import { getAssociationMembers, subscribeMemberStorage } from '../../services/memberStorage'
import {
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
} from '../../services/staffBeneficiaryStorage'
import {
  getAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function isOpenRequest(request: ReviewableAssistanceItem) {
  return request.status !== 'LIST GENERATED' && request.status !== 'APPROVED' && request.status !== 'REJECTED'
}

export default function StaffVerifyQualificationPage() {
  const displayUser = useStaffDisplayUser()
  const actor = useReviewActor()
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [members, setMembers] = useState<AssociationMember[]>(() => getAssociationMembers())
  const [beneficiaries, setBeneficiaries] = useState(() => getStaffBeneficiaries())
  const [selectedAssociation, setSelectedAssociation] = useState<string | null>(null)

  useEffect(() => {
    const stopItems = subscribeDecisionStorage(() => setItems(getAssistanceItems()))
    const stopMembers = subscribeMemberStorage(() => setMembers(getAssociationMembers()))
    const stopBeneficiaries = subscribeStaffBeneficiaryStorage(() => setBeneficiaries(getStaffBeneficiaries()))
    return () => {
      stopItems()
      stopMembers()
      stopBeneficiaries()
    }
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; requests: ReviewableAssistanceItem[] }>()
    const add = (name: string, request: ReviewableAssistanceItem) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const key = trimmed.toLowerCase()
      if (!map.has(key)) map.set(key, { name: trimmed, requests: [] })
      map.get(key)?.requests.push(request)
    }
    for (const item of items) {
      if (!isOpenRequest(item)) continue
      add(item.association, item)
    }
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name))
  }, [items])

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
          Associations with an active assistance request appear here. Open one to verify its members' household information.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Beneficiary / Association</th>
                <th className="px-4 py-3">Assistance</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Verified Members</th>
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
                  const memberCount = members.filter((row) =>
                    sameAssociation(row.associationName ?? '', group.name),
                  ).length
                  const verifiedCount = beneficiaries.filter((row) =>
                    sameAssociation(row.association, group.name) && row.verification === 'VERIFIED',
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
                      <td className="px-4 py-3 text-gray-600">{memberCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={verifiedCount > 0 ? 'success' : 'warning'}>
                          {`${verifiedCount}/${memberCount} verified`}
                        </Badge>
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
        reviewerName={actor.name}
      />
    </>
  )
}
