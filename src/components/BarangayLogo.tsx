interface BarangayLogoProps {
  className?: string
  alt?: string
}

export function BarangayLogo({
  className = 'h-16 w-16',
  alt = 'Barangay Buru-un, Iligan City official seal',
}: BarangayLogoProps) {
  return (
    <img
      src="/barangay-logo.png"
      alt={alt}
      className={`object-contain drop-shadow-md ${className}`}
    />
  )
}
