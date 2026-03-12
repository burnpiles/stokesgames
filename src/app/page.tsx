import Link from 'next/link'
import { Play, Trophy, ChevronRight, Zap } from 'lucide-react'
import { GameCard } from '@/components/game/GameCard'
import { TwinChallengeBanner } from '@/components/game/TwinChallengeBanner'
import { LiveLeaderboardTicker } from '@/components/home/LiveLeaderboardTicker'
import { CategoryPills } from '@/components/home/CategoryPills'
import { SEED_GAMES, SEED_CHALLENGE, SEED_LEADERBOARD } from '@/lib/seed-data'

export default function HomePage() {
  const challenge = SEED_CHALLENGE  // TODO: fetch from DB
  const games = SEED_GAMES
  const leaderboard = SEED_LEADERBOARD

  return (
    <>
      {/* Twin Challenge Banner */}
      {challenge?.isActive && <TwinChallengeBanner challenge={challenge} />}

      {/* Hero */}
      <section className="relative grain-overlay overflow-hidden">
        {/* Hero banner image — using <img> so GIFs animate */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-banner.gif"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)' }}
          aria-hidden
        />
        {/* Bottom fade to site bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-primary))' }}
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          {/* Live badge */}
          {challenge?.isActive && (
            <div className="inline-flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--accent-primary)] px-3 py-1.5 rounded-full text-xs text-[var(--accent-primary)] mb-8">
              <span className="live-dot" />
              <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                TWIN CHALLENGE ACTIVE
              </span>
            </div>
          )}

          {/* Main headline */}
          <h1
            className="text-[clamp(3rem,12vw,9rem)] leading-none text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            PLAY.{' '}
            <span className="text-[var(--accent-primary)]">COMPETE.</span>
            {' '}WIN.
          </h1>

          <p className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-xl mx-auto mb-10">
            The official game hub of{' '}
            <span className="text-white font-medium">Alex &amp; Alan Stokes</span>
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/games"
              className="flex items-center gap-2 px-8 py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_40px_var(--accent-glow-strong)]"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em', fontSize: '1rem' }}
            >
              <Play size={18} fill="white" />
              PLAY NOW
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 px-8 py-4 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-lg text-sm transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em', fontSize: '1rem' }}
            >
              <Trophy size={16} />
              VIEW LEADERBOARD
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-10 text-[var(--text-muted)] text-sm">
            <a
              href="https://www.youtube.com/c/StokesTwins"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--success)] font-medium">137M+</span> subscribers
            </a>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--accent-primary)] font-medium">{games.length}</span> games
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-white font-medium">500K+</span> players
            </div>
          </div>
        </div>
      </section>

      {/* Live Leaderboard Ticker */}
      <LiveLeaderboardTicker entries={leaderboard} />

      {/* Category Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <CategoryPills />
      </section>

      {/* Featured Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-3xl text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            FEATURED GAMES
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-white text-sm transition-colors"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Challenge CTA Section */}
      {challenge?.isActive && (
        <section className="relative overflow-hidden grain-overlay mb-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,61,0,0.08) 0%, transparent 60%)' }}
            aria-hidden
          />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 border border-[var(--border)] rounded-2xl p-8 bg-[var(--bg-card)]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="live-dot" />
                  <span
                    className="text-[var(--accent-primary)] text-sm tracking-widest"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    ACTIVE CHALLENGE
                  </span>
                </div>
                <h2
                  className="text-4xl text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  ⚡ TWIN CHALLENGE
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Alex scored <span className="text-white font-medium">{challenge.alexScore.toLocaleString()}</span>.{' '}
                  Alan scored <span className="text-white font-medium">{challenge.alanScore.toLocaleString()}</span>.{' '}
                  Can you beat them?
                </p>
                <p className="text-[var(--text-muted)] text-sm mt-1">
                  <span className="text-[var(--success)]">{challenge.winnerCount} players</span> have already beaten them
                </p>
              </div>
              <Link
                href="/challenge"
                className="shrink-0 flex items-center gap-2 px-8 py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all shadow-[0_0_20px_var(--accent-glow)]"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em', fontSize: '1rem' }}
              >
                <Zap size={16} />
                ACCEPT THE CHALLENGE
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
