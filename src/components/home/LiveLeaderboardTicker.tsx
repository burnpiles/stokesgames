import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { formatNumber, getInitials } from '@/lib/utils'
import { RankBadge } from '@/components/game/RankBadge'
import type { LeaderboardEntry } from '@/types'

interface LiveLeaderboardTickerProps {
  entries: LeaderboardEntry[]
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LiveLeaderboardTicker({ entries }: LiveLeaderboardTickerProps) {
  // Duplicate entries for seamless loop
  const all = [...entries, ...entries]

  return (
    <div className="w-full border-y border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-r border-[var(--border)] bg-[var(--bg-primary)] z-10">
          <Trophy size={14} className="text-[var(--gold)]" />
          <span
            className="text-[var(--gold)] text-xs tracking-widest whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TOP PLAYERS
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track">
            {all.map((entry, i) => (
              <Link
                key={`${entry.userId}-${i}`}
                href={`/profile/${entry.username}`}
                className="flex items-center gap-3 px-6 py-3 border-r border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors whitespace-nowrap"
              >
                {/* Rank */}
                <span
                  className="text-sm w-6 text-center"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {RANK_MEDALS[entry.rank] ?? `#${entry.rank}`}
                </span>

                {/* Avatar placeholder */}
                <div className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[9px] text-[var(--text-muted)] font-display shrink-0">
                  {getInitials(entry.displayName, entry.username).slice(0, 1)}
                </div>

                {/* Username */}
                <span className="text-white text-sm font-medium">{entry.username}</span>

                <RankBadge tier={entry.rankTier} size="xs" showLabel={false} />

                {/* XP */}
                <span
                  className="text-[var(--accent-primary)] text-sm"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formatNumber(entry.xp ?? entry.score)} XP
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
