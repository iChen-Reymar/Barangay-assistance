export const processFlowSteps = [
  'DATA',
  'VULNERABILITY ASSESSMENT',
  'AI RECOMMENDATION',
  'PROGRAM MATCHING',
  'OFFICIAL REVIEW',
  'APPROVAL',
  'ASSISTANCE',
]

export function ProcessFlowBanner() {
  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Assistance Decision Flow
      </p>
      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600">
        {processFlowSteps.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span className="font-medium text-gray-800">{step}</span>
            {i < processFlowSteps.length - 1 && <span className="text-gray-400">→</span>}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        AI provides decision-support recommendations only. Final approval is reserved for authorized barangay officials.
      </p>
    </div>
  )
}
