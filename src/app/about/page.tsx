import type { Metadata } from 'next'
import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: 'About StokeGames — the official game hub of Alex & Alan Stokes.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
          <Gamepad2 size={20} className="text-white" />
        </div>
        <h1 className="text-4xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          ABOUT STOKEGAMES
        </h1>
      </div>

      <div className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p>
          StokeGames is the official game hub of <span className="text-white">Alex & Alan Stokes</span> — the twin YouTube creators and entertainers. This platform brings their world to life through original mini-games, competitive leaderboards, and real prizes for top players.
        </p>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>WHAT IS THIS?</h2>
          <p>A prototype game platform built to showcase what a full StokeGames experience could look like. All games are playable, but leaderboards, scoring, and authentication are demonstration features — not yet connected to a live backend.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>THE GAMES</h2>
          <p>Each game is built around Alex and Alan&apos;s brand — their likenesses, inside jokes, and content. From reflex tests to endless runners, every game is designed to be fast, competitive, and shareable.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>IF THIS LAUNCHES</h2>
          <p>A full launch would include real accounts, live leaderboards, weekly Twin Challenges, rank tiers (Rookie → Stokemaster), and real prizes. This prototype demonstrates all of that infrastructure, ready to go live.</p>
        </div>

        <p className="text-[var(--text-muted)] text-xs">
          This is a prototype. All game data, scores, and leaderboard entries are simulated and do not represent real user data.
        </p>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/games"
          className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          PLAY GAMES
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          HOME
        </Link>
      </div>
    </div>
  )
}
