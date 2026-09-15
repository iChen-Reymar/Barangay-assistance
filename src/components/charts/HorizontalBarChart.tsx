import type { BarChartItem } from '../../types/charts'

interface HorizontalBarChartProps {
  items: BarChartItem[]
  maxValue?: number
  emptyMessage?: string
}

const defaultColors = ['#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function HorizontalBarChart({
  items,
  maxValue,
  emptyMessage = 'No data available.',
}: HorizontalBarChartProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">{emptyMessage}</p>
  }

  const peak = maxValue ?? Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const width = Math.max((item.value / peak) * 100, item.value > 0 ? 4 : 0)
        const color = item.color ?? defaultColors[index % defaultColors.length]

        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-gray-700" title={item.label}>
                {item.label}
              </span>
              <span className="shrink-0 font-semibold text-gray-900">
                {item.value}
                {item.suffix ?? ''}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
