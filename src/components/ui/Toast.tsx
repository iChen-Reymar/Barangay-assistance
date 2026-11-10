import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { toastStore, type ToastItem } from './toastStore'

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (toast: ToastItem) => {
      setToasts((current) => [...current, toast])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 4500)
    }
    toastStore.listeners.add(listener)
    return () => {
      toastStore.listeners.delete(listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg"
          style={{ animation: 'barangay-toast-in 220ms ease-out' }}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toast.tone === 'success' ? 'bg-primary text-white' : 'bg-red-600 text-white'}`}>
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            {toast.title ? <span className="block text-base font-semibold text-gray-900">{toast.title}</span> : null}
            <span className={`block text-base ${toast.title ? 'mt-0.5 font-medium text-gray-600' : 'font-semibold text-gray-900'}`}>{toast.message}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
