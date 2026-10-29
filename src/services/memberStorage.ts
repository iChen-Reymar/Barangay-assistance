import {
  type AssociationDetails,
  type AssociationMember,
} from '../data/associationMockData'
import { notifyDocumentRejected } from './associationNotificationStorage'
import { ensureAssociationFromUser } from './associationStorage'

const MEMBERS_KEY = 'barangay_association_members'
const DETAILS_KEY = 'barangay_association_details'
const UPDATED_EVENT = 'member-storage-updated'

function readMembers(): AssociationMember[] {
  const raw = localStorage.getItem(MEMBERS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AssociationMember[]
  } catch {
    return []
  }
}

function writeMembers(members: AssociationMember[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

function readDetails(): AssociationDetails | null {
  const raw = localStorage.getItem(DETAILS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AssociationDetails
  } catch {
    return null
  }
}

function writeDetails(details: AssociationDetails) {
  localStorage.setItem(DETAILS_KEY, JSON.stringify(details))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

const blankAssociationDetails: AssociationDetails = {
  id: '',
  name: '',
  type: 'Agricultural',
  registrationNumber: '',
  dateRegistered: '',
  address: '',
  contactPerson: '',
  contactNumber: '',
  email: '',
  totalMembers: 0,
  description: '',
  status: 'ACTIVE',
}

export function initializeMemberStorage() {}

export function getAssociationMembers(associationName?: string): AssociationMember[] {
  initializeMemberStorage()
  const members = readMembers()
  if (!associationName) return members
  const key = associationName.trim().toLowerCase()
  return members.filter((row) => (row.associationName ?? '').trim().toLowerCase() === key)
}

export function getAssociationMemberById(id: string): AssociationMember | null {
  return getAssociationMembers().find((member) => member.id === id) ?? null
}

export function removeAssociationMember(id: string) {
  writeMembers(readMembers().filter((member) => member.id !== id))
}

export function verifyMemberAttachment(
  memberId: string,
  kind: 'barangayCertificate' | 'governmentId',
  status: 'verified' | 'rejected',
  reviewerName: string,
  associationName?: string,
  reason?: string,
) {
  const members = readMembers()
  const index = members.findIndex((member) => member.id === memberId)
  if (index === -1) return null
  const attachment = members[index][kind]
  if (!attachment) return null
  const next = [...members]
  next[index] = {
    ...members[index],
    [kind]: {
      ...attachment,
      status,
      verifiedBy: reviewerName,
      verifiedAt: new Date().toISOString(),
      rejectionReason: status === 'rejected' ? reason?.trim() || undefined : undefined,
    },
  }
  writeMembers(next)
  if (status === 'rejected') {
    const documentName =
      kind === 'barangayCertificate' ? 'Barangay Certificate of Residency' : 'Valid Government ID'
    notifyDocumentRejected({
      associationName: associationName || members[index].associationName || '',
      documentName,
      memberName: members[index].name,
      rejectedBy: reviewerName,
      reason,
    })
  }
  return next[index]
}

export function upsertAssociationMember(member: AssociationMember) {
  const members = readMembers()
  const index = members.findIndex((row) => row.id === member.id)
  if (index === -1) {
    writeMembers([member, ...members])
    return member
  }
  const next = [...members]
  next[index] = member
  writeMembers(next)
  return member
}

export function getAssociationDetails(): AssociationDetails {
  initializeMemberStorage()
  return readDetails() ?? blankAssociationDetails
}

export function saveAssociationDetails(details: AssociationDetails) {
  writeDetails(details)
  return details
}

export function subscribeMemberStorage(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}

export function syncAssociationFromApprovedUser(user: {
  id: string
  fullName: string
  email: string
  contactNumber: string
  associationName?: string
  associationType?: string
  associationAddress?: string
  registrationNumber?: string
}) {
  if (!user.associationName) return

  ensureAssociationFromUser(user)

  const existing = readDetails()
  if (existing && existing.name.trim().toLowerCase() !== user.associationName.trim().toLowerCase()) {
    return
  }

  saveAssociationDetails({
    id: existing?.id ?? user.id,
    name: user.associationName,
    type: (user.associationType as AssociationDetails['type']) ?? 'Agricultural',
    registrationNumber: user.registrationNumber ?? existing?.registrationNumber ?? 'Pending',
    dateRegistered:
      existing?.dateRegistered ??
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    address: user.associationAddress ?? existing?.address ?? '',
    contactPerson: user.fullName,
    contactNumber: user.contactNumber,
    email: user.email,
    totalMembers: existing?.totalMembers ?? 1,
    description:
      existing?.description ??
      'Registered association profile synced from approved Association Head account.',
    status: 'ACTIVE',
  })
}
