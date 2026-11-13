export function shouldRetrySynchronization(status?: number) {
  if (status === undefined) return true
  return status === 408 || status === 429 || status >= 500
}
