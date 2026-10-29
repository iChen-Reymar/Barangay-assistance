import type { StaffBeneficiary, VulnerabilityLevel } from '../data/staffMockData'
import { getStaffBeneficiaries } from './staffBeneficiaryStorage'
import {
  scoreBeneficiaries,
  retrainModels,
  type DecisionTreeStep,
  type LogisticContribution,
  type ModelMetrics,
} from './mlService'

const LIST_KEY = 'barangay_generated_assistance_list'
const MODEL_KEY = 'barangay_ml_model_state'
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
  /** 'ml' when the two models scored it, 'rules' when the local fallback did. */
  engine?: 'ml' | 'rules'
  /** Both models' independent guesses, kept so a disagreement stays visible. */
  decisionTreePrediction?: VulnerabilityLevel
  logisticRegressionPrediction?: VulnerabilityLevel
  /** True when the decision tree and logistic regression chose the same class. */
  modelAgreement?: boolean
  decisionTreePath?: DecisionTreeStep[]
  logisticContributions?: LogisticContribution[]
  factors?: string[]
}

/** A scored row that has not been sorted or given its rank yet. */
type UnrankedRow = Omit<GeneratedAssistanceRow, 'rank'>

export interface MlModelState {
  available: boolean
  trainedAt: string | null
  accuracy: number | null
  lastCheckedAt: string
}

/**
 * Rule-based program matching. This sits downstream of the models on purpose:
 * the ML module decides how vulnerable a household is, and these rules decide
 * which program that score makes them eligible for. Keeping eligibility as
 * explicit rules rather than learned behaviour is what lets an official state
 * the reason a household was matched to a program.
 */
function matchProgram(level: VulnerabilityLevel, indicators: string[] = []) {
  const hasPwd = indicators.some((item) => item.includes('PWD'))
  if (level === 'HIGH') return hasPwd ? 'Food Assistance, Rice Subsidy & PWD Support' : 'Food Assistance & Rice Subsidy'
  if (level === 'MEDIUM') return 'Livelihood Training'
  return 'Skills Training'
}

/**
 * Local fallback score, used when the ML service is not running.
 *
 * Mirrors the shape of the model output so rows look the same either way, but
 * it is a fixed heuristic rather than a learned model and is labelled 'rules'
 * wherever it reaches the UI.
 */
function fallbackScore(income: number, familySize: number, level: VulnerabilityLevel) {
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

function persist(rows: GeneratedAssistanceRow[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(rows))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
  return rows
}

function verifiedBeneficiaries() {
  return getStaffBeneficiaries().filter(
    (beneficiary) => beneficiary.verification === 'VERIFIED' && beneficiary.name.trim(),
  )
}

function toRuleRow(beneficiary: StaffBeneficiary, generatedAt: string): UnrankedRow {
  const score = fallbackScore(beneficiary.monthlyIncome, beneficiary.familySize, beneficiary.vulnerability)
  const classification = beneficiary.vulnerability
  return {
    name: beneficiary.name.trim(),
    association: beneficiary.association,
    score,
    classification,
    program: matchProgram(classification, beneficiary.vulnerabilityIndicators),
    verification: 'VERIFIED' as const,
    reason: `Local rule score ${score} from household income, family size, and recorded classification. The ML service was not reachable, so this row was not scored by the models.`,
    generatedAt,
    engine: 'rules' as const,
  }
}

function dedupeAndRank(rows: UnrankedRow[]): GeneratedAssistanceRow[] {
  const seen = new Set<string>()
  return rows
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .filter((row) => {
      const key = row.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

/**
 * Generate the assistance list using the ML models when they are reachable.
 *
 * Falls back to the rule-based scorer rather than failing, because staff need
 * to be able to produce a list even when the ML service is down. Every row
 * records which engine produced it so the two can never be confused.
 */
export async function generateAssistanceListAsync(): Promise<GeneratedAssistanceRow[]> {
  const generatedAt = new Date().toISOString()
  const beneficiaries = verifiedBeneficiaries()
  if (!beneficiaries.length) return persist([])

  const scored = await scoreBeneficiaries(beneficiaries)

  if (!scored) {
    return persist(dedupeAndRank(beneficiaries.map((b) => toRuleRow(b, generatedAt))))
  }

  const byId = new Map(scored.map((result) => [result.id, result]))
  const rows = beneficiaries.map((beneficiary) => {
    const result = byId.get(beneficiary.id)
    if (!result) return toRuleRow(beneficiary, generatedAt)
    const classification = result.classification
    return {
      name: beneficiary.name.trim(),
      association: beneficiary.association,
      score: result.score,
      classification,
      program: matchProgram(classification, beneficiary.vulnerabilityIndicators),
      verification: 'VERIFIED' as const,
      reason: buildReason(result.score, result.probabilities, result.agreement, result.factors),
      generatedAt,
      engine: 'ml' as const,
      decisionTreePrediction: result.decisionTreePrediction,
      logisticRegressionPrediction: result.logisticRegressionPrediction,
      modelAgreement: result.agreement,
      decisionTreePath: result.decisionTreePath,
      logisticContributions: result.logisticContributions,
      factors: result.factors,
    }
  })
  return persist(dedupeAndRank(rows))
}

function buildReason(
  score: number,
  probabilities: Record<VulnerabilityLevel, number>,
  agreement: boolean,
  factors: string[],
) {
  const pct = Math.round(probabilities.HIGH * 100)
  const base = `Blended score ${score} from the decision tree and logistic regression (probability of high vulnerability ${pct}%).`
  const detail = factors.length ? ` Factors: ${factors.join(', ')}.` : ''
  const note = agreement
    ? ' Both models agreed on this classification.'
    : ' The two models disagreed on the class; the higher-vulnerability reading was used.'
  return `${base}${detail}${note}`
}

/**
 * Synchronous rule-based generation.
 *
 * Kept for callers that cannot await, and as the offline fallback path. New
 * code should prefer generateAssistanceListAsync so the models are used.
 */
export function generateAssistanceList(): GeneratedAssistanceRow[] {
  const generatedAt = new Date().toISOString()
  const rows = verifiedBeneficiaries().map((beneficiary) => toRuleRow(beneficiary, generatedAt))
  return persist(dedupeAndRank(rows))
}

// -- model state ---------------------------------------------------------

export function getMlModelState(): MlModelState {
  const raw = localStorage.getItem(MODEL_KEY)
  if (!raw) return { available: false, trainedAt: null, accuracy: null, lastCheckedAt: '' }
  try {
    return JSON.parse(raw) as MlModelState
  } catch {
    return { available: false, trainedAt: null, accuracy: null, lastCheckedAt: '' }
  }
}

export function setMlModelState(state: MlModelState) {
  localStorage.setItem(MODEL_KEY, JSON.stringify(state))
}

export { retrainModels, type ModelMetrics }
