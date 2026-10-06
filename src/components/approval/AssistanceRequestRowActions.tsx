import { Eye } from 'lucide-react'
import { TableActionsCell } from '../ui/TableActionsCell'
import type { ReviewableAssistanceItem } from '../../types/approval'

interface AssistanceRequestRowActionsProps {
  item: ReviewableAssistanceItem
  onView: (item: ReviewableAssistanceItem) => void
  onApprove?: (item: ReviewableAssistanceItem) => void
  onReject?: (item: ReviewableAssistanceItem) => void
  showTextDetails?: boolean
}

export function AssistanceRequestRowActions({
  item: _item,
  onView,
  showTextDetails = true,
}: AssistanceRequestRowActionsProps) {
  return (
    <TableActionsCell>
      {showTextDetails ? (
        <button
          type="button"
          onClick={() => onView(_item)}
          className="shrink-0 rounded px-1.5 py-1 text-xs font-medium text-primary hover:bg-green-50"
        >
          Details
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onView(_item)}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
        aria-label="View details"
      >
        <Eye className="h-4 w-4" />
      </button>
    </TableActionsCell>
  )
}
