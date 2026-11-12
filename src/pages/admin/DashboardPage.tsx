import { useEffect, useState } from 'react'
import { Building2, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { StatCard } from '../../components/ui/StatCard'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DonutChart } from '../../components/admin/DonutChart'
import { VulnerabilityBadge, StatusBadge, MatchBadge, ScoreDisplay } from '../../components/admin/StatusBadge'
import type { MatchStatus, VulnerabilityLevel } from '../../data/mockData'
import { getAuditLogs, subscribeAuditLogs } from '../../services/auditStorage'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { getAssistanceItems, subscribeDecisionStorage } from '../../services/decisionStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'
import type { GeneratedAssistanceRow } from '../../services/aiProcessing'
import { getStaffBeneficiaries, subscribeStaffBeneficiaryStorage } from '../../services/staffBeneficiaryStorage'

function asLevel(value: string): VulnerabilityLevel {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') return value
  return 'LOW'
}

function matchStatus(score: number): MatchStatus {
  if (score >= 80) return 'HIGH MATCH'
  if (score >= 60) return 'MEDIUM MATCH'
  return 'MODERATE MATCH'
}

interface AssociationRecommendationSummary {
  id: string
  association: string
  program: string
  qualifiedMembers: number
  highestScore: number
  generatedAt: string
}

function summarizeRecommendations(rows: GeneratedAssistanceRow[]): AssociationRecommendationSummary[] {
  const summaries = new Map<string, AssociationRecommendationSummary & { beneficiaryIds: Set<string> }>()

  for (const row of rows) {
    const association = row.association.trim() || 'Unassigned'
    const program = row.program.trim() || 'Assistance'
    const id = `${row.requestId ?? 'legacy'}|${association.toLowerCase()}|${program.toLowerCase()}`
    const current = summaries.get(id) ?? {
      id,
      association,
      program,
      qualifiedMembers: 0,
      highestScore: row.score,
      generatedAt: row.generatedAt,
      beneficiaryIds: new Set<string>(),
    }

    current.beneficiaryIds.add(row.beneficiaryId)
    current.qualifiedMembers = current.beneficiaryIds.size
    current.highestScore = Math.max(current.highestScore, row.score)
    if (row.generatedAt > current.generatedAt) current.generatedAt = row.generatedAt
    summaries.set(id, current)
  }

  return [...summaries.values()]
    .map((summary) => ({
      id: summary.id,
      association: summary.association,
      program: summary.program,
      qualifiedMembers: summary.qualifiedMembers,
      highestScore: summary.highestScore,
      generatedAt: summary.generatedAt,
    }))
    .sort((left, right) =>
      right.generatedAt.localeCompare(left.generatedAt)
      || left.association.localeCompare(right.association)
      || left.program.localeCompare(right.program),
    )
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    const stops = [
      subscribeAssociationStorage(refresh),
      subscribeStaffBeneficiaryStorage(refresh),
      subscribeDecisionStorage(refresh),
      subscribeGeneratedAssistanceList(refresh),
      subscribeAuditLogs(refresh),
    ]
    return () => stops.forEach((stop) => stop())
  }, [])

  void tick
  const associations = getAssociations()
  const beneficiaries = getStaffBeneficiaries()
  const requests = getAssistanceItems()
  const generated = getGeneratedAssistanceList()
  const recommendationSummaries = summarizeRecommendations(generated)
  const activity = getAuditLogs().slice(0, 5)
  const high = beneficiaries.filter((row) => row.vulnerability === 'HIGH').length
  const medium = beneficiaries.filter((row) => row.vulnerability === 'MEDIUM').length
  const low = beneficiaries.filter((row) => row.vulnerability === 'LOW').length

  return (
    <>
      <AdminHeader title="Barangay Captain Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Total Associations" value={associations.length} icon={Building2} href="/admin/associations" />
          <StatCard label="Total Beneficiaries" value={beneficiaries.length} icon={Users} href="/admin/recommendations" />
          <StatCard label="Pending Requests" value={requests.filter((row) => row.status === 'PENDING' || row.status === 'UNDER REVIEW').length} icon={Clock} href="/admin/people?view=assistance" />
          <StatCard label="Generated Lists" value={generated.length} icon={CheckCircle} href="/admin/recommendations" />
          <StatCard label="High Vulnerability" value={high} icon={AlertTriangle} href="/admin/recommendations" />
        </div>

        <div className="mb-4 sm:mb-6">
          <AnalyticsCharts requestStatusHref="/admin/people?view=assistance" />
        </div>

        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Vulnerability Distribution</h2>
            <DonutChart
              high={high}
              medium={medium}
              low={low}
              total={beneficiaries.length}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Assistance Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Association</th>
                    <th className="px-4 py-3">Request Type</th>
                    <th className="px-4 py-3">Vulnerability</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No assistance requests yet.</td>
                    </tr>
                  ) : requests.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.association}</td>
                      <td className="px-4 py-3 text-gray-600">{row.requestType}</td>
                      <td className="px-4 py-3"><VulnerabilityBadge level={asLevel(row.vulnerability)} /></td>
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent AI Recommendations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Association</th>
                    <th className="px-4 py-3">Qualified Members</th>
                    <th className="px-4 py-3">Recommended Program</th>
                    <th className="px-4 py-3">Highest AI Score</th>
                    <th className="px-4 py-3">Match Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendationSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No AI-generated results yet.</td>
                    </tr>
                  ) : recommendationSummaries.slice(0, 5).map((summary) => (
                    <tr key={summary.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{summary.association}</td>
                      <td className="px-4 py-3 text-gray-600">{summary.qualifiedMembers}</td>
                      <td className="px-4 py-3 text-gray-600">{summary.program}</td>
                      <td className="px-4 py-3"><ScoreDisplay score={summary.highestScore} /></td>
                      <td className="px-4 py-3"><MatchBadge status={matchStatus(summary.highestScore)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Recent Activity Log</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm text-gray-700">{item.description}</p>
                      <p className="text-xs text-gray-400">{item.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
