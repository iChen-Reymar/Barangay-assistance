import {
  staffBeneficiaries as seedBeneficiaries,
  type StaffBeneficiary,
} from '../data/staffMockData'

const STORAGE_KEY = 'barangay_staff_beneficiaries'
const UPDATED_EVENT = 'staff-beneficiaries-updated'

function readBeneficiaries(): StaffBeneficiary[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as StaffBeneficiary[]
  } catch {
    return []
  }
}

function writeBeneficiaries(items: StaffBeneficiary[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function initializeStaffBeneficiaryStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeBeneficiaries(seedBeneficiaries)
    return
  }

  const existing = readBeneficiaries()
  const merged = [...existing]
  let changed = false
  for (const seed of seedBeneficiaries) {
    if (!merged.some((row) => row.id === seed.id)) {
      merged.push(seed)
      changed = true
    }
  }
  if (changed) {
    writeBeneficiaries(merged)
  }
}

export function getStaffBeneficiaries(): StaffBeneficiary[] {
  initializeStaffBeneficiaryStorage()
  return readBeneficiaries()
}

export function getStaffBeneficiaryById(id: string): StaffBeneficiary | null {
  return getStaffBeneficiaries().find((row) => row.id === id) ?? null
}

export function updateStaffBeneficiary(updated: StaffBeneficiary): StaffBeneficiary | null {
  const items = readBeneficiaries()
  const index = items.findIndex((row) => row.id === updated.id)
  if (index === -1) return null
  items[index] = updated
  writeBeneficiaries(items)
  return updated
}

export function verifyStaffBeneficiary(id: string): StaffBeneficiary | null {
  const existing = getStaffBeneficiaryById(id)
  if (!existing || existing.verification === 'VERIFIED') return existing

  return updateStaffBeneficiary({ ...existing, verification: 'VERIFIED' })
}

export function getPendingVerificationBeneficiaries(): StaffBeneficiary[] {
  return getStaffBeneficiaries().filter((row) => row.verification !== 'VERIFIED')
}

export function countPendingVerification(): number {
  return getPendingVerificationBeneficiaries().length
}

export function subscribeStaffBeneficiaryStorage(listener: () => void) {
  const handler = () => listener()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}
