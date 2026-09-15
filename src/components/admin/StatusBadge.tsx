import type { VulnerabilityLevel, RequestStatus, MatchStatus } from '../../data/mockData'

const vulnerabilityStyles: Record<VulnerabilityLevel, string> = {
  HIGH: 'bg-red-50 text-red-600 border-red-200',
  MEDIUM: 'bg-orange-50 text-orange-600 border-orange-200',
  LOW: 'bg-green-50 text-green-700 border-green-200',
}

const statusStyles: Record<RequestStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-green-50 text-green-700',
  'UNDER REVIEW': 'bg-blue-50 text-blue-600',
  REJECTED: 'bg-red-50 text-red-600',
}

const matchStyles: Record<MatchStatus, string> = {
  'HIGH MATCH': 'border-red-300 text-red-600 bg-red-50',
  'MEDIUM MATCH': 'border-orange-300 text-orange-600 bg-orange-50',
  'MODERATE MATCH': 'border-green-300 text-green-700 bg-green-50',
}

export function VulnerabilityBadge({ level }: { level: VulnerabilityLevel }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${vulnerabilityStyles[level]}`}>
      {level}
    </span>
  )
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  )
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${matchStyles[status]}`}>
      {status}
    </span>
  )
}

export function ActiveBadge({ status = 'ACTIVE' }: { status?: 'ACTIVE' | 'INACTIVE' }) {
  if (status === 'INACTIVE') {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
        INACTIVE
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
      ACTIVE
    </span>
  )
}

const programStatusStyles = {
  ACTIVE: 'bg-green-50 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  CLOSED: 'bg-red-50 text-red-600',
} as const

export function ProgramStatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' | 'CLOSED' }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${programStatusStyles[status]}`}
    >
      {status}
    </span>
  )
}

export function ScoreDisplay({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-red-500' : score >= 50 ? 'text-orange-500' : 'text-green-600'
  return <span className={`font-semibold ${color}`}>{score}/100</span>
}
