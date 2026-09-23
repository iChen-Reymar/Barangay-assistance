import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  ScrollText,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { associations } from '../../data/mockData'
import { getAuditLogs } from '../../services/auditStorage'
import { getAllUsers } from '../../services/authStorage'
import { getReviewableItems } from '../../services/decisionStorage'
import { getPrograms } from '../../services/programStorage'

interface OverviewAction {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const actions: OverviewAction[] = [
  {
    to: '/admin/audit-logs',
    title: 'View Audit Logs',
    description: 'See who did what, and when, across the system.',
    icon: ScrollText,
  },
  {
    to: '/admin/reports',
    title: 'Export Reports',
    description: 'Download records as CSV or PDF for meetings and documentation.',
    icon: FileDown,
  },
  {
    to: '/admin/users',
    title: 'Manage Users',
    description: 'Add accounts, remove access, and change permissions.',
    icon: UserCog,
  },
  {
    to: '/admin/associations',
    title: 'Manage Association',
    description: 'Keep association profiles and their records up to date.',
    icon: Building2,
  },
  {
    to: '/admin/recommendations?status=approved',
    title: 'View Approved Recommendations',
    description: 'Review the AI recommendations that have already been approved.',
    icon: ClipboardCheck,
  },
  {
    to: '/admin/programs',
    title: 'Manage Assistance Lists',
    description: 'Organize the aid programs available for distribution.',
    icon: ClipboardList,
  },
]

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    users: 0,
    associations: associations.length,
    approved: 0,
    programs: 0,
    audit: 0,
  })

  useEffect(() => {
    setCounts({
      users: getAllUsers().filter((user) => user.status === 'approved').length,
      associations: associations.length,
      approved: getReviewableItems().filter((item) => item.status === 'APPROVED').length,
      programs: getPrograms().filter((program) => program.status === 'ACTIVE').length,
      audit: getAuditLogs().length,
    })
  }, [])

  const summary = [
    { label: 'Approved users', value: counts.users },
    { label: 'Associations', value: counts.associations },
    { label: 'Approved recommendations', value: counts.approved },
    { label: 'Active assistance lists', value: counts.programs },
    { label: 'Audit events', value: counts.audit },
  ]

  return (
    <>
      <AdminHeader title="Admin / Barangay Captain Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Management overview</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Open a control to review activity, export records, manage people and associations, and organize assistance.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {summary.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                to={action.to}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm transition hover:border-primary hover:shadow-md"
              >
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-primary">
                  <Icon className="h-8 w-8" />
                </span>
                <span className="text-base font-bold text-gray-900">{action.title}</span>
                <span className="mt-2 text-sm text-gray-500">{action.description}</span>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
