interface FilterProps {
  label: string
  options: string[]
  value?: string
  onChange?: (value: string) => void
}

export function Filter({ label, options, value, onChange }: FilterProps) {
  return (
    <select
      value={value ?? options[0]}
      onChange={(e) => onChange?.(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
