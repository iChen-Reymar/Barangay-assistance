import type { ChartSegment } from '../../types/charts'

interface SegmentDonutChartProps {
  segments: ChartSegment[]
  centerValue: number | string
  centerLabel: string
}

const CIRCUMFERENCE = 251.2

/**
 * Cumulative start offset for each segment.
 *
 * Computed up front rather than accumulated while rendering, because mutating
 * a variable inside a render is unsafe: React may re-invoke the component and
 * the second pass would start from the wrong offset, drawing overlapping arcs.
 */
function offsetForSegments(segments: ChartSegment[], safeTotal: number) {
  let running = 0
  return segments.map((segment) => {
    const start = running
    running += (segment.value / safeTotal) * CIRCUMFERENCE
    return start
  })
}

export function SegmentDonutChart({ segments, centerValue, centerLabel }: SegmentDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const safeTotal = total || 1
  const offsets = offsetForSegments(segments, safeTotal)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          {segments.map((segment, index) => {
            const pct = (segment.value / safeTotal) * 100
            const dash = (pct / 100) * CIRCUMFERENCE
            return (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
                strokeDashoffset={`-${offsets[index]}`}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span className="text-2xl font-bold text-gray-900">{centerValue}</span>
          <span className="text-xs text-gray-500">{centerLabel}</span>
        </div>
      </div>

      <div className="w-full space-y-2 text-sm sm:w-auto">
        {segments.map((segment) => {
          const pct = ((segment.value / safeTotal) * 100).toFixed(1)
          return (
            <div key={segment.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-gray-600">
                {segment.label}: {segment.value} ({pct}%)
              </span>
            </div>
          )
        })}
        {total === 0 && (
          <p className="text-xs text-gray-400">No data available for this chart.</p>
        )}
      </div>
    </div>
  )
}
