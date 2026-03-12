'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Gamepad2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

// Only import Clerk components when the key is properly configured.
// This avoids the "Missing publishableKey" crash in local dev.
const CLERK_READY =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20

const NAV_LINKS = [
  { href: '/games',       label: 'GAMES' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
  { href: '/challenge',   label: 'CHALLENGE' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (pathname.startsWith('/play/')) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded flex items-center justify-center group-hover:shadow-[0_0_12px_var(--accent-glow)] transition-shadow">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <span
            className="text-2xl text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            STOKEGAMES
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'px-4 py-2 rounded text-sm transition-colors tracking-widest',
                  pathname.startsWith(href)
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: auth + hamburger */}
        <div className="flex items-center gap-3">
          {CLERK_READY ? <ClerkAuthButtons /> : <SignInButton />}
          <button
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-3 rounded text-sm tracking-widest transition-colors',
                pathname.startsWith(href)
                  ? 'text-[var(--accent-primary)] bg-[var(--bg-card)]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]'
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {label}
            </Link>
          ))}
          <SignInButton mobile />
        </div>
      )}
    </header>
  )
}

function SignInButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/sign-in"
      className={cn(
        'items-center gap-2 px-4 py-2 text-sm rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white transition-all tracking-widest',
        mobile ? 'flex' : 'hidden md:inline-flex'
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      SIGN IN
    </Link>
  )
}

/**
 * Clerk auth buttons — only rendered when CLERK_READY is true.
 * Lazy-loaded to avoid crashing when ClerkProvider is absent.
 */
function ClerkAuthButtons() {
  // Wrapped in try/catch in case hooks fail without provider
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth, UserButton } = require('@clerk/nextjs')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isSignedIn } = useAuth()

    if (isSignedIn) {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/profile/me"
            className="hidden md:flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <Trophy size={14} />
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>PROFILE</span>
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  'w-8 h-8 ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]',
              },
            }}
          />
        </div>
      )
    }
    return <SignInButton />
  } catch {
    return <SignInButton />
  }
}
