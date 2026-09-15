import { FileDown, Pencil, Eye } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { VulnerabilityBadge, StatusBadge, ScoreDisplay } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import { priorityList } from '../../data/mockData'

export default function PriorityListPage() {
  return (
    <>
      <AdminHeader title="Priority List" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap gap-3">
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <option>All Classifications</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <option>Sort: Highest Score</option>
                <option>Sort: Lowest Score</option>
                <option>Sort: Recent</option>
              </select>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <option>Previous Aid: All</option>
                <option>None</option>
                <option>Yes</option>
              </select>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <FileDown className="h-4 w-4" />
              Export Priority List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Association</th>
                  <th className="px-4 py-3">Vulnerability Score</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Recommended Assistance</th>
                  <th className="px-4 py-3">Previous Aid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {priorityList.map((row) => (
                  <tr key={row.rank} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.association}</td>
                    <td className="px-4 py-3"><ScoreDisplay score={row.score} /></td>
                    <td className="px-4 py-3"><VulnerabilityBadge level={row.classification} /></td>
                    <td className="px-4 py-3 text-gray-600">{row.recommended}</td>
                    <td className="px-4 py-3 text-gray-500">{row.previousAid}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination showing="Showing 1 to 7 of 42 records" />
        </div>
      </main>
    </>
  )
}
