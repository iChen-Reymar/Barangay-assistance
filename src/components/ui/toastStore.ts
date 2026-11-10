export type ToastTone = 'success' | 'error'

export type ToastItem = {
  id: number
  title?: string
  message: string
  tone: ToastTone
}

type ToastStore = {
  listeners: Set<(toast: ToastItem) => void>
  nextId: number
}

export const toastStore: ToastStore = ((globalThis as { __barangayToast?: ToastStore }).__barangayToast ??= {
  listeners: new Set(),
  nextId: 1,
})

export function showToast(message: string, tone: ToastTone = 'success', title?: string) {
  const toast = { id: toastStore.nextId, title, message, tone }
  toastStore.nextId += 1
  toastStore.listeners.forEach((listener) => listener(toast))
}
