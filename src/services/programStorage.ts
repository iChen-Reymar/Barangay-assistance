import { seedPrograms, type AssistanceProgram, type ProgramStatus } from '../data/programsMockData'

const PROGRAMS_KEY = 'barangay_assistance_programs'
const UPDATED_EVENT = 'program-storage-updated'

function readPrograms(): AssistanceProgram[] {
  const raw = localStorage.getItem(PROGRAMS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AssistanceProgram[]
  } catch {
    return []
  }
}

function writePrograms(programs: AssistanceProgram[]) {
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function initializeProgramStorage() {
  if (!localStorage.getItem(PROGRAMS_KEY)) {
    writePrograms(seedPrograms)
  }
}

export function getPrograms(): AssistanceProgram[] {
  initializeProgramStorage()
  return readPrograms()
}

export function getActivePrograms(): AssistanceProgram[] {
  return getPrograms().filter((program) => program.status === 'ACTIVE')
}

export function getActiveProgramNames(): string[] {
  return getActivePrograms().map((program) => program.name)
}

export function getProgramById(id: string): AssistanceProgram | null {
  return getPrograms().find((program) => program.id === id) ?? null
}

export function savePrograms(programs: AssistanceProgram[]) {
  writePrograms(programs)
}

export function upsertProgram(program: AssistanceProgram) {
  const programs = readPrograms()
  const index = programs.findIndex((row) => row.id === program.id)
  if (index === -1) {
    writePrograms([program, ...programs])
    return program
  }
  const next = [...programs]
  next[index] = program
  writePrograms(next)
  return program
}

export function updateProgramStatus(id: string, status: ProgramStatus): AssistanceProgram | null {
  const programs = readPrograms()
  const index = programs.findIndex((row) => row.id === id)
  if (index === -1) return null
  const updated = { ...programs[index], status }
  const next = [...programs]
  next[index] = updated
  writePrograms(next)
  return updated
}

export function subscribeProgramStorage(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}
