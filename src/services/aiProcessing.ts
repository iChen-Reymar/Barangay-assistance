import type { StaffBeneficiary, VulnerabilityLevel } from '../data/staffMockData'
import { getStaffBeneficiaries } from './staffBeneficiaryStorage'
import {
  scoreBeneficiaries,
  retrainModels,
  type DecisionTreeStep,
  type LogisticContribution,
  type ModelMetrics,
} from './mlService'
import { getAidRecords } from './aidRecordStorage'
import { getAssociationByName } from './associationStorage'
import { getPrograms } from './programStorage'

const LIST_KEY = 'barangay_generated_assistance_list'
const MODEL_KEY = 'barangay_ml_model_state'
const UPDATED_EVENT = 'ai-list-generated'

export interface GeneratedAssistanceRow {
  id: string
  beneficiaryId: string
  requestId?: string
  rank: number
  name: string
  association: string
  score: number
  classification: VulnerabilityLevel
  program: string
  verification: 'VERIFIED'
  reason: string
  generatedAt: string
  /** 'ml' for operational lists. 'rules' is retained only for legacy rows. */
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
    const rows = JSON.parse(raw) as GeneratedAssistanceRow[]
    return rows.map((row) => ({
      ...row,
      id: row.id || `${row.association.trim().toLowerCase()}:${row.name.trim().toLowerCase()}`,
      beneficiaryId: row.beneficiaryId || row.id,
    }))
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
    id: beneficiary.id,
    beneficiaryId: beneficiary.id,
    name: beneficiary.name.trim(),
    association: beneficiary.association,
    score: Math.round(score),
    classification,
    program: matchProgram(classification, beneficiary.vulnerabilityIndicators),
    verification: 'VERIFIED' as const,
    reason: `Local rule score ${score} from household income, family size, and recorded classification. The ML service was not reachable, so this row was not scored by the models.`,
    generatedAt,
    engine: 'rules' as const,
  }
}

