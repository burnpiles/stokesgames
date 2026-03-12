import type { Metadata } from 'next'
import { SEED_LEADERBOARD } from '@/lib/seed-data'
import { formatNumber } from '@/lib/utils'
import { Trophy, Trash2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Leaderboard' }

export default function AdminLeaderboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            LEADERBOARD
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Global rankings and moderation controls</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 border border-[var(--error)]/30 text-[var(--error)] hover:border-[var(--error)] hover:bg-[var(--error)]/5 rounded-lg text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
        >
          RESET WEEKLY
        </button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Rank', 'Player', 'Tier', 'XP', 'Games', 'Actions'].map((h) => (
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
              <tr key={entry.userId} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                <td className="px-4 py-3">
                  {entry.rank <= 3 ? (
                    <span className="text-lg">{['🥇', '🥈', '🥉'][entry.rank - 1]}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-display)' }}>
                      #{entry.rank}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{entry.displayName ?? entry.username}</p>
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
                <td className="px-4 py-3">
                  <button className="text-[var(--error)] hover:opacity-70 transition-opacity" title="Remove from leaderboard">
                    <Trash2 size={14} />
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
