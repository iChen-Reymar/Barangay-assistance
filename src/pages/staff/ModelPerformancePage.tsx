import { useEffect, useRef, useState } from 'react'
import { Activity, GitBranch, Loader2, RefreshCw, Sigma, Target, TriangleAlert } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { getStaffBeneficiaries, subscribeStaffBeneficiaryStorage } from '../../services/staffBeneficiaryStorage'
import { getModelInfo, isMlAvailable, retrainModels, featureLabel, type ModelInfo } from '../../services/mlService'

function variantFor(label: string) {
  if (label === 'HIGH') return 'danger' as const
  if (label === 'MEDIUM') return 'warning' as const
  return 'success' as const
}

/**
 * Reads the service state without touching React state, so callers decide
 * when (and whether) to commit it. Keeping the fetch separate from the commit
 * is what lets the mount effect stay free of synchronous setState calls.
 *
 * Module-level so effects can call it directly without needing it in their
 * dependency array, which would resubscribe them on every render.
 */
async function fetchState(): Promise<{ up: boolean; details: ModelInfo | null }> {
  const up = await isMlAvailable()
  return { up, details: up ? await getModelInfo() : null }
}

/**
 * Displays how the two supervised models are performing, so the accuracy claim
 * is something staff can check rather than something they are told. The 80%
 * figure is the target from the study; the measured value is whatever the last
 * held-out test actually produced.
 */
