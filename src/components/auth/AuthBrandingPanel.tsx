import { BarangayLogo } from '../BarangayLogo'

export function OfficialSeal() {
  return (
    <div className="relative mx-auto mb-8" aria-hidden="true">
      <BarangayLogo className="h-36 w-36" alt="" />
    </div>
  )
}

export function AuthBrandingPanel() {
  return (
    <div className="relative flex flex-col items-center justify-center bg-[#1a472a] px-8 py-16 text-center text-white lg:px-12">
      <OfficialSeal />

      <h1 className="mb-6 max-w-sm text-2xl font-bold leading-snug lg:text-3xl">
        AI-Enhanced Barangay Assistance Matching System
      </h1>

      <span className="rounded-full border border-white/20 bg-white/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider">
        Barangay Buru-un, Iligan City
      </span>

      <div className="absolute bottom-8 left-0 right-0 px-8">
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
          Official Government System Portal
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/50">
          Secure 256-bit Encryption Active
        </p>
      </div>
    </div>
  )
}
