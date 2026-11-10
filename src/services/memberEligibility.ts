import type { AssociationMember, MemberAttachment } from '../data/associationMockData'

export function memberDocumentVerified(file?: MemberAttachment) {
  return Boolean(file?.dataUrl?.trim()) && file?.status === 'verified'
}

export function memberDocumentsVerified(member: AssociationMember) {
  return memberDocumentVerified(member.barangayCertificate)
    && memberDocumentVerified(member.governmentId)
}
