import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../ui/Badge'
import type { VulnerabilityLevel } from '../../data/associationMockData'
import {
  getGeneratedAssistanceList,
  subscribeGeneratedAssistanceList,
  type GeneratedAssistanceRow,
} from '../../services/aiProcessing'
import {
  getAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'

function same(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger' as const
  if (level === 'MEDIUM') return 'warning' as const
  return 'success' as const
}

export function AiRecommendationBoards({
  associationName,
  emptyMessage,
  compact = false,
}: {
  /** When set, only this association is shown. Omit it to show every association. */
  associationName?: string
  emptyMessage: string
  /** Staff and admin start with a short list and open one generated result at a time. */
  compact?: boolean
}) {
  const [rows, setRows] = useState<GeneratedAssistanceRow[]>(() => getGeneratedAssistanceList())
  const [requests, setRequests] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [openKey, setOpenKey] = useState<string | null>(null)

  useEffect(() => {
    const refreshRows = () => setRows(getGeneratedAssistanceList())
    const refreshRequests = () => setRequests(getAssistanceItems())
    refreshRows()
    refreshRequests()
    const stopRows = subscribeGeneratedAssistanceList(refreshRows)
    const stopRequests = subscribeDecisionStorage(refreshRequests)
    return () => {
      stopRows()
      stopRequests()
    }
  }, [])

  const groups = useMemo(() => {
    const visible = associationName === undefined
      ? rows
      : rows.filter((row) => associationName.trim() !== '' && same(row.association, associationName))
    const grouped = new Map<string, { association: string; program: string; members: GeneratedAssistanceRow[] }>()
    for (const row of visible) {
      const association = row.association.trim() || 'Unassigned'
      const program = row.program.trim() || 'Assistance'
      const key = `${association.toLowerCase()}|${program.toLowerCase()}`
      const current = grouped.get(key) ?? { association, program, members: [] }
      current.members.push(row)
      grouped.set(key, current)
    }

    return [...grouped.values()]
      .map((group) => {
        const related = requests.filter(
          (request) =>
            same(request.association, group.association) &&
            (same(request.requestType, group.program) || same(request.program ?? '', group.program)),
        )
        const members = [...group.members].sort((left, right) => left.rank - right.rank || right.score - left.score)
        return { ...group, members, requests: related }
      })
      .sort((left, right) => left.association.localeCompare(right.association) || left.program.localeCompare(right.program))
  }, [associationName, requests, rows])

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-8 text-sm text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  const showAssociation = associationName === undefined
  const opened = compact ? groups.find((group) => `${group.association}-${group.program}` === openKey) : null

  if (compact && !opened) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {groups.map((group) => {
          const key = `${group.association}-${group.program}`
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenKey(key)}
              className="flex w-full items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 text-left last:border-b-0 hover:bg-gray-50"
            >
              <span>
                <span className="block text-sm font-bold text-gray-900">
                  {showAssociation ? group.association : group.program}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {showAssociation ? group.program : group.association}
                </span>
                <span className="mt-1 block text-xs text-gray-400">
                  {group.members.length} member{group.members.length === 1 ? '' : 's'} scored
                  {group.requests[0]?.date ? ` · Requested ${group.requests[0].date}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-green-700">View</span>
            </button>
          )
        })}
      </div>
    )
  }

  const visibleGroups = opened ? [opened] : groups

  return (
    <div className="space-y-6">
      {visibleGroups.map((group) => (
        <section key={`${group.association}-${group.program}`} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          {compact ? (
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="mb-4 text-sm font-semibold text-green-700 hover:underline"
            >
              Back to list
            </button>
          ) : null}
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-green-700">
                {showAssociation ? group.association : 'Recommended for your request'}
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">{group.program}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {group.members.length} member{group.members.length === 1 ? '' : 's'} scored
                {group.requests[0]?.date ? ` · Requested ${group.requests[0].date}` : ''}
              </p>
            </div>
            <Badge variant="success">AI GENERATED</Badge>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Why</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map((member) => (
                  <tr key={`${group.association}-${group.program}-${member.rank}-${member.name}`} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{member.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-3">
                      <span className={member.score >= 80 ? 'font-semibold text-red-500' : member.score >= 50 ? 'text-orange-500' : 'text-green-600'}>
                        {member.score} / 100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={vulnerabilityVariant(member.classification)}>{member.classification}</Badge>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      <span className="line-clamp-2" title={member.reason}>{member.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
