import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { EyeIcon, EyeOffIcon } from './fieldIcons'

function InputIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
      {children}
    </span>
  )
}

const fieldClassName =
  'w-full rounded-lg border border-gray-200 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'

type FormFieldProps = {
  label: string
  id: string
  icon?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>

export function FormField({ label, id, icon, className, type, ...props }: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon ? <InputIcon>{icon}</InputIcon> : null}
        <input
          id={id}
          type={inputType}
          className={`${fieldClassName} ${icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'} ${className ?? ''}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? EyeOffIcon : EyeIcon}
          </button>
        ) : null}
      </div>
    </div>
  )
}

type FormSelectProps = {
  label: string
  id: string
  icon?: ReactNode
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>

export function FormSelect({ label, id, icon, children, className, ...props }: FormSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon ? <InputIcon>{icon}</InputIcon> : null}
        <select
          id={id}
          className={`${fieldClassName} appearance-none bg-white pr-10 ${icon ? 'pl-10' : 'pl-4'} ${className ?? ''}`}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  )
}
