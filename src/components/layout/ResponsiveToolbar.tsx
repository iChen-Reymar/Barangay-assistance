import type { ReactNode } from 'react'

interface ResponsiveToolbarProps {
  children: ReactNode
  className?: string
}

export function ResponsiveToolbar({ children, className = '' }: ResponsiveToolbarProps) {
  return (
    <div
      className={`flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-5 ${className}`.trim()}
    >
      {children}
    </div>
  )
}
