import { useEffect, useMemo, useState } from 'react'
import { FileDown, Sparkles } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { Pagination } from '../../components/ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import type { VulnerabilityLevel, VerificationStatus } from '../../data/staffMockData'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import {
  generateAssistanceList,
  getGeneratedAssistanceList,
  subscribeGeneratedAssistanceList,
  type GeneratedAssistanceRow,
} from '../../services/aiProcessing'

type PriorityItem = GeneratedAssistanceRow

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

function verificationVariant(status: VerificationStatus) {
  if (status === 'VERIFIED') return 'success'
  if (status === 'PENDING') return 'neutral'
  return 'danger'
}

function downloadList(rows: PriorityItem[]) {
  const header = ['Rank', 'Name', 'Association', 'Score', 'Classification', 'Program', 'Verification']
  const lines = rows.map((row) =>
    [row.rank, row.name, row.association, row.score, row.classification, row.program, row.verification]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'assistance-list.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function StaffPriorityListPage() {
  const displayUser = useStaffDisplayUser()
  const [source, setSource] = useState<GeneratedAssistanceRow[]>(() => getGeneratedAssistanceList())
  const associations = ['All Associations', ...new Set(source.map((row) => row.association))]
  const programs = ['All Programs', ...new Set(source.map((row) => row.program))]

  useEffect(() => subscribeGeneratedAssistanceList(() => setSource(getGeneratedAssistanceList())), [])
  const [classification, setClassification] = useState('All Classifications')
  const [association, setAssociation] = useState('All Associations')
  const [program, setProgram] = useState('All Programs')

  const generated = useMemo(() => {
    return source
      .filter((row) => {
        const classificationMatch =
          classification === 'All Classifications' ||
          row.classification === classification.replace(' Risk', '').toUpperCase()
        const associationMatch = association === 'All Associations' || row.association === association
        const programMatch = program === 'All Programs' || row.program === program
        return classificationMatch && associationMatch && programMatch
      })
      .sort((a, b) => b.score - a.score)
      .map((row, index) => ({ ...row, rank: index + 1 }))
  }, [association, classification, program, source])

  const pagination = usePagination(generated, PAGE_SIZE_DEFAULT, `${classification}-${association}-${program}`, 'records')

  const columns: Column<PriorityItem>[] = [
    { key: 'rank', header: 'Rank', render: (r) => <span className="font-bold text-gray-900">{r.rank}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'association', header: 'Association' },
    {
      key: 'score',
      header: 'Vulnerability Score',
      render: (r) => (
        <span className={r.score >= 80 ? 'font-semibold text-red-500' : r.score >= 50 ? 'text-orange-500' : 'text-green-600'}>
          {r.score} / 100
        </span>
      ),
    },
    {
      key: 'classification',
      header: 'Classification',
      render: (r) => <Badge variant={vulnerabilityVariant(r.classification)}>{r.classification}</Badge>,
    },
    { key: 'program', header: 'Program' },
    {
      key: 'verification',
      header: 'Verification Status',
      render: (r) => <Badge variant={verificationVariant(r.verification)}>{r.verification}</Badge>,
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Generate Assistance Lists"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-3xl text-sm text-gray-500">
            Click Generate Assistance List. The AI module scores verified beneficiaries, matches a program, and ranks the qualified list. Results are viewed only. No one approves or rejects a beneficiary by hand.
          </p>
          <Button onClick={() => setSource(generateAssistanceList())}>
            <Sparkles className="h-4 w-4" />
            Generate Assistance List
          </Button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter
                label="Classification"
                options={['All Classifications', 'HIGH', 'MEDIUM', 'LOW']}
                value={classification}
                onChange={setClassification}
              />
              <Filter
                label="Association"
                options={associations}
                value={association}
                onChange={setAssociation}
              />
              <Filter label="Program" options={programs} value={program} onChange={setProgram} />
            </div>
            <Button onClick={() => downloadList(generated)} disabled={generated.length === 0}>
              <FileDown className="h-4 w-4" />
              Export List
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={pagination.paginatedItems}
            keyExtractor={(r) => `${r.name}-${r.program}`}
            stableRowCount={PAGE_SIZE_DEFAULT}
            emptyMessage="No generated list yet. Click Generate Assistance List."
          />
          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>
    </>
  )
}
