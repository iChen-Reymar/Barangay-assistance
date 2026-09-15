import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

const sizeStyles = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-lg ${sizeStyles[size]}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-5">
          <h2 className="pr-4 text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-gray-200 px-4 py-4 sm:px-5">{footer}</div>
        )}
      </div>
    </div>
  )
}
