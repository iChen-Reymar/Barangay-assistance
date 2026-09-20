import { Eye, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { TableActionsCell } from '../ui/TableActionsCell'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'

const compactBtn = 'shrink-0 !px-2 !py-1 text-xs'

interface AssistanceRequestRowActionsProps {
  item: ReviewableAssistanceItem
  onView: (item: ReviewableAssistanceItem) => void
  onApprove: (item: ReviewableAssistanceItem) => void
  onReject: (item: ReviewableAssistanceItem) => void
  onOverride?: (item: ReviewableAssistanceItem) => void
  showTextDetails?: boolean
}

function canReview(status: RequestStatus) {
  return status === 'PENDING' || status === 'UNDER REVIEW'
}

export function AssistanceRequestRowActions({
  item,
  onView,
  onApprove,
  onReject,
  onOverride,
  showTextDetails = true,
}: AssistanceRequestRowActionsProps) {
  const reviewable = canReview(item.status)

  return (
    <TableActionsCell>
      {showTextDetails ? (
        <button
          type="button"
          onClick={() => onView(item)}
          className="shrink-0 rounded px-1.5 py-1 text-xs font-medium text-primary hover:bg-green-50"
        >
          Details
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onView(item)}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
        aria-label="View details"
      >
        <Eye className="h-4 w-4" />
      </button>
      {reviewable ? (
        <>
          <Button size="sm" className={compactBtn} onClick={() => onApprove(item)}>
            Approve
          </Button>
          <Button size="sm" variant="outline" className={compactBtn} onClick={() => onReject(item)}>
            Reject
          </Button>
        </>
      ) : null}
      {item.decisions.length > 0 && onOverride ? (
        <button
          type="button"
          onClick={() => onOverride(item)}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-orange-600"
          aria-label="Override decision"
          title="Override"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      ) : null}
    </TableActionsCell>
  )
}
