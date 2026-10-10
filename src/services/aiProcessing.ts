import type { VulnerabilityLevel } from '../data/staffMockData'
import { getStaffBeneficiaries } from './staffBeneficiaryStorage'

const LIST_KEY = 'barangay_generated_assistance_list'
const UPDATED_EVENT = 'ai-list-generated'

export interface GeneratedAssistanceRow {
  rank: number
  name: string
  association: string
  score: number
  classification: VulnerabilityLevel
  program: string
  verification: 'VERIFIED'
  reason: string
  generatedAt: string
}

function matchProgram(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'Food Assistance & Rice Subsidy'
  if (level === 'MEDIUM') return 'Livelihood Training'
  return 'Skills Training'
}

function scoreFor(income: number, familySize: number, level: VulnerabilityLevel) {
  let score = level === 'HIGH' ? 70 : level === 'MEDIUM' ? 50 : 30
  if (income < 5000) score += 20
  else if (income < 8000) score += 10
  score += Math.min(10, Math.max(0, familySize))
  return Math.min(100, score)
}

export function getGeneratedAssistanceList(): GeneratedAssistanceRow[] {
  const raw = localStorage.getItem(LIST_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as GeneratedAssistanceRow[]
  } catch {
    return []
  }
}

export function subscribeGeneratedAssistanceList(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LIST_KEY) callback()
  }
  window.addEventListener(UPDATED_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(UPDATED_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function generateAssistanceList(): GeneratedAssistanceRow[] {
  const generatedAt = new Date().toISOString()
  const seen = new Set<string>()
  const rows = getStaffBeneficiaries()
    .filter((beneficiary) => beneficiary.verification === 'VERIFIED' && beneficiary.name.trim())
    .map((beneficiary) => {
      const score = scoreFor(beneficiary.monthlyIncome, beneficiary.familySize, beneficiary.vulnerability)
      const classification = beneficiary.vulnerability
      return {
        name: beneficiary.name.trim(),
        association: beneficiary.association,
        score,
        classification,
        program: matchProgram(classification),
        verification: 'VERIFIED' as const,
        reason: `Vulnerability score ${score} from household income, family size, and recorded classification. Program matched by eligibility rules with no duplicate beneficiary.`,
        generatedAt,
      }
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .filter((row) => {
      const key = row.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))

  localStorage.setItem(LIST_KEY, JSON.stringify(rows))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
  return rows
}
