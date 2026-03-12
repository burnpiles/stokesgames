'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { cn, formatScore, formatNumber, getInitials, timeAgo } from '@/lib/utils'
import { RankBadge } from './RankBadge'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardProps {
  gameId?: string
  variant?: 'global' | 'weekly' | 'challenge' | 'game'
  maxRows?: number
  currentUserId?: string
  className?: string
}

const RANK_MEDALS: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '🥇', color: 'var(--gold)' },
  2: { emoji: '🥈', color: 'var(--silver)' },
  3: { emoji: '🥉', color: 'var(--bronze)' },
}

export function Leaderboard({
  gameId,
  variant = 'global',
  maxRows = 50,
  currentUserId,
  className,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: String(maxRows) })
        if (gameId) params.set('gameId', gameId)

        const endpoint =
          variant === 'global'  ? `/api/leaderboard/global?${params}` :
          variant === 'weekly'  ? `/api/leaderboard/weekly?${params}` :
          variant === 'game'    ? `/api/scores/${gameId}?${params}` :
          `/api/leaderboard/challenge?${params}`

        const res = await fetch(endpoint)
        const json = await res.json()
        const data: LeaderboardEntry[] = json.data ?? []
        setEntries(data)

        if (currentUserId) {
          const userEntry = data.find((e) => e.userId === currentUserId)
          if (!userEntry) {
            // Fetch user's position separately
            const userRes = await fetch(`${endpoint}&userId=${currentUserId}`)
            const userJson = await userRes.json()
            if (userJson.userEntry) setCurrentUserEntry(userJson.userEntry)
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId, variant, maxRows, currentUserId])

  if (loading) return <LeaderboardSkeleton rows={6} />

  return (
    <div className={cn('space-y-1', className)}>
      {entries.map((entry, i) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
        />
      ))}

      {/* Pinned current-user row if outside top N */}
      {currentUserEntry && !entries.some((e) => e.userId === currentUserId) && (
        <>
          <div className="text-center py-1 text-[var(--text-muted)] text-xs">• • •</div>
          <LeaderboardRow
            entry={currentUserEntry}
            isCurrentUser
          />
        </>
      )}

      {entries.length === 0 && (
        <div className="py-12 text-center text-[var(--text-muted)]">
          <Trophy size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No scores yet. Be the first!</p>
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}) {
  const medal = RANK_MEDALS[entry.rank]

  return (
    <Link
      href={`/profile/${entry.username}`}
      className={cn(
        'leaderboard-row flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[var(--bg-secondary)]',
        isCurrentUser && 'current-user',
        entry.rank === 1 && 'top-1',
        entry.rank === 2 && 'top-2',
        entry.rank === 3 && 'top-3',
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal.emoji}</span>
        ) : (
          <span
            className="text-sm"
            style={{
              fontFamily: 'var(--font-display)',
              color: entry.rank <= 10 ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-secondary)] shrink-0 ring-1 ring-[var(--border)]">
        {entry.avatarUrl ? (
          <Image src={entry.avatarUrl} alt={entry.username} fill className="object-cover" sizes="32px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-display"
            style={{ fontFamily: 'var(--font-display)' }}>
            {getInitials(entry.displayName, entry.username)}
          </div>
        )}
      </div>

      {/* Name + rank */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isCurrentUser ? 'text-[var(--accent-primary)]' : 'text-white'
            )}
          >
            {entry.displayName ?? entry.username}
          </span>
          <RankBadge tier={entry.rankTier} size="xs" showLabel={false} />
        </div>
        {entry.gamesPlayed && (
          <p className="text-[var(--text-muted)] text-xs">{entry.gamesPlayed} games</p>
        )}
      </div>

      {/* Score / XP */}
      <div className="text-right shrink-0">
        <p
          className="score-number text-sm"
          style={{
            color: medal ? medal.color : isCurrentUser ? 'var(--accent-primary)' : 'var(--text-primary)',
          }}
        >
          {entry.xp != null ? formatNumber(entry.xp) + ' XP' : formatScore(entry.score)}
        </p>
        {entry.xp && entry.gamesPlayed && (
          <p className="text-[var(--text-muted)] text-xs">{entry.gamesPlayed} games</p>
        )}
      </div>

      <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
    </Link>
  )
}

function LeaderboardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
          <div className="w-8 h-5 skeleton rounded" />
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="h-4 skeleton rounded w-32" />
            <div className="h-3 skeleton rounded w-20" />
          </div>
          <div className="h-5 skeleton rounded w-20" />
        </div>
      ))}
    </div>
  )
}
