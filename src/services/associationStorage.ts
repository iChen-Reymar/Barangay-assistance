import { associationDetailsSeed, type AssociationDetails } from '../data/associationMockData'
import {
  associations as seedAssociations,
  associationTypes,
  type Association,
  type AssociationStatus,
  type AssociationType,
} from '../data/mockData'
import { getAssociationHeadUsers } from './authStorage'

const ASSOCIATIONS_KEY = 'barangay_associations'
const UPDATED_EVENT = 'association-storage-updated'

function readAssociations(): Association[] {
  const raw = localStorage.getItem(ASSOCIATIONS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Association[]
  } catch {
    return []
  }
}

function writeAssociations(items: Association[]) {
  localStorage.setItem(ASSOCIATIONS_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isAssociationType(value?: string): value is AssociationType {
  return associationTypes.includes(value as AssociationType)
}

function buildSeed(): Association[] {
  const heads = getAssociationHeadUsers()
  return seedAssociations.map((association) => {
    const head = heads.find(
      (user) =>
        user.associationName?.trim().toLowerCase() === association.name.trim().toLowerCase() ||
        user.fullName.trim().toLowerCase() === association.contactPerson.trim().toLowerCase(),
    )
    const isSitoy = association.name === associationDetailsSeed.name
    return {
      ...association,
      headUserId: head?.id,
      email: head?.email ?? (isSitoy ? associationDetailsSeed.email : undefined),
      address: isSitoy ? associationDetailsSeed.address : association.address,
      description: isSitoy ? associationDetailsSeed.description : association.description,
      registrationNumber: isSitoy
        ? associationDetailsSeed.registrationNumber
        : association.registrationNumber,
    }
  })
}

export function initializeAssociationStorage() {
  if (!localStorage.getItem(ASSOCIATIONS_KEY)) {
    writeAssociations(buildSeed())
  }
}

export function getAssociations(): Association[] {
  initializeAssociationStorage()
  return readAssociations()
}

export function getActiveAssociations(): Association[] {
  return getAssociations().filter((association) => association.status === 'ACTIVE')
}

export function getAssociationById(id: string): Association | null {
  return getAssociations().find((association) => association.id === id) ?? null
}

export function getAssociationByName(name: string): Association | null {
  const target = name.trim().toLowerCase()
  return getAssociations().find((association) => association.name.trim().toLowerCase() === target) ?? null
}

export function upsertAssociation(association: Association) {
  initializeAssociationStorage()
  const items = readAssociations()
  const index = items.findIndex((row) => row.id === association.id)
  if (index === -1) {
    writeAssociations([association, ...items])
    return association
  }
  const next = [...items]
  next[index] = association
  writeAssociations(next)
  return association
}

export function updateAssociationStatus(id: string, status: AssociationStatus): Association | null {
  const current = getAssociationById(id)
  if (!current) return null
  return upsertAssociation({ ...current, status })
}

export function toAssociationDetails(association: Association): AssociationDetails {
  return {
    id: association.id,
    name: association.name,
    type: association.type,
    registrationNumber: association.registrationNumber ?? 'Pending',
    dateRegistered: association.dateRegistered,
    address: association.address ?? '',
    contactPerson: association.contactPerson,
    contactNumber: association.contactNumber,
    email: association.email ?? '',
    totalMembers: association.members,
    description: association.description ?? '',
    status: association.status,
  }
}

export function saveAssociationProfile(id: string, details: AssociationDetails): Association | null {
  const current = getAssociationById(id)
  if (!current) return null
  return upsertAssociation({
    ...current,
    type: details.type,
    members: details.totalMembers,
    contactPerson: details.contactPerson,
    contactNumber: details.contactNumber,
    email: details.email,
    address: details.address,
    description: details.description,
    registrationNumber: details.registrationNumber,
    status: details.status,
  })
}

export function ensureAssociationFromUser(user: {
  id: string
  fullName: string
  email: string
  contactNumber: string
  associationName?: string
  associationType?: string
  associationAddress?: string
  registrationNumber?: string
  approvedAt?: string
  createdAt?: string
}): Association | null {
  if (!user.associationName?.trim()) return null

  initializeAssociationStorage()
  const items = readAssociations()
  const name = user.associationName.trim()
  const index = items.findIndex((row) => row.name.trim().toLowerCase() === name.toLowerCase())
  const type = isAssociationType(user.associationType) ? user.associationType : 'Agricultural'

  if (index === -1) {
    const created: Association = {
      id: crypto.randomUUID(),
      name,
      type,
      members: 1,
      contactPerson: user.fullName,
      contactNumber: user.contactNumber,
      dateRegistered: formatDate(user.approvedAt ?? user.createdAt ?? new Date().toISOString()),
      status: 'ACTIVE',
      headUserId: user.id,
      email: user.email,
      address: user.associationAddress,
      registrationNumber: user.registrationNumber,
      description: 'Association profile created when the Association Head account was approved.',
    }
    writeAssociations([created, ...items])
    return created
  }

  const current = items[index]
  if (current.headUserId && current.headUserId !== user.id) return current

  const updated: Association = {
    ...current,
    headUserId: user.id,
    contactPerson: user.fullName,
    contactNumber: user.contactNumber,
    email: current.email || user.email,
    address: current.address || user.associationAddress,
    registrationNumber: current.registrationNumber || user.registrationNumber,
    type: current.type || type,
  }
  const next = [...items]
  next[index] = updated
  writeAssociations(next)
  return updated
}

export function subscribeAssociationStorage(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}
