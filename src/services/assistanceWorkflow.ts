import type { RequestStatus } from '../data/mockData'

export function listGenerationTransitionError(status: RequestStatus): string | null {
  if (status === 'UNDER REVIEW') return null
  if (status === 'PENDING') return 'A request must enter Staff review before its final list can be generated.'
  if (status === 'LIST GENERATED') return 'The final assistance list has already been generated.'
  return 'A finalized assistance request cannot generate another list.'
}
