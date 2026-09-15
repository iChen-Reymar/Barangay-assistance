import {
  associationDetailsSeed,
  seedAssociationMembers,
  type AssociationDetails,
  type AssociationMember,
} from '../data/associationMockData'

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

export function initializeMemberStorage() {
  if (!localStorage.getItem(MEMBERS_KEY)) {
    writeMembers(seedAssociationMembers)
  }
  if (!localStorage.getItem(DETAILS_KEY)) {
    writeDetails(associationDetailsSeed)
  }
}

export function getAssociationMembers(): AssociationMember[] {
  initializeMemberStorage()
  return readMembers()
}

export function getAssociationMemberById(id: string): AssociationMember | null {
  return getAssociationMembers().find((member) => member.id === id) ?? null
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
  return readDetails() ?? associationDetailsSeed
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

  const existing = readDetails()
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
