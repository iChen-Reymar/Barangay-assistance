import { useCallback, useMemo, useState } from 'react'

export const PAGE_SIZE_DEFAULT = 6
export const PAGE_SIZE_AUDIT = 10

export function formatPaginationShowing(
  totalItems: number,
  currentPage: number,
  pageSize: number,
  itemLabel = 'entries',
): string {
  if (totalItems === 0) return `Showing 0 ${itemLabel}`
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  return `Showing ${start} to ${end} of ${totalItems} ${itemLabel}`
}

export function usePagination<T>(
  items: T[],
  pageSize: number,
  resetKey = '',
  itemLabel = 'entries',
) {
  const [page, setPage] = useState(1)
  // Tracks the key the current page was computed against, so a change of key
  // or page size can restart from page 1 during render instead of in an effect.
  const [pageContext, setPageContext] = useState({ resetKey, pageSize })

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (pageContext.resetKey !== resetKey || pageContext.pageSize !== pageSize) {
    setPageContext({ resetKey, pageSize })
    setPage(1)
  }

  // Clamp at the point of assignment rather than in a follow-up effect: if the
  // list shrinks, the page can no longer be past the end.
  const setCurrentPage = useCallback(
    (value: number | ((previous: number) => number)) => {
      setPage((previous) => {
        const next = typeof value === 'function' ? value(previous) : value
        return Math.max(1, Math.min(next, totalPages))
      })
    },
    [totalPages],
  )

  const currentPage = Math.min(page, totalPages)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  const showing = formatPaginationShowing(totalItems, currentPage, pageSize, itemLabel)

  return {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedItems,
    showing,
    setCurrentPage,
  }
}

export type PageToken = number | 'ellipsis'

export function getVisiblePageNumbers(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: PageToken[] = [1]
  if (currentPage > 3) pages.push('ellipsis')

  const rangeStart = Math.max(2, currentPage - 1)
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1)
  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    pages.push(page)
  }

  if (currentPage < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}
