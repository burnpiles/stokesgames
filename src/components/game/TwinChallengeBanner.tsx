'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X, Zap, Trophy } from 'lucide-react'
import { formatCountdown, formatScore } from '@/lib/utils'
import type { Challenge } from '@/types'

interface TwinChallengeBannerProps {
  challenge: Challenge
}

export function TwinChallengeBanner({ challenge }: TwinChallengeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [countdown, setCountdown] = useState(() => formatCountdown(challenge.endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(challenge.endsAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [challenge.endsAt])

  if (dismissed) return null

  const targetScore = Math.max(challenge.alexScore, challenge.alanScore)

  return (
    <div className="relative w-full bg-[var(--bg-secondary)] border-b-2 border-[var(--accent-primary)] challenge-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="live-dot" />
            <span
              className="text-[var(--accent-primary)] text-xs tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              LIVE
            </span>
          </div>

          {/* Challenge info */}
          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            <span
              className="text-white text-sm tracking-wide whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ⚡ TWIN CHALLENGE
            </span>
            <span className="text-[var(--text-secondary)] text-xs truncate">
              Beat the twins in{' '}
              <span className="text-white">{challenge.game?.title ?? 'the current challenge'}</span>
              {' — '}
              <span className="text-[var(--accent-primary)] font-medium">
                Target: {formatScore(targetScore)}
              </span>
            </span>
          </div>

          {/* Countdown */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-xs hidden sm:block">Ends in:</span>
            <span
              className="text-[var(--accent-secondary)] text-sm tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {countdown}
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/challenge"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white text-xs rounded transition-colors"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            <Trophy size={12} />
            BEAT THEM
          </Link>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-[var(--text-muted)] hover:text-white transition-colors"
            aria-label="Dismiss challenge banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
