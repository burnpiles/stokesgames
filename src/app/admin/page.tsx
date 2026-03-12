import type { Metadata } from 'next'
import { SEED_GAMES, SEED_LEADERBOARD, SEED_CHALLENGE } from '@/lib/seed-data'
import { formatNumber } from '@/lib/utils'
import { Gamepad2, Users, Trophy, Zap, TrendingUp, Activity } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default function AdminDashboard() {
  const totalPlays = SEED_GAMES.reduce((sum, g) => sum + g.totalPlays, 0)
  const activePlayers = SEED_GAMES.reduce((sum, g) => sum + (g.activePlayers ?? 0), 0)

  const stats = [
    { label: 'Total Games',    value: SEED_GAMES.length,              icon: Gamepad2, color: 'var(--accent-primary)' },
    { label: 'Total Players',  value: SEED_LEADERBOARD.length + 4892, icon: Users,    color: 'var(--info)' },
    { label: 'Total Plays',    value: totalPlays,                     icon: TrendingUp,color: 'var(--success)' },
    { label: 'Active Now',     value: activePlayers,                  icon: Activity, color: 'var(--warning)' },
    { label: 'Active Challenge', value: SEED_CHALLENGE?.isActive ? 1 : 0, icon: Zap, color: '#A855F7' },
    { label: 'Leaderboard Entries', value: SEED_LEADERBOARD.length,  icon: Trophy,   color: 'var(--gold)' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-4xl text-white mb-1"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          DASHBOARD
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">Platform overview and quick actions</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[var(--text-secondary)] text-xs tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                {label}
              </p>
              <Icon size={16} style={{ color }} />
            </div>
            <p
              className="text-3xl text-white"
              style={{ fontFamily: 'var(--font-display)', color }}
            >
              {formatNumber(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2
          className="text-lg text-white mb-4"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          QUICK ACTIONS
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/games/new',       label: 'Add Game' },
            { href: '/admin/challenges/new',  label: 'New Challenge' },
            { href: '/admin/prizes/new',      label: 'Add Prize' },
            { href: '/admin/leaderboard',     label: 'View Leaderboard' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center justify-center px-4 py-3 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
            >
              {label.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      {/* Recent games */}
      <div>
        <h2
          className="text-lg text-white mb-4"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          GAMES
        </h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Title', 'Plays', 'Active', 'Stokes Score', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[var(--text-muted)] text-xs tracking-wider"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEED_GAMES.map((game) => (
                <tr key={game.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{game.title}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{formatNumber(game.totalPlays)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                      <span className="text-[var(--text-secondary)]">{game.activePlayers ?? 0}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: game.stokesScore >= 80 ? 'var(--success)' : game.stokesScore >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                      {game.stokesScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${game.isActive ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                      {game.isActive ? 'LIVE' : 'OFF'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
