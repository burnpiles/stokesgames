'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Share2, RotateCcw, ChevronLeft, Trophy } from 'lucide-react'
import { cn, formatScore, scoreMedal } from '@/lib/utils'
import type { Game } from '@/types'

interface ScoreCardProps {
  score: number
  game: Game
  rank?: number | null
  personalBest?: number
  isPersonalBest?: boolean
  onPlayAgain?: () => void
  onShare?: () => void
}

/** Post-game overlay shown after a session ends */
export function ScoreCard({
  score,
  game,
  rank,
  personalBest,
  isPersonalBest,
  onPlayAgain,
  onShare,
}: ScoreCardProps) {
  const [displayed, setDisplayed] = useState(0)
  const animRef = useRef<number>(0)
  const medal = scoreMedal(score)

  // Animated score count-up
  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)  // ease-out cubic
      setDisplayed(Math.floor(eased * score))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [score])

  return (
    <div className="w-full max-w-md mx-auto bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/20 to-transparent px-6 py-5 border-b border-[var(--border)]">
        <p className="text-[var(--text-secondary)] text-xs tracking-widest mb-1"
          style={{ fontFamily: 'var(--font-display)' }}>
          {game.title.toUpperCase()}
        </p>
        <h2 className="text-[var(--text-secondary)] text-sm">GAME OVER</h2>
      </div>

      {/* Score */}
      <div className="px-6 py-8 text-center">
        {medal && (
          <div className="text-5xl mb-3 score-reveal">{medal.emoji}</div>
        )}
        <p className="text-[var(--text-muted)] text-xs tracking-widest mb-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          YOUR SCORE
        </p>
        <div
          className="score-number text-7xl text-white score-reveal"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {formatScore(displayed)}
        </div>

        {isPersonalBest && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-[var(--gold)]/10 border border-[var(--gold)] text-[var(--gold)] px-3 py-1 rounded-full text-xs animate-[score-reveal_0.4s_0.8s_ease_both]">
            🏆 NEW PERSONAL BEST!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-[var(--border)] border-t border-b border-[var(--border)]">
        <div className="bg-[var(--bg-card)] px-4 py-4 text-center">
          <p className="text-[var(--text-muted)] text-xs mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            PERSONAL BEST
          </p>
          <p className="score-number text-lg text-[var(--text-primary)]">
            {formatScore(Math.max(score, personalBest ?? 0))}
          </p>
        </div>
        <div className="bg-[var(--bg-card)] px-4 py-4 text-center">
          <p className="text-[var(--text-muted)] text-xs mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            GLOBAL RANK
          </p>
          <p className="score-number text-lg text-[var(--text-primary)]">
            {rank != null ? `#${rank.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-5 space-y-3">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-colors font-display tracking-widest text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <RotateCcw size={16} />
            PLAY AGAIN
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-all text-sm"
            >
              <Share2 size={14} />
              Share
            </button>
          )}
          <Link
            href={`/leaderboard?game=${game.slug}`}
            className="flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-all text-sm"
          >
            <Trophy size={14} />
            Leaderboard
          </Link>
        </div>
        <Link
          href="/games"
          className="flex items-center justify-center gap-1.5 text-[var(--text-muted)] hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={14} />
          Back to games
        </Link>
      </div>
    </div>
  )
}
