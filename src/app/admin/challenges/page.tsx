import { SEED_CHALLENGE } from '@/lib/seed-data'
import { formatCountdown } from '@/lib/utils'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Challenges' }

export default function AdminChallengesPage() {
  const challenge = SEED_CHALLENGE

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            CHALLENGES
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Manage Twin Challenges and events</p>
        </div>
        <Link
          href="/admin/challenges/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
        >
          <Plus size={16} />
          NEW CHALLENGE
        </Link>
      </div>

      {challenge && (
        <div className="max-w-2xl">
          <h2
            className="text-sm text-[var(--text-muted)] tracking-wider mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ACTIVE CHALLENGE
          </h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="live-dot" />
                  <span
                    className="text-xs text-[var(--accent-primary)] tracking-widest"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    LIVE
                  </span>
                </div>
                <h3
                  className="text-2xl text-white"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  {challenge.title}
                </h3>
              </div>
              <Zap size={20} className="text-[var(--accent-primary)] mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>ALEX SCORE</p>
                <p className="text-2xl text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {challenge.alexScore.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 italic">&ldquo;{challenge.alexQuote}&rdquo;</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>ALAN SCORE</p>
                <p className="text-2xl text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {challenge.alanScore.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 italic">&ldquo;{challenge.alanQuote}&rdquo;</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div>
                <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-display)' }}>WINNERS</p>
                <p className="text-lg text-[var(--success)]" style={{ fontFamily: 'var(--font-display)' }}>{challenge.winnerCount}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-display)' }}>GAME</p>
                <p className="text-sm text-white">{challenge.game?.title}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-display)' }}>ENDS</p>
                <p className="text-sm text-white">{new Date(challenge.endsAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white transition-all"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
              >
                EDIT
              </button>
              <button
                className="flex-1 py-2.5 border border-[var(--error)]/30 rounded-lg text-sm text-[var(--error)] hover:border-[var(--error)] hover:bg-[var(--error)]/5 transition-all"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
              >
                END CHALLENGE
              </button>
            </div>
          </div>
        </div>
      )}

      {!challenge?.isActive && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <Zap size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">No active challenge. Create one to engage your community.</p>
        </div>
      )}
    </div>
  )
}
