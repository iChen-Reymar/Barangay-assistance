interface DonutChartProps {
  high: number
  medium: number
  low: number
  total: number
}

export function DonutChart({ high, medium, low, total }: DonutChartProps) {
  const sum = high + medium + low
  const highPct = (high / sum) * 100
  const mediumPct = (medium / sum) * 100
  const lowPct = (low / sum) * 100

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeDasharray={`${(highPct / 100) * 251.2} 251.2`}
            strokeDashoffset="0"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
            strokeDasharray={`${(mediumPct / 100) * 251.2} 251.2`}
            strokeDashoffset={`-${(highPct / 100) * 251.2}`}
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#22c55e"
            strokeWidth="16"
            strokeDasharray={`${(lowPct / 100) * 251.2} 251.2`}
            strokeDashoffset={`-${((highPct + mediumPct) / 100) * 251.2}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">Total Families</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-gray-600">High Risk: {high} ({highPct.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-gray-600">Medium Risk: {medium} ({mediumPct.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Low Risk: {low} ({lowPct.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  )
}
