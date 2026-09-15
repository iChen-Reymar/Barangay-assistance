import {
  aiRecommendations,
  assistanceRequests,
  pendingRecommendations,
  type MatchStatus,
  type RequestStatus,
} from '../data/mockData'
import { staffApprovedRequests } from '../data/staffMockData'
import type { BarChartItem, ChartSegment } from '../types/charts'
import { getAssistanceItems, getRecommendationItems } from './decisionStorage'

const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: '#9ca3af',
  APPROVED: '#22c55e',
  'UNDER REVIEW': '#3b82f6',
  REJECTED: '#ef4444',
}

const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  'HIGH MATCH': '#ef4444',
  'MEDIUM MATCH': '#f59e0b',
  'MODERATE MATCH': '#22c55e',
}

const DISTRIBUTION_STATUS_COLORS: Record<string, string> = {
  RELEASED: '#22c55e',
  SCHEDULED: '#3b82f6',
  'PENDING COLLECTION': '#f59e0b',
  DISTRIBUTED: '#22c55e',
  COMPLETED: '#16a34a',
}

function shortenLabel(label: string, max = 28) {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

function normalizeProgramName(program: string) {
  const aliases: Record<string, string> = {
    'Department of Agriculture Fertilizer Subsidy': 'Fertilizer Subsidy',
    'BFAR Direct Fishery Gear Subsidy Program': 'Fishery Gear Subsidy',
    'DSWD Livelihood Skills Training & Grant Combo': 'Livelihood Training',
    'Barangay Free Maintenance Medicine allocation': 'Medical Assistance',
    'DA Fertilizer Distribution': 'Fertilizer Subsidy',
    'BFAR Fishery Gear Subsidy': 'Fishery Gear Subsidy',
    'DSWD Livelihood Training': 'Livelihood Training',
    'Free Maintenance Medicine': 'Medical Assistance',
  }
  return aliases[program] ?? program
}

export function getRequestStatusChartData(): ChartSegment[] {
  const items = getAssistanceItems()
  const source =
    items.length > 0
      ? items
      : assistanceRequests.map((row, index) => ({
          id: `seed-${index}`,
          status: row.status,
        }))

  const counts: Record<RequestStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    'UNDER REVIEW': 0,
    REJECTED: 0,
  }

  for (const item of source) {
    counts[item.status as RequestStatus] = (counts[item.status as RequestStatus] ?? 0) + 1
  }

  return (Object.keys(counts) as RequestStatus[]).map((status) => ({
    label: status,
    value: counts[status],
    color: REQUEST_STATUS_COLORS[status],
  }))
}

export function getRequestStatusTotal() {
  return getRequestStatusChartData().reduce((sum, segment) => sum + segment.value, 0)
}

export function getProgramMatchChartData(): BarChartItem[] {
  const recommendations = getRecommendationItems()
  const source =
    recommendations.length > 0
      ? recommendations.map((item) => ({
          program: normalizeProgramName(item.program ?? item.requestType),
          score: item.score ?? 0,
          matchStatus: (item.score ?? 0) >= 80 ? 'HIGH MATCH' : (item.score ?? 0) >= 70 ? 'MEDIUM MATCH' : 'MODERATE MATCH',
        }))
      : [
          ...aiRecommendations.map((row) => ({
            program: normalizeProgramName(row.program),
            score: row.score,
            matchStatus: row.matchStatus,
          })),
          ...pendingRecommendations.map((row) => ({
            program: normalizeProgramName(row.program),
            score: row.score,
            matchStatus: (row.score >= 80 ? 'HIGH MATCH' : row.score >= 70 ? 'MEDIUM MATCH' : 'MODERATE MATCH') as MatchStatus,
          })),
        ]

  const byProgram = new Map<string, { score: number; matchStatus: MatchStatus }>()

  for (const row of source) {
    const existing = byProgram.get(row.program)
    if (!existing || row.score > existing.score) {
      byProgram.set(row.program, { score: row.score, matchStatus: row.matchStatus as MatchStatus })
    }
  }

  return [...byProgram.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 6)
    .map(([label, data]) => ({
      label: shortenLabel(label),
      value: data.score,
      suffix: '/100',
      color: MATCH_STATUS_COLORS[data.matchStatus],
    }))
}

export function getDistributionStatusChartData(): ChartSegment[] {
  const counts = new Map<string, number>()

  for (const row of staffApprovedRequests) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  }

  return [...counts.entries()].map(([label, value]) => ({
    label,
    value,
    color: DISTRIBUTION_STATUS_COLORS[label] ?? '#6b7280',
  }))
}

export function getDistributionByProgramChartData(): BarChartItem[] {
  const byProgram = new Map<string, number>()

  for (const row of staffApprovedRequests) {
    const program = normalizeProgramName(row.program)
    byProgram.set(program, (byProgram.get(program) ?? 0) + row.beneficiaries)
  }

  return [...byProgram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({
      label: shortenLabel(label),
      value,
      suffix: ' beneficiaries',
      color: '#16a34a',
    }))
}

export function getDistributionBeneficiaryTotal() {
  return staffApprovedRequests.reduce((sum, row) => sum + row.beneficiaries, 0)
}
