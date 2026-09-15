import type { ReactNode } from 'react'

interface PageMainProps {
  children: ReactNode
  className?: string
}

export function PageMain({ children, className = '' }: PageMainProps) {
  return (
    <main className={`flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 ${className}`.trim()}>
      {children}
    </main>
  )
}
