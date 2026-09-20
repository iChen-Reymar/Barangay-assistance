import type { ReactNode } from 'react'

interface TableActionsCellProps {
  children: ReactNode
}

/** Single-line action toolbar so paginated rows keep the same height on every page. */
export function TableActionsCell({ children }: TableActionsCellProps) {
  return (
    <div className="flex h-10 w-full min-w-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:thin]">
      {children}
    </div>
  )
}
