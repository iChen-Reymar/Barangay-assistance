import { useEffect, useMemo, useState } from 'react'
import { FileDown, Sparkles, Loader2, GitBranch, Sigma, AlertTriangle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { Pagination } from '../../components/ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import type { AssociationMember, MemberAttachment } from '../../data/associationMockData'
import type { StaffBeneficiary, VulnerabilityLevel, VerificationStatus } from '../../data/staffMockData'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import {
  generateAssistanceListFor,
  getGeneratedAssistanceList,
  subscribeGeneratedAssistanceList,
  type GeneratedAssistanceRow,
} from '../../services/aiProcessing'
import { featureLabel } from '../../services/mlService'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { getAssociationMembers, subscribeMemberStorage } from '../../services/memberStorage'
import { getPrograms, subscribeProgramStorage } from '../../services/programStorage'
import {
  getAssistanceItems,
  getItemById,
  markAssistanceListGenerated,
  markAssistanceUnderReview,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import { getStaffBeneficiaries, subscribeStaffBeneficiaryStorage } from '../../services/staffBeneficiaryStorage'
import { synchronizeRecordNow, waitForDatabaseSynchronization } from '../../services/databaseSync'
import { listGenerationTransitionError } from '../../services/assistanceWorkflow'

const REVIEWABLE_ITEMS_KEY = 'barangay_reviewable_items'

type PriorityItem = Omit<GeneratedAssistanceRow, 'score' | 'verification'> & {
  score: number | null
  verification: VerificationStatus
  documentEligible: boolean
  member: AssociationMember
}

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function documentWasSubmitted(file?: MemberAttachment) {
  return Boolean(file?.dataUrl?.trim()) && file?.status === 'verified'
}

function memberEligibleForList(member: AssociationMember) {
  if (member.staffVerified) return true
  return documentWasSubmitted(member.barangayCertificate) && documentWasSubmitted(member.governmentId)
}

function completeAssessment(beneficiary: StaffBeneficiary) {
  return beneficiary.verification === 'VERIFIED'
    && beneficiary.familySize > 0
    && beneficiary.monthlyIncome > 0
    && beneficiary.workingHouseholdMembers !== undefined
    && (beneficiary.age ?? 0) > 0
    && Boolean(beneficiary.employmentStatus?.trim())
    && Boolean(beneficiary.housingCondition?.trim())
}

function findAssessment(assessments: StaffBeneficiary[], member: AssociationMember) {
  return assessments.find((beneficiary) => beneficiary.memberId === member.id)
    ?? assessments.find((beneficiary) => beneficiary.id === member.id)
}

function unscoredMember(member: AssociationMember, associationName: string, assessment?: StaffBeneficiary): PriorityItem {
  return {
    id: member.id,
    beneficiaryId: member.id,
    rank: 0,
    name: member.name.trim(),
    association: associationName,
    score: null,
    classification: member.vulnerability,
    program: '—',
    verification: assessment?.verification ?? 'PENDING',
    reason: '',
    generatedAt: '',
    documentEligible: memberEligibleForList(member),
    member,
  }
}

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

function downloadList(rows: PriorityItem[]) {
  const header = ['Rank', 'Name', 'Association', 'Score', 'Classification', 'Program', 'Document Eligibility', 'Scored By', 'Decision Tree', 'Logistic Regression']
  const lines = rows.map((row) =>
    [
      row.rank,
      row.name,
      row.association,
      row.score ?? '',
      row.classification,
      row.program,
      row.documentEligible ? 'ELIGIBLE' : 'DOCUMENTS REQUIRED',
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
  const [members, setMembers] = useState<AssociationMember[]>(() => getAssociationMembers())
  const [assessed, setAssessed] = useState<StaffBeneficiary[]>(() => getStaffBeneficiaries())
  const [requests, setRequests] = useState(() => getAssistanceItems())
  const [associations, setAssociations] = useState(() => getAssociations())
  const [programs, setPrograms] = useState(() => getPrograms())
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<GeneratedAssistanceRow | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [generationMessage, setGenerationMessage] = useState('')

  const associationOptions = [
    'All Associations',
    ...new Set([
      ...associations.map((row) => row.name),
      ...members.map((row) => row.associationName?.trim() || ''),
    ].filter((name) => name && name !== 'Unassigned')),
  ]
  const programOptions = ['All Programs', ...new Set(programs.map((row) => row.name).filter(Boolean))]

  useEffect(() => subscribeGeneratedAssistanceList(() => setSource(getGeneratedAssistanceList())), [])
  useEffect(() => subscribeMemberStorage(() => setMembers(getAssociationMembers())), [])
  useEffect(() => subscribeStaffBeneficiaryStorage(() => setAssessed(getStaffBeneficiaries())), [])
  useEffect(() => subscribeDecisionStorage(() => setRequests(getAssistanceItems())), [])
  useEffect(() => subscribeAssociationStorage(() => setAssociations(getAssociations())), [])
  useEffect(() => subscribeProgramStorage(() => setPrograms(getPrograms())), [])
  const [classification, setClassification] = useState('All Classifications')
  const [association, setAssociation] = useState('All Associations')
  const [program, setProgram] = useState('All Programs')

  function membersOnAssociations(associationName: string) {
    return getAssociationMembers().filter((member) => {
      const belongsTo = member.associationName?.trim() ?? ''
      if (!member.name.trim() || !belongsTo || !memberEligibleForList(member)) return false
      if (associationName === 'All Associations') return true
      return sameAssociation(belongsTo, associationName)
    })
  }

  async function handleGenerate() {
    const request = requests.find((item) => item.id === selectedRequestId)
    if (!request) {
      setGenerationMessage('Select an assistance request before generating a list.')
      return
    }
    setGenerating(true)
    setGenerationMessage('')
    try {
      const requestDocuments = request.documents ?? []
      const qualifications = request.qualifications ?? []
      const unverifiedDocuments = requestDocuments.filter((document) => document.status !== 'verified')
      const incompleteQualifications = qualifications.filter(
        (check) => check.status !== 'passed' && check.status !== 'not_applicable',
      )
      const requestDocumentsReady = requestDocuments.length > 0 && unverifiedDocuments.length === 0
      const qualificationsReady = qualifications.length > 0 && incompleteQualifications.length === 0
      if (!requestDocumentsReady || !qualificationsReady) {
        const blockers = [
          requestDocuments.length === 0
            ? 'No request documents are attached.'
            : unverifiedDocuments.length > 0
              ? `${unverifiedDocuments.length} request document${unverifiedDocuments.length === 1 ? '' : 's'} still need verification.`
              : '',
          qualifications.length === 0
            ? 'No qualification checks are configured.'
            : incompleteQualifications.length > 0
              ? `${incompleteQualifications.length} qualification check${incompleteQualifications.length === 1 ? '' : 's'} are incomplete.`
              : '',
        ].filter(Boolean)
        setGenerationMessage(blockers.join(' '))
        return
      }
      let reviewedRequest = getItemById(request.id)
      if (reviewedRequest?.status === 'PENDING') {
        reviewedRequest = markAssistanceUnderReview(request.id)
      }
      if (!reviewedRequest) throw new Error('The selected assistance request is no longer available.')
      const transitionError = listGenerationTransitionError(reviewedRequest.status)
      if (transitionError) throw new Error(transitionError)

      // Do not start ML processing until Supabase has accepted the Staff-review
      // transition. This prevents an asynchronous PENDING -> LIST GENERATED write.
      await synchronizeRecordNow(REVIEWABLE_ITEMS_KEY, reviewedRequest.id, reviewedRequest)

      const roster = membersOnAssociations(request.association)
      const eligibleMembers = new Set(roster.map((member) => member.id))
      const measured = assessed.filter(
        (beneficiary) => sameAssociation(beneficiary.association, request.association)
          && completeAssessment(beneficiary)
          && eligibleMembers.has(beneficiary.memberId || beneficiary.id),
      )
      if (measured.length === 0) {
        setGenerationMessage('No members are ready. Open Verify Qualification and mark a member qualification as verified.')
        return
      }
      setAssociation(request.association)
      setProgram(request.program || request.requestType)
      const scoreable = measured.map((beneficiary) => ({
        ...beneficiary,
        id: beneficiary.memberId || beneficiary.id,
      }))
      const generatedList = await generateAssistanceListFor(scoreable, {
        requestId: request.id,
        programName: request.program || request.requestType,
      })
      const requestRows = generatedList.filter((row) => row.requestId === request.id)
      if (!requestRows.length || requestRows.some((row) => row.engine !== 'ml')) {
        throw new Error('The ML service did not produce a complete final list. The request status was not changed.')
      }
      setSource(generatedList)
      const finalizedRequest = markAssistanceListGenerated(request.id)
      if (!finalizedRequest || finalizedRequest.status !== 'LIST GENERATED') {
        throw new Error('The request could not be finalized because it has not completed Staff review.')
      }
      await waitForDatabaseSynchronization(REVIEWABLE_ITEMS_KEY)
      setGenerationMessage(`Final prioritized list generated for ${requestRows.length} household${requestRows.length === 1 ? '' : 's'} in request ${request.id}.`)
    } catch (error) {
      setGenerationMessage(error instanceof Error ? error.message : 'Unable to generate the final prioritized list.')
    } finally {
      setGenerating(false)
    }
  }

  const rosterForSelection = useMemo(() => {
    return members.filter((member) => {
      const belongsTo = member.associationName?.trim() ?? ''
      if (!member.name.trim() || !belongsTo) return false
      if (association === 'All Associations') return true
      return sameAssociation(belongsTo, association)
    })
  }, [association, members])

  const generated = useMemo(() => {
    const relevantSource = selectedRequestId ? source.filter((row) => row.requestId === selectedRequestId) : []
    const scoreById = new Map(relevantSource.map((row) => [row.beneficiaryId, row]))
    const rows: PriorityItem[] = rosterForSelection.map((member) => {
      const scored = scoreById.get(member.id)
      const associationName = member.associationName?.trim() || 'Unassigned'
      const assessment = findAssessment(assessed, member)
      if (!scored) return unscoredMember(member, associationName, assessment)
      return {
        ...scored,
        association: associationName,
        documentEligible: memberEligibleForList(member),
        member,
      }
    })

    return rows
      .filter((row) => {
        const classificationMatch =
          classification === 'All Classifications' ||
          row.classification === classification.replace(' Risk', '').toUpperCase()
        const associationMatch = association === 'All Associations' || sameAssociation(row.association, association)
        const programMatch = program === 'All Programs' || row.program === '—' || sameAssociation(row.program, program)
        return classificationMatch && associationMatch && programMatch
      })
      .sort((a, b) => {
        if (a.score == null && b.score == null) return a.name.localeCompare(b.name)
        if (a.score == null) return 1
        if (b.score == null) return -1
        return b.score - a.score || a.name.localeCompare(b.name)
      })
      .map((row, index) => ({ ...row, rank: index + 1 }))
  }, [association, assessed, classification, program, rosterForSelection, selectedRequestId, source])

  const selectedRequest = requests.find((item) => item.id === selectedRequestId)
  const readyMemberCount = selectedRequest
    ? membersOnAssociations(selectedRequest.association).filter((member) => {
        const assessment = findAssessment(assessed, member)
        return Boolean(assessment && completeAssessment(assessment))
      }).length
    : 0

  const pagination = usePagination(generated, PAGE_SIZE_DEFAULT, `${classification}-${association}-${program}`, 'records')

  const columns: Column<PriorityItem>[] = [
    { key: 'rank', header: 'Rank', render: (r) => <span className="font-bold text-gray-900">{r.rank}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'association', header: 'Association' },
    {
      key: 'score',
      header: 'Vulnerability Score',
      render: (r) =>
        r.score == null ? (
          <span className="text-sm text-gray-400">Not scored</span>
        ) : (
          <span className={r.score >= 80 ? 'font-semibold text-red-500' : r.score >= 50 ? 'text-orange-500' : 'text-green-600'}>
            {r.score} / 100
          </span>
        ),
    },
    {
      key: 'classification',
      header: 'Classification',
      render: (r) => r.score == null
        ? <Badge variant="neutral">AWAITING AI</Badge>
        : <Badge variant={vulnerabilityVariant(r.classification)}>{r.classification}</Badge>,
    },
    { key: 'program', header: 'Program' },
    {
      key: 'documentEligibility',
      header: 'Document Eligibility',
      render: (r) => (
        <Badge variant={r.documentEligible ? 'success' : 'warning'}>
          {r.documentEligible ? 'ELIGIBLE' : 'DOCUMENTS REQUIRED'}
        </Badge>
      ),
    },
    {
      key: 'scoredBy',
      header: 'Scored By',
      render: (r) =>
        r.score == null ? (
          <span className="text-xs text-gray-400">Not scored</span>
        ) : r.engine === 'ml' ? (
          <button
            type="button"
            onClick={() => setSelected({ ...r, score: r.score as number, verification: 'VERIFIED' })}
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
            Members are prepared for ML scoring in Verify Qualification. Select a request, then generate its prioritized assistance list.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Request
              <select
                value={selectedRequestId}
                onChange={(event) => {
                  const id = event.target.value
                  setSelectedRequestId(id)
                  const request = requests.find((item) => item.id === id)
                  if (request) {
                    setAssociation(request.association)
                    setProgram(request.program || request.requestType)
                  }
                }}
                className="ml-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal normal-case text-gray-900"
              >
                <option value="">Select request...</option>
                {requests.filter((item) => item.status === 'PENDING' || item.status === 'UNDER REVIEW').map((item) => (
                  <option key={item.id} value={item.id}>{item.id} — {item.association} — {item.program || item.requestType}</option>
                ))}
              </select>
            </label>
          <Button onClick={handleGenerate} disabled={generating || !selectedRequestId || readyMemberCount === 0}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Scoring with ML models...' : 'Generate Assistance List'}
          </Button>
          </div>
        </div>
        {generationMessage ? (
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{generationMessage}</p>
        ) : null}
        {selectedRequestId && readyMemberCount === 0 ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Verify at least one eligible member in Verify Qualification to enable generation.
          </p>
        ) : null}
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
            keyExtractor={(r) => r.member.id}
            stableRowCount={PAGE_SIZE_DEFAULT}
            emptyMessage={
              rosterForSelection.length === 0
                ? association === 'All Associations'
                  ? 'No members have submitted both a barangay certification and a valid ID yet.'
                  : `No members of ${association} have submitted both a barangay certification and a valid ID yet.`
                : `No members of ${association === 'All Associations' ? 'these associations' : association} match these filters.`
            }
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
