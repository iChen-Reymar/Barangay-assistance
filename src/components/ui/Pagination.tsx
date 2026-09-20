import { getVisiblePageNumbers } from '../../hooks/usePagination'

export interface PaginationProps {
  showing: string
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ showing, currentPage, totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-xs text-gray-500 sm:text-left sm:text-sm">{showing}</p>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
        >
          Previous
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-400">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
        <span className="px-2 text-xs text-gray-500 sm:hidden">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}
