import type { AssociationMember } from '../data/associationMockData'
import type { StaffBeneficiary } from '../data/staffMockData'

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

export function completeStaffAssessment(beneficiary: StaffBeneficiary) {
  return beneficiary.verification === 'VERIFIED'
    && beneficiary.familySize > 0
    && beneficiary.monthlyIncome > 0
    && beneficiary.workingHouseholdMembers !== undefined
    && beneficiary.workingHouseholdMembers >= 0
    && beneficiary.workingHouseholdMembers <= beneficiary.familySize
    && (beneficiary.age ?? 0) > 0
    && Boolean(beneficiary.employmentStatus?.trim())
    && Boolean(beneficiary.housingCondition?.trim())
}

export function findCompleteStaffAssessment(
  assessments: StaffBeneficiary[],
  member: AssociationMember,
) {
  return assessments.find((beneficiary) =>
    beneficiary.memberId === member.id
      && sameAssociation(beneficiary.association, member.associationName ?? '')
      && completeStaffAssessment(beneficiary),
  )
}

export function verifiedMembersForAssistance(
  members: AssociationMember[],
  assessments: StaffBeneficiary[],
  associationName: string,
) {
  return members.filter((member) => {
    const belongsTo = member.associationName?.trim() ?? ''
    if (!member.name.trim() || !belongsTo) return false
    if (associationName !== 'All Associations' && !sameAssociation(belongsTo, associationName)) return false
    return Boolean(findCompleteStaffAssessment(assessments, member))
  })
}

export function generatedRowsForVerifiedMembers<T extends { beneficiaryId: string; requestId?: string }>(
  rows: T[],
  requestId: string,
  verifiedMemberIds: Set<string>,
) {
  if (!requestId) return []
  return rows.filter((row) => row.requestId === requestId && verifiedMemberIds.has(row.beneficiaryId))
}