export default function StaffModelPerformancePage() {
  const displayUser = useStaffDisplayUser()
  const [info, setInfo] = useState<ModelInfo | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [message, setMessage] = useState('')
  const [realRecordCount, setRealRecordCount] = useState(() => getStaffBeneficiaries().length)

  useEffect(() => subscribeStaffBeneficiaryStorage(() => setRealRecordCount(getStaffBeneficiaries().length)), [])

  // Mirror of `available` for code outside render. The focus listener below is
  // installed once, so reading state inside its callback would hand it a stale
  // value from whatever render installed it.
  const availabilityRef = useRef<boolean | null>(null)

  // Mount: load once, ignoring the result if the page was already unmounted.
  useEffect(() => {
    let cancelled = false
    void fetchState().then(({ up, details }) => {
      if (cancelled) return
      availabilityRef.current = up
      setAvailable(up)
      setInfo(details)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // The check above runs only on mount, so a warning raised during a brief
  // outage would otherwise sit on screen forever even after the service came
  // back. Re-check whenever the tab returns to the foreground - but only while
  // the service looks down, so a healthy dashboard is never interrupted by a
  // background refresh.
  useEffect(() => {
    let cancelled = false

    async function handleFocus() {
      if (availabilityRef.current !== false) return
      const { up, details } = await fetchState()
      if (cancelled || !up) return
      availabilityRef.current = true
      setAvailable(true)
      setInfo(details)
      setLoading(false)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  async function load() {
    setLoading(true)
    const { up, details } = await fetchState()
    availabilityRef.current = up
    setAvailable(up)
    setInfo(details)
    setLoading(false)
  }

  async function handleRetrain() {
    setRetraining(true)
    setMessage('')
    const result = await retrainModels(getStaffBeneficiaries())
    setMessage(result.ok ? 'Models retrained on the synthetic seed plus your real records.' : result.error ?? 'Retraining failed.')
    if (result.ok) await load()
    setRetraining(false)
  }

  const blended = info?.metrics?.blended
  const accuracy = blended?.accuracy ?? null
  const meetsTarget = accuracy !== null && accuracy >= (info?.targetAccuracy ?? 0.8)

  return (
    <>
      <DashboardNavbar
        title="ML Model Performance"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking the ML service...
          </div>
        ) : available === false ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <TriangleAlert className="h-4 w-4" /> ML service is not running
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              The decision tree and logistic regression models run in a separate Python service. Start it with{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">npm run ml</code>, then reload this page.
              Until then, list generation falls back to the local rule-based scorer.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" /> Check again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Target className="h-3.5 w-3.5" /> Classification Accuracy
                </p>
                <p className={`mt-1 text-2xl font-bold ${meetsTarget ? 'text-green-600' : 'text-red-500'}`}>
                  {accuracy === null ? '—' : `${(accuracy * 100).toFixed(1)}%`}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Target {((info?.targetAccuracy ?? 0.8) * 100).toFixed(0)}% &middot; {meetsTarget ? 'met' : 'not met'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <GitBranch className="h-3.5 w-3.5" /> Decision Tree
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {info?.metrics?.decisionTree
                    ? `${(info.metrics.decisionTree.accuracy * 100).toFixed(1)}%`
                    : '—'}
                </p>
                <p className="mt-1 text-xs text-gray-400">interpretable rule paths</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Sigma className="h-3.5 w-3.5" /> Logistic Regression
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {info?.metrics?.logisticRegression
                    ? `${(info.metrics.logisticRegression.accuracy * 100).toFixed(1)}%`
                    : '—'}
                </p>
                <p className="mt-1 text-xs text-gray-400">per-factor contributions</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Activity className="h-3.5 w-3.5" /> Training Samples
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{info?.summary?.samples ?? '—'}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {info?.summary ? `${info.summary.trainSize} train / ${info.summary.testSize} test` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-sm text-gray-500">
                Last trained {info?.trainedAt ? new Date(info.trainedAt).toLocaleString() : 'never'}.
                Your store holds <strong className="text-gray-900">{realRecordCount}</strong> beneficiary record
                {realRecordCount === 1 ? '' : 's'}.
              </div>
              <Button onClick={() => void handleRetrain()} disabled={retraining}>
                {retraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {retraining ? 'Retraining...' : 'Retrain Models'}
              </Button>
            </div>
            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
            )}

            {blended && (
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-900">Blended Model &mdash; Confusion Matrix</h2>
                <p className="mb-4 text-xs text-gray-500">
                  Rows are the actual classes, columns are the predictions. The diagonal is every household the models got
                  right; anything off the diagonal is a misclassification.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                        <th className="px-3 py-2">Actual \ Predicted</th>
                        {blended.confusionMatrix.labels.map((label) => (
                          <th key={label} className="px-3 py-2">{label}</th>
                        ))}
                        <th className="px-3 py-2">Recall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blended.confusionMatrix.rows.map((row, rowIndex) => {
                        const total = row.reduce((sum, value) => sum + value, 0) || 1
                        const label = blended.confusionMatrix.labels[rowIndex]
                        return (
                          <tr key={label} className="border-b border-gray-50">
                            <td className="px-3 py-2"><Badge variant={variantFor(label)}>{label}</Badge></td>
                            {row.map((value, colIndex) => {
                              const isDiagonal = rowIndex === colIndex
                              return (
                                <td
                                  key={colIndex}
                                  className={`px-3 py-2 text-center font-medium ${isDiagonal ? 'text-green-600' : value > 0 ? 'text-red-400' : 'text-gray-300'}`}
                                >
                                  {value}
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 text-center text-gray-600">
                              {((row[rowIndex] / total) * 100).toFixed(0)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-900">What the Decision Tree learned</h2>
                <p className="mb-3 text-xs text-gray-500">
                  Each rule is one path from the tree's root to a leaf. The models apply these in order.
                </p>
                <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                  {(info?.decisionTreeRules ?? []).map((rule) => (
                    <li key={rule} className="rounded bg-gray-50 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-gray-700">
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-900">Feature influence</h2>
                <p className="mb-3 text-xs text-gray-500">
                  How much each factor moved the models. Higher means the feature mattered more to the outcome.
                </p>
                <ul className="space-y-2">
                  {(info?.featureImportance ?? []).slice(0, 8).map((item) => {
                    const max = Math.max(0.0001, info?.featureImportance?.[0]?.importance ?? 1)
                    return (
                      <li key={item.feature}>
                        <div className="mb-0.5 flex items-center justify-between text-xs">
                          <span className="text-gray-700">{featureLabel(item.feature)}</span>
                          <span className="text-gray-500">{(item.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(item.importance / max) * 100}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
