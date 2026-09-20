import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ReportFormat } from '../../data/mockData'

interface ReportExportMenuProps {
  onExport: (format: ReportFormat) => void
  disabled?: boolean
}

const options: { format: ReportFormat; label: string }[] = [
  { format: 'PDF', label: 'PDF Summary' },
  { format: 'EXCEL', label: 'Excel (.csv)' },
  { format: 'CSV', label: 'CSV' },
]

export function ReportExportMenu({ onExport, disabled }: ReportExportMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export As
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-1 min-w-[9rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.format}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                onExport(option.format)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
