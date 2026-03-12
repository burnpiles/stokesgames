'use client'

import { useState, useEffect } from 'react'
import { Trophy, Clock, Zap } from 'lucide-react'
import { Leaderboard } from '@/components/game/Leaderboard'
import { formatCountdown } from '@/lib/utils'
import { SEED_CHALLENGE } from '@/lib/seed-data'
import { cn } from '@/lib/utils'

type Tab = 'global' | 'weekly' | 'challenge'

const PRIZES = [
  { rank: '🥇 #1', prize: 'Stokes Twins signed merch pack + video shoutout' },
  { rank: '🥈 #2-5', prize: 'Stokes Twins merch bundle' },
  { rank: '🥉 #6-10', prize: 'Exclusive StokeGames digital badge + XP boost' },
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('global')
  const [countdown, setCountdown] = useState('')
  const challenge = SEED_CHALLENGE

  useEffect(() => {
    const update = () =>
      setCountdown(
        formatCountdown(
          new Date(Date.now() + (7 - new Date().getDay()) * 86_400_000)
        )
      )
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'global', label: 'GLOBAL', icon: <Trophy size={14} /> },
    { id: 'weekly', label: 'THIS WEEK', icon: <Clock size={14} /> },
    { id: 'challenge', label: 'TWIN CHALLENGE', icon: <Zap size={14} /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-5xl text-white mb-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          LEADERBOARD
        </h1>
        <p className="text-[var(--text-secondary)]">
          The best players in the StokeGames universe
        </p>
      </div>

      {/* Prize banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--gold)] rounded-xl p-5 mb-6 glow-gold">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-[var(--gold)] text-xs tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🏆 WEEKLY PRIZES
            </p>
            <div className="space-y-1">
              {PRIZES.map(({ rank, prize }) => (
                <p key={rank} className="text-[var(--text-secondary)] text-sm">
                  <span className="text-white">{rank}</span> — {prize}
                </p>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-muted)] text-xs mb-1">Week resets in:</p>
            <p
              className="text-[var(--gold)] text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {countdown}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border)]">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-xs tracking-widest transition-all',
              tab === id
                ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-[var(--text-muted)] hover:text-white'
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <Leaderboard variant={tab} maxRows={100} />
      </div>
    </div>
  )
}
