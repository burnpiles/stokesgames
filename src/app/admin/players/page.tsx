import type { Metadata } from 'next'
import { SEED_LEADERBOARD } from '@/lib/seed-data'
import { formatNumber } from '@/lib/utils'
import { Search, Ban } from 'lucide-react'

export const metadata: Metadata = { title: 'Players' }

export default function AdminPlayersPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-4xl text-white mb-1"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          PLAYERS
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">Search and manage player accounts</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          placeholder="Search players..."
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
        />
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Username', 'Tier', 'XP', 'Games Played', 'Joined', 'Actions'].map((h) => (
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
            {SEED_LEADERBOARD.map((entry) => (
              <tr
                key={entry.userId}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white">{entry.displayName ?? entry.username}</p>
                    <p className="text-[var(--text-muted)] text-xs">@{entry.username}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {entry.rankTier}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatNumber(entry.xp ?? 0)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.gamesPlayed ?? 0}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button className="text-[var(--error)] hover:opacity-70 transition-opacity" title="Ban player">
                    <Ban size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
