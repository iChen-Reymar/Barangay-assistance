export const memberPositions = [
  { value: 'PRESIDENT', label: 'President' },
  { value: 'VICE PRESIDENT', label: 'Vice President' },
  { value: 'SECRETARY', label: 'Secretary' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'P.I.O', label: 'P.I.O' },
  { value: 'SGT. AT ARMS', label: 'Sgt. at Arms' },
  { value: 'SOCIAL MANAGER', label: 'Social Manager' },
  { value: 'MEMBER', label: 'Member' },
] as const

export type MemberPositionValue = (typeof memberPositions)[number]['value']

export function memberPositionLabel(value?: string) {
  const normalized = value?.trim().toUpperCase()
  return memberPositions.find((item) => item.value === normalized)?.label ?? (value?.trim() || 'Member')
}

export function splitMemberPosition(member: { position?: string; notes?: string }) {
  const notes = member.notes?.trim() ?? ''
  const prefix = notes.match(/^Position:\s*/i)
  let position = member.position?.trim().toUpperCase() ?? ''
  let remainder = notes

  if (prefix) {
    const rest = notes.slice(prefix[0].length)
    const found = memberPositions.find((item) => rest.toUpperCase().startsWith(item.value))
    if (found) {
      if (!position) position = found.value
      remainder = rest.slice(found.value.length).replace(/^\.\s*/, '').trim()
    }
  }

  if (!memberPositions.some((item) => item.value === position)) position = 'MEMBER'
  return { position, notes: remainder || undefined }
}
