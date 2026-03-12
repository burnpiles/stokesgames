'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Zap, Trophy, Users } from 'lucide-react'
import { Leaderboard } from '@/components/game/Leaderboard'
import { SEED_CHALLENGE } from '@/lib/seed-data'
import { formatCountdown, formatScore } from '@/lib/utils'

export default function ChallengePage() {
  const challenge = SEED_CHALLENGE
  const [countdown, setCountdown] = useState(() => formatCountdown(challenge.endsAt))

  useEffect(() => {
    const interval = setInterval(() => setCountdown(formatCountdown(challenge.endsAt)), 1000)
    return () => clearInterval(interval)
  }, [challenge.endsAt])

  if (!challenge.isActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>NO ACTIVE CHALLENGE</p>
        <p className="text-[var(--text-secondary)] mb-6">Check back soon — the twins are cooking something up.</p>
        <Link href="/games" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg text-sm"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
          BROWSE GAMES
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative grain-overlay overflow-hidden border-b-2 border-[var(--accent-primary)] challenge-border">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(255,61,0,0.15) 0%, transparent 60%)' }}
          aria-hidden />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="live-dot" />
            <span className="text-[var(--accent-primary)] text-sm tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}>
              LIVE NOW
            </span>
          </div>

          <h1
            className="text-[clamp(2.5rem,10vw,7rem)] leading-none text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            ⚡ TWIN CHALLENGE
          </h1>

          <p className="text-[var(--text-secondary)] text-lg mb-4">
            {challenge.game?.title} — beat their scores to win
          </p>

          {/* Countdown */}
          <div className="inline-flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-6 py-3 mb-8">
            <span className="text-[var(--text-muted)] text-sm">Ends in:</span>
            <span
              className="text-[var(--accent-primary)] text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {countdown}
            </span>
          </div>

          {/* Twin score cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
            <TwinScoreCard
              name="ALEX"
              score={challenge.alexScore}
              quote={challenge.alexQuote}
              color="#FF3D00"
            />
            <TwinScoreCard
              name="ALAN"
              score={challenge.alanScore}
              quote={challenge.alanQuote}
              color="#FF6B35"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)] mb-8">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-[var(--success)]" />
              <span className="text-[var(--success)]">{challenge.winnerCount}</span> have beaten them
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/play/${challenge.game?.slug ?? ''}?mode=challenge`}
            className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-xl transition-all shadow-[0_0_40px_var(--accent-glow)] hover:shadow-[0_0_60px_var(--accent-glow-strong)]"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            <Zap size={22} />
            ACCEPT THE CHALLENGE
          </Link>
        </div>
      </section>

      {/* Prize section */}
      {challenge.prizeDescription && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[var(--bg-card)] border border-[var(--gold)] rounded-2xl p-6 glow-gold">
            <p className="text-[var(--gold)] text-sm tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-display)' }}>
              🏆 PRIZE
            </p>
            <p className="text-white text-lg">{challenge.prizeDescription}</p>
          </div>
        </section>
      )}

      {/* Live leaderboard */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl text-white mb-4"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          LIVE LEADERBOARD
        </h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <Leaderboard variant="challenge" maxRows={50} />
        </div>
      </section>
    </div>
  )
}

function TwinScoreCard({
  name, score, quote, color
}: {
  name: string; score: number; quote: string | null; color: string
}) {
  return (
    <div
      className="bg-[var(--bg-card)] border rounded-xl p-5 text-left"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
          style={{ background: color, fontFamily: 'var(--font-display)' }}
        >
          {name[0]}
        </div>
        <span className="text-white font-medium text-sm"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
          {name}
        </span>
      </div>
      <p
        className="text-4xl mb-3"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {formatScore(score)}
      </p>
      {quote && (
        <p className="text-[var(--text-secondary)] text-xs italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  )
}
