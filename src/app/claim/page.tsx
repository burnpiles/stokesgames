import type { Metadata } from 'next'
import Link from 'next/link'
import { Gamepad2, Trophy, Star, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Claim Score',
  description: 'Score claim portal — coming soon.',
}

export default function ClaimPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trophy size={28} className="text-[var(--accent-primary)]" />
        </div>
        <h1
          className="text-3xl text-white mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          SCORE CLAIM
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">
          If this platform launches, this is where players would verify and claim their scores to the official leaderboard.
        </p>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-sm text-left space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>VERIFY YOUR SCORE</p>
              <p className="text-[var(--text-muted)] text-xs">Cryptographically signed score tokens prevent cheating.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy size={18} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>POST TO LEADERBOARD</p>
              <p className="text-[var(--text-muted)] text-xs">Claimed scores are submitted to the global and weekly rankings.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star size={18} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>EARN XP & RANK UP</p>
              <p className="text-[var(--text-muted)] text-xs">Each claim earns XP toward your rank tier and prize eligibility.</p>
            </div>
          </div>
        </div>

        <p className="text-[var(--text-muted)] text-xs mb-6">
          This is a prototype — score claiming will be enabled when the platform goes live.
        </p>

        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          <Gamepad2 size={16} />
          PLAY GAMES
        </Link>
      </div>
    </div>
  )
}
