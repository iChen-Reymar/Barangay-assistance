/**
 * Client for the Python ML microservice (ml-service/app.py).
 *
 * The service runs two supervised models over the beneficiary record: a decision
 * tree and logistic regression. Both are blended into one 0-100 vulnerability
 * score, and both ship an explanation so a barangay official can see exactly why
 * a household landed where it did.
 *
 * The web app is designed to keep working when the ML service is not running -
 * every call here degrades to `null` rather than throwing, so callers can fall
 * back to the local rule-based scorer.
 */

import type { StaffBeneficiary, VulnerabilityLevel } from '../data/staffMockData'

/**
 * Where the ML endpoints live.
 *
 * Default is the same-origin `/api/ml` prefix, which the Node application layer
 * proxies to the Python service. Going through that proxy keeps a single origin
 * in the browser - no CORS, and the client never has to know where the models
 * are hosted, which is the three-tier arrangement the study describes.
 *
 * Set VITE_ML_URL to reach the Python service directly, e.g. when working on the
 * models in isolation.
 */
const ML_BASE = (import.meta.env.VITE_ML_URL as string | undefined) || '/api/ml'

/** Points each class contributes to the blended score. Mirrors models.py. */
export const CLASS_POINTS: Record<VulnerabilityLevel, number> = {
  HIGH: 100,
  MEDIUM: 55,
  LOW: 15,
}

export interface DecisionTreeStep {
  feature: string
  operator: '<=' | '>'
  threshold: number
  actualValue: number
  passed: boolean
}

export interface LogisticContribution {
  feature: string
  coefficient: number
  contribution: number
}

export interface MlScoreResult {
  id?: string
  name?: string
  association?: string
  score: number
  classification: VulnerabilityLevel
  probabilities: Record<VulnerabilityLevel, number>
  decisionTreePrediction: VulnerabilityLevel
  logisticRegressionPrediction: VulnerabilityLevel
  /** True when both models independently chose the same class. */
  agreement: boolean
  decisionTreePath: DecisionTreeStep[]
  logisticContributions: LogisticContribution[]
  /** Short human-readable list of the household's salient features. */
  factors: string[]
}

export interface MlScoreResponse {
  ok: boolean
  trainedAt?: string | null
  modelMetrics?: { accuracy: number; f1Macro: number } | null
  ensembleWeights?: { decisionTree: number; logisticRegression: number }
  results: MlScoreResult[]
  error?: string
}

export interface ModelMetrics {
  accuracy: number
  precisionMacro: number
  recallMacro: number
  f1Macro: number
  support: Record<string, number>
  perClass: Record<string, { precision: number; recall: number; f1: number }>
  confusionMatrix: { labels: string[]; rows: number[][] }
}

export interface ModelInfo {
  trainedAt: string | null
  summary: {
    samples: number
    features: string[]
    classDistribution: Record<string, number>
    realRecordsIncluded: number
    trainSize: number
    testSize: number
  } | null
  metrics: Record<'decisionTree' | 'logisticRegression' | 'blended', ModelMetrics> | null
  featureImportance: { feature: string; importance: number }[]
  coefficients: { feature: string; coefficient: number }[]
  decisionTreeRules: string[]
  featureNames: string[]
  classes: VulnerabilityLevel[]
  ensembleWeights: { decisionTree: number; logisticRegression: number }
  targetAccuracy: number
}

/** True when the ML service answered its health check within the timeout. */
export async function isMlAvailable(timeoutMs = 1500): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(`${ML_BASE}/api/health`, { signal: controller.signal })
    window.clearTimeout(timer)
    return response.ok
  } catch {
    return false
  }
}

async function postJson<T>(path: string, body: unknown, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${ML_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`ML service returned ${response.status}`)
    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * Score a list of beneficiaries. Returns `null` when the service is unreachable
 * or returns nothing usable, so callers can fall back to rule-based scoring.
 */
export async function scoreBeneficiaries(
  beneficiaries: StaffBeneficiary[],
): Promise<MlScoreResult[] | null> {
  if (!beneficiaries.length) return []
  try {
    const response = await postJson<MlScoreResponse>('/api/score', { records: beneficiaries })
    if (!response.ok || !Array.isArray(response.results) || !response.results.length) return null
    return response.results
  } catch {
    return null
  }
}

/** Fetch model metrics and explanations. Returns `null` when unavailable. */
export async function getModelInfo(): Promise<ModelInfo | null> {
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`${ML_BASE}/api/model`, { signal: controller.signal })
    window.clearTimeout(timer)
    if (!response.ok) return null
    return (await response.json()) as ModelInfo
  } catch {
    return null
  }
}

/**
 * Retrain on the synthetic seed plus whatever real records are supplied.
 * Staff trigger this after entering a batch of verified beneficiaries.
 */
export async function retrainModels(
  beneficiaries: StaffBeneficiary[],
): Promise<{ ok: boolean; metrics?: ModelMetrics; error?: string }> {
  try {
    const response = await postJson<{ ok: boolean; metrics?: Record<string, ModelMetrics>; error?: string }>(
      '/api/train',
      { records: beneficiaries },
      90000,
    )
    return { ok: response.ok, metrics: response.metrics?.blended, error: response.error }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'ML service unavailable.' }
  }
}

/** Human label for a feature key coming back from the Python side. */
export const FEATURE_LABELS: Record<string, string> = {
  family_size: 'Family size',
  monthly_income: 'Monthly income',
  income_per_capita: 'Income per family member',
  head_age: 'Age of household head',
  employment_score: 'Employment status',
  housing_score: 'Housing condition',
  has_elderly: 'Elderly member present',
  has_pwd: 'PWD member present',
  has_young_children: 'Child under 5 present',
  has_unemployed_adults: 'Unemployed adults present',
  no_prior_aid: 'No prior government assistance',
  dependent_load: 'Dependent members',
}

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key
}