function rowsFromScores(
  beneficiaries: StaffBeneficiary[],
  scored: Awaited<ReturnType<typeof scoreBeneficiaries>>,
  generatedAt: string,
): UnrankedRow[] {
  if (!scored) throw new Error('The ML service is unavailable. No final list was generated.')
  const byId = new Map(scored.map((result) => [result.id, result]))
  return beneficiaries.map((beneficiary) => {
    const result = byId.get(beneficiary.id)
    if (!result) throw new Error(`The ML service did not return a score for beneficiary ${beneficiary.id}.`)
    const classification = result.classification
    return {
      id: beneficiary.id,
      beneficiaryId: beneficiary.id,
      name: beneficiary.name.trim(),
      association: beneficiary.association,
      score: Math.round(result.score),
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
}

function dedupeAndRank(rows: UnrankedRow[]): GeneratedAssistanceRow[] {
  const seen = new Set<string>()
  return rows
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .filter((row) => {
      const key = row.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

/**
 * Generate the assistance list using the ML models when they are reachable.
 *
 * Operational generation fails if the ML service is unavailable. A request
 * must never be finalized from an offline heuristic fallback.
 */
export async function generateAssistanceListAsync(): Promise<GeneratedAssistanceRow[]> {
  const generatedAt = new Date().toISOString()
  const beneficiaries = verifiedBeneficiaries()
  if (!beneficiaries.length) return persist([])

  const scored = await scoreBeneficiaries(beneficiaries)
  return persist(dedupeAndRank(rowsFromScores(beneficiaries, scored, generatedAt)))
}

/**
 * Score association members and store that list.
 *
 * Rows already stored are kept only when their name is in `retainNames`, so
 * staff accounts and other non-members drop out. Matching names are replaced
 * by the new scores.
 */
export async function generateAssistanceListFor(
  beneficiaries: StaffBeneficiary[],
  options: { requestId: string; programName: string },
): Promise<GeneratedAssistanceRow[]> {
  const existingSelections = getGeneratedAssistanceList()
  const checked = beneficiaries.map((beneficiary) => ({
    beneficiary,
    eligibility: existingSelections.some((row) =>
      row.requestId !== options.requestId
      && row.beneficiaryId === beneficiary.id
      && row.program.trim().toLowerCase() === options.programName.trim().toLowerCase())
      ? { eligible: false, reason: 'Duplicate prevention: this household is already in another generated list for the same program.' }
      : programEligibility(beneficiary, options.programName),
  }))
  const named = checked.filter((entry) => entry.eligibility.eligible).map((entry) => entry.beneficiary)
  if (!named.length) throw new Error('No verified households passed the program eligibility, duplicate-aid, and cooling-period rules.')

  const generatedAt = new Date().toISOString()
  const scored = await scoreBeneficiaries(named)
  const eligibilityById = new Map(checked.map((entry) => [entry.beneficiary.id, entry.eligibility.reason]))
  const fresh = rowsFromScores(named, scored, generatedAt).map((row) => ({
    ...row,
    id: `${options.requestId}:${row.beneficiaryId}`,
    requestId: options.requestId,
    program: options.programName,
    reason: `${row.reason} ${eligibilityById.get(row.beneficiaryId) ?? ''}`.trim(),
  }))
  const program = getPrograms().find((entry) => entry.name.trim().toLowerCase() === options.programName.trim().toLowerCase())
  const limit = program?.maxBeneficiaries && program.maxBeneficiaries > 0 ? program.maxBeneficiaries : Number.POSITIVE_INFINITY
  const freshRanked = dedupeAndRank(fresh).slice(0, limit)
  const kept = existingSelections.filter((row) => row.requestId !== options.requestId)
  return persist([...freshRanked, ...kept])
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.trim().toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

function monthsSince(date: string) {
  const received = new Date(date).getTime()
  if (!Number.isFinite(received)) return Number.POSITIVE_INFINITY
  return (Date.now() - received) / (30.4375 * 24 * 60 * 60 * 1000)
}

function programEligibility(beneficiary: StaffBeneficiary, programName: string) {
  const indicators = beneficiary.vulnerabilityIndicators ?? []
  const hasPwd = indicators.some((value) => value.toLowerCase().includes('pwd'))
  const age = beneficiary.age ?? 0
  const employment = beneficiary.employmentStatus?.toLowerCase() ?? ''
  const associationType = getAssociationByName(beneficiary.association)?.type ?? ''
  const priorAid = getAidRecords(beneficiary.association).filter(
    (record) => record.memberId === (beneficiary.memberId || beneficiary.id) && record.status === 'RECEIVED',
  )
  const duplicate = priorAid.find(
    (record) => record.program.trim().toLowerCase() === programName.trim().toLowerCase() && monthsSince(record.dateReceived) < 6,
  )
  if (duplicate) return { eligible: false, reason: `Duplicate prevention: the same program was received within the six-month cooling period (${duplicate.dateReceived}).` }

  if (includesAny(programName, ['pwd', 'disability']) && !hasPwd) {
    return { eligible: false, reason: 'PWD support requires a verified PWD indicator.' }
  }
  if (includesAny(programName, ['cash-for-work', 'cash for work'])) {
    const ableToWork = age >= 18 && age < 60 && !hasPwd && includesAny(employment, ['unemployed', 'seasonal'])
    if (!ableToWork) return { eligible: false, reason: 'Cash-for-work requires a verified able-bodied adult aged 18–59 who is unemployed or seasonal.' }
  }
  if (includesAny(programName, ['livelihood', 'skills training'])) {
    const workEligible = includesAny(employment, ['unemployed', 'seasonal', 'self-employed'])
    const associationEligible = includesAny(associationType, ['livelihood', 'agricultural', 'youth'])
    if (!workEligible || !associationEligible) {
      return { eligible: false, reason: 'Livelihood assistance requires eligible employment status and a livelihood, agricultural, or youth association.' }
    }
  }
  if (includesAny(programName, ['food', 'rice'])) {
    const recentAid = priorAid.find((record) => monthsSince(record.dateReceived) < 3)
    if (recentAid) return { eligible: false, reason: `Food assistance cooling period: aid was received within the previous three months (${recentAid.dateReceived}).` }
  }
  return { eligible: true, reason: priorAid.length ? 'Passed stable-ID aid-history and program eligibility checks.' : 'No conflicting prior aid was found; program eligibility checks passed.' }
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
