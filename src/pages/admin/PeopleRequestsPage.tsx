import { useEffect, useState } from 'react'
import { Inbox, UserCheck, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { useAuth } from '../../context/useAuth'
import { getAssistanceItems, subscribeDecisionStorage } from '../../services/decisionStorage'
import AccessRequestsPage from './AccessRequestsPage'
import AssistanceRequestsPage from './AssistanceRequestsPage'
import UsersPage from './UsersPage'

type WorkspaceView = 'users' | 'access' | 'assistance'

const views: { id: WorkspaceView; label: string; description: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Users', description: 'Accounts, permissions, and associations', icon: Users },
  { id: 'access', label: 'Access requests', description: 'Review people waiting for account access', icon: UserCheck },
  { id: 'assistance', label: 'Assistance requests', description: 'Monitor submitted aid requests and generated lists', icon: Inbox },
]

function requestedView(value: string | null): WorkspaceView {
  return value === 'access' || value === 'assistance' ? value : 'users'
}

export default function PeopleRequestsPage() {
  const [params, setParams] = useSearchParams()
  const active = requestedView(params.get('view'))
  const { allUsers, pendingRequests } = useAuth()
  const [assistanceCount, setAssistanceCount] = useState(() => getAssistanceItems().length)

  useEffect(() => subscribeDecisionStorage(() => setAssistanceCount(getAssistanceItems().length)), [])

  const counts: Record<WorkspaceView, number> = {
    users: allUsers.length,
    access: pendingRequests.length,
    assistance: assistanceCount,
  }

  return (
    <>
      <AdminHeader title="People & Requests" searchPlaceholder="Search people and requests..." />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 [scrollbar-gutter:stable] sm:p-5 md:p-6">
        <section className="mx-auto max-w-[1500px]">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-950">People and request oversight</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
              Manage system access and monitor assistance activity from one workspace. Each area keeps its own actions and review rules.
            </p>
          </div>

          <div className="mb-5 grid gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm md:grid-cols-3">
            {views.map(({ id, label, description, icon: Icon }) => {
              const selected = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setParams({ view: id }, { replace: true })}
                  className={`flex min-h-20 items-center gap-3 rounded-lg px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    selected ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={selected}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white/15' : 'bg-green-50 text-primary'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${selected ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {counts[id]}
                      </span>
                    </span>
                    <span className={`mt-0.5 block text-xs leading-5 ${selected ? 'text-white/75' : 'text-gray-500'}`}>{description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {active === 'users' ? <UsersPage embedded /> : null}
          {active === 'access' ? <AccessRequestsPage embedded /> : null}
          {active === 'assistance' ? <AssistanceRequestsPage embedded /> : null}
        </section>
      </main>
    </>
  )
}
