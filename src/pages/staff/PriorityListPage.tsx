import { useEffect, useMemo, useState } from 'react'
import { FileDown, Sparkles, Loader2, GitBranch, Sigma, AlertTriangle } from 'lucide-react'
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
  generateAssistanceListAsync,
  getGeneratedAssistanceList,
  subscribeGeneratedAssistanceList,
  type GeneratedAssistanceRow,
} from '../../services/aiProcessing'
import { featureLabel } from '../../services/mlService'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { getPrograms, subscribeProgramStorage } from '../../services/programStorage'

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
  const header = ['Rank', 'Name', 'Association', 'Score', 'Classification', 'Program', 'Verification', 'Scored By', 'Decision Tree', 'Logistic Regression']
  const lines = rows.map((row) =>
    [
      row.rank,
      row.name,
      row.association,
      row.score,
      row.classification,
      row.program,
      row.verification,
      row.engine === 'ml' ? 'ML Models' : 'Local Rules',
      row.decisionTreePrediction ?? '',
      row.logisticRegressionPrediction ?? '',
    ]
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
  const [associations, setAssociations] = useState(() => getAssociations())
  const [programs, setPrograms] = useState(() => getPrograms())
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<GeneratedAssistanceRow | null>(null)

  // Filters must offer every registered association and program, not only the
  // ones that happen to appear in a generated list - otherwise the dropdown is
  // empty until a list has been generated. Rows still contribute their values
  // so a beneficiary tied to an unregistered association stays filterable.
  const associationOptions = [
    'All Associations',
    ...new Set([...associations.map((row) => row.name), ...source.map((row) => row.association)]),
  ]
  const programOptions = [
    'All Programs',
    ...new Set([...programs.map((row) => row.name), ...source.map((row) => row.program)]),
  ]

  useEffect(() => subscribeGeneratedAssistanceList(() => setSource(getGeneratedAssistanceList())), [])
  useEffect(() => subscribeAssociationStorage(() => setAssociations(getAssociations())), [])
  useEffect(() => subscribeProgramStorage(() => setPrograms(getPrograms())), [])
  const [classification, setClassification] = useState('All Classifications')
  const [association, setAssociation] = useState('All Associations')
  const [program, setProgram] = useState('All Programs')

  async function handleGenerate() {
    setGenerating(true)
    try {
      setSource(await generateAssistanceListAsync())
    } finally {
      setGenerating(false)
    }
  }

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
    {
      key: 'scoredBy',
      header: 'Scored By',
      render: (r) =>
        r.engine === 'ml' ? (
          <button
            type="button"
            onClick={() => setSelected(r)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            title="View how the models reached this score"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {r.modelAgreement ? 'ML Models' : 'ML Models (disagree)'}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Local Rules
          </span>
        ),
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
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Scoring with ML models...' : 'Generate Assistance List'}
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
                options={associationOptions}
                value={association}
                onChange={setAssociation}
              />
              <Filter label="Program" options={programOptions} value={program} onChange={setProgram} />
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
        {selected && <ScoreExplanation row={selected} onClose={() => setSelected(null)} />}
      </main>
    </>
  )
}

/**
 * The transparency panel. Shows what the decision tree's rule path was, and how
 * much each feature moved logistic regression's answer, so an official can
 * justify the score to a resident instead of just quoting it.
 */
function ScoreExplanation({ row, onClose }: { row: GeneratedAssistanceRow; onClose: () => void }) {
  const contributions = (row.logisticContributions ?? []).filter((c) => c.contribution !== 0).slice(0, 6)
  const maxMagnitude = Math.max(1, ...contributions.map((c) => Math.abs(c.contribution)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">{row.name}</h2>
            <p className="text-sm text-gray-500">
              Score {row.score} / 100 &middot; <Badge variant={vulnerabilityVariant(row.classification)}>{row.classification}</Badge>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            &times;
          </button>
        </div>

        {!row.modelAgreement && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              The two models disagreed on this household. The decision tree read it as{' '}
              <strong>{row.decisionTreePrediction}</strong> and logistic regression read it as{' '}
              <strong>{row.logisticRegressionPrediction}</strong>. The more vulnerable of the two readings was used, which
              is the safer direction for a household needing aid.
            </p>
          </div>
        )}

        <section className="mb-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <GitBranch className="h-4 w-4 text-primary" />
            Decision Tree &mdash; rule path followed
          </h3>
          {row.decisionTreePath?.length ? (
            <ol className="space-y-1.5">
              {row.decisionTreePath.map((step, index) => (
                <li key={`${step.feature}-${index}`} className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-400">{index + 1}</span>
                  <span className="text-gray-700">
                    {featureLabel(step.feature)} {step.operator} {step.threshold}
                  </span>
                  <span className="text-gray-400">
                    (actual {step.actualValue}) &rarr; {step.passed ? 'passed' : 'failed'}
                  </span>
                </li>
              ))}
              <li className="pl-8 pt-1 text-xs font-semibold text-gray-900">
                &rArr; classified {row.decisionTreePrediction}
              </li>
            </ol>
          ) : (
            <p className="text-sm text-gray-500">No rule path recorded for this row.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sigma className="h-4 w-4 text-primary" />
            Logistic Regression &mdash; factors pushing the score up or down
          </h3>
          {contributions.length ? (
            <ul className="space-y-2">
              {contributions.map((item) => {
                const width = Math.round((Math.abs(item.contribution) / maxMagnitude) * 100)
                const positive = item.contribution > 0
                return (
                  <li key={item.feature}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="text-gray-700">{featureLabel(item.feature)}</span>
                      <span className={positive ? 'font-medium text-red-500' : 'font-medium text-green-600'}>
                        {positive ? '+' : ''}{item.contribution.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${positive ? 'bg-red-400' : 'bg-green-400'}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                )
              })}
              <li className="pt-1 text-xs text-gray-500">
                Class predicted: <strong className="text-gray-900">{row.logisticRegressionPrediction}</strong>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No contribution data recorded for this row.</p>
          )}
        </section>

        {row.factors?.length ? (
          <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
            Household profile used: {row.factors.join(', ')}.
          </p>
        ) : null}
      </div>
    </div>
  )
}
