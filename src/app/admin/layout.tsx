import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Gamepad2, Trophy, Zap, Users, Gift } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | Admin', default: 'Admin' },
  robots: 'noindex,nofollow',
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

const NAV_ITEMS = [
  { href: '/admin',            label: 'DASHBOARD',  icon: LayoutDashboard },
  { href: '/admin/games',      label: 'GAMES',      icon: Gamepad2 },
  { href: '/admin/challenges', label: 'CHALLENGES', icon: Zap },
  { href: '/admin/prizes',     label: 'PRIZES',     icon: Gift },
  { href: '/admin/leaderboard',label: 'LEADERBOARD',icon: Trophy },
  { href: '/admin/players',    label: 'PLAYERS',    icon: Users },
]

async function getAdminUser() {
  // Only enforce auth when Clerk is configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  const clerkReady = clerkKey.length > 20 && !clerkKey.includes('placeholder')
  if (!clerkReady) return { email: 'dev@localhost', isAdmin: true }

  try {
    const { auth, currentUser } = await import('@clerk/nextjs/server')
    const { userId } = auth()
    if (!userId) return null
    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress ?? ''
    const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email)
    return isAdmin ? { email, isAdmin } : null
  } catch {
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminUser()
  if (!admin) redirect('/')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
        <div className="px-4 py-5 border-b border-[var(--border)]">
          <p
            className="text-xs text-[var(--accent-primary)] tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            STOKEGAMES
          </p>
          <p
            className="text-lg text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            ADMIN
          </p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)] transition-colors"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] truncate">{admin.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[var(--bg-primary)]">
        {children}
      </main>
    </div>
  )
}
