import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium text-gray-500 sm:text-xs">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
        </div>
        {Icon && (
          <div className="shrink-0 rounded-lg bg-green-50 p-1.5 sm:p-2">
            <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
