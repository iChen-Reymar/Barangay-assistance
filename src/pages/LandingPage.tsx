import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BarangayLogo } from '../components/BarangayLogo'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
]

const workflowSteps = [
  {
    step: 1,
    title: 'Collect Information',
    description: 'Gather beneficiary data and household details.',
  },
  {
    step: 2,
    title: 'Assess Vulnerability',
    description: 'Evaluate socioeconomic factors and needs.',
  },
  {
    step: 3,
    title: 'Match Assistance',
    description: 'AI recommends suitable assistance programs.',
  },
  {
    step: 4,
    title: 'Review',
    description: 'View the AI recommended suggestions.',
  },
]

const features = [
  {
    title: 'Beneficiary Management',
    description: 'Organize and manage beneficiary profiles cleanly.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Vulnerability Assessment',
    description: 'Score and classify household vulnerability indices.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Assistance Matching',
    description: 'Match beneficiaries to programs automatically.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: 'Priority Ranking',
    description: 'Rank beneficiaries by urgency and immediate need.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Recommendations',
    description: 'AI-generated suggestions for personnel review.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Reports & Audit Logs',
    description: 'Track decisions and generate standard reports.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

function BarangaySeal({ className = 'h-10 w-10' }: { className?: string }) {
  return <BarangayLogo className={className} alt="Barangay Buru-un official seal" />
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
      {children}
    </p>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3 sm:py-4 lg:px-8">
          <a href="#home" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BarangaySeal />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold leading-tight text-primary sm:text-sm">
                BARANGAY BURU-UN
              </p>
              <p className="truncate text-[10px] text-gray-500 sm:text-xs">AI Assistance Matching</p>
            </div>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link, index) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    index === 0 ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-light sm:px-5 sm:text-sm"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <section id="home" className="bg-slate-50">
        <div className="container mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="border-b-2 border-accent pb-0.5">Barangay Buru-un</span>
              {' • Iligan City'}
            </p>
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Smarter Assistance, Better Community Support.
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-gray-600">
              Helping barangay personnel assess vulnerability and match beneficiaries with
              appropriate assistance programs through intelligent, transparent decision support.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
              >
                Get Started
              </Link>
              <Link
                to="/register/association-head"
                className="rounded-md border-2 border-primary px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-primary/5"
              >
                Register as Association Head
              </Link>
              <a
                href="#about"
                className="rounded-md border-2 border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center py-8">
            <div className="absolute h-80 w-80 rounded-full bg-mint-light/60" />
            <div className="absolute h-64 w-64 rounded-full bg-mint/40" />
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-white/10 p-4 shadow-xl ring-4 ring-accent/30">
              <BarangayLogo className="h-44 w-44" alt="Barangay Buru-un official seal" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-16 lg:py-24">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionLabel>About the System</SectionLabel>
            <h2 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 lg:text-4xl">
              Organized Assessment. Smart Matching. Transparent Support.
            </h2>
            <p className="text-base leading-relaxed text-gray-600">
              Our community deserves fair, quick, and transparent welfare allocation. The
              AI-Enhanced Barangay Assistance Matching System provides a systematic platform for
              barangay desk officers to log household demographics, evaluate essential
              socioeconomic criteria, and automatically map profiles against active municipal,
              provincial, and national relief programs.
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint-light text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-1 text-base font-bold text-gray-900">Secure &amp; Accountable</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  Built strictly for authorized public servants of Barangay Buru-un to protect
                  data privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="text-3xl font-extrabold text-gray-900 lg:text-4xl">How It Works</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((item, index) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {index < workflowSteps.length - 1 && (
                  <span
                    className="absolute right-0 top-6 hidden translate-x-1/2 text-gray-300 lg:block"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <SectionLabel>Core Capabilities</SectionLabel>
            <h2 className="text-3xl font-extrabold text-gray-900 lg:text-4xl">Features</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-mint-light text-primary">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-light py-20 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="mb-4 text-3xl font-extrabold text-white lg:text-4xl">
            Better Assistance Matching for the Community
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-white/85">
            Empowering Barangay Buru-un with smarter tools for fair and transparent assistance
            distribution.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-block rounded-md bg-accent px-8 py-3 text-sm font-bold text-gray-900 transition hover:bg-accent/90"
            >
              Login to the System
            </Link>
            <Link
              to="/register/association-head"
              className="inline-block rounded-md border-2 border-white/80 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Association Head Registration
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-primary-dark text-white">
        <div className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-3 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <BarangaySeal className="h-9 w-9" />
              <p className="text-base font-bold">Barangay Buru-un</p>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              An intelligent welfare program distribution support system built for fair resource
              mapping in Barangay Buru-un, Iligan City.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-accent">System</p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Contact</p>
            <address className="space-y-1 text-sm not-italic text-white/70">
              <p>Barangay Hall, Buru-un</p>
              <p>Iligan City, Lanao del Norte</p>
              <p className="pt-2">
                <a
                  href="mailto:support@buruuassistance.ph"
                  className="transition hover:text-white"
                >
                  support@buruuassistance.ph
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-5 lg:px-8">
            <p className="text-xs text-white/50">
              &copy; 2026 Barangay Buru-un, Iligan City. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
