type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-green-50 text-green-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-orange-50 text-orange-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-600',
  neutral: 'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
