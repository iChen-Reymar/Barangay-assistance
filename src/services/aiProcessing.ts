import { assessmentBeneficiaries, type VulnerabilityLevel } from '../data/staffMockData'

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

function classify(score: number): VulnerabilityLevel {
  if (score >= 80) return 'HIGH'
  if (score >= 60) return 'MEDIUM'
  return 'LOW'
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
  const rows = assessmentBeneficiaries
    .filter((beneficiary) => beneficiary.name.trim() && beneficiary.monthlyIncome > 0 && beneficiary.familySize > 0)
    .map((beneficiary) => {
      const score = beneficiary.score
      const classification = classify(score)
      return {
        name: beneficiary.name.trim(),
        association: beneficiary.association,
        score,
        classification,
        program: matchProgram(classification),
        verification: 'VERIFIED' as const,
        reason: `Vulnerability score ${score} from household income and family size. Program matched by eligibility rules with no duplicate beneficiary.`,
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
