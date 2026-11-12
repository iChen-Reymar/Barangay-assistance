export function normalizeHousingCondition(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'temporary' || normalized === 'temporary/salvaged') return 'Renter'
  return value
}
