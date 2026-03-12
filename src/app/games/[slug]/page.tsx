import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Play, Star, Youtube, ChevronLeft } from 'lucide-react'
import { StokesScore } from '@/components/game/StokesScore'
import { Leaderboard } from '@/components/game/Leaderboard'
import { SEED_GAMES } from '@/lib/seed-data'
import { formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'

interface GamePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = SEED_GAMES.find((g) => g.slug === params.slug)
  if (!game) return {}
  return {
    title: game.title,
    description: game.description,
  }
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/[?&]v=([^&]+)/)
  return m ? m[1] : null
}

export default function GamePage({ params }: GamePageProps) {
  const game = SEED_GAMES.find((g) => g.slug === params.slug)
  if (!game) notFound()

  const recommended = SEED_GAMES.filter((g) => g.slug !== params.slug && g.isActive)
    .sort((a, b) => b.stokesScore - a.stokesScore)
    .slice(0, 2)

  const twinAvg = (game.alexRating + game.alanRating) / 2

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <Image
          src={game.thumbnailUrl}
          alt={game.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex items-end gap-4">
            <StokesScore score={game.stokesScore} size="lg" />
            <div>
              <div className="flex gap-1.5 mb-2">
                {game.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 rounded text-[10px] bg-[var(--accent-primary)] text-white"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
                  >
                    {badge.replace('_', ' ')}
                  </span>
                ))}
              </div>
              <h1
                className="text-4xl sm:text-6xl text-white leading-none"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                {game.title.toUpperCase()}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Back link */}
            <Link
              href="/games"
              className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-white text-sm transition-colors"
            >
              <ChevronLeft size={14} /> Back to Games
            </Link>

            {/* Play button */}
            <Link
              href={`/play/${game.slug}`}
              className="flex items-center justify-center gap-3 w-full py-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-xl transition-all shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_40px_var(--accent-glow-strong)]"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
            >
              <Play size={24} fill="white" />
              PLAY NOW — INSTANT PLAY
            </Link>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'TOTAL PLAYS', value: formatNumber(game.totalPlays) },
                { label: 'PLAYING NOW', value: formatNumber(game.activePlayers ?? 0), live: true },
                { label: 'TWIN RATING', value: `${twinAvg.toFixed(1)}/5` },
              ].map(({ label, value, live }) => (
                <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                  <p className="text-xs tracking-widest text-[var(--text-muted)] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {live && <span className="live-dot inline-block mr-1.5" style={{ width: 6, height: 6, verticalAlign: 'middle' }} />}
                    {label}
                  </p>
                  <p className="score-number text-xl text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>ABOUT</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{game.description}</p>
            </div>

            {/* YouTube video link */}
            {game.videoUrl && (() => {
              const vid = getYouTubeId(game.videoUrl)
              if (!vid) return null
              return (
                <div>
                  <h2 className="text-xl text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    THE VIDEO THAT INSPIRED THE GAME
                  </h2>
                  <a
                    href={game.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block relative rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent-primary)] transition-all"
                  >
                    <Image
                      src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
                      alt="Watch the video"
                      width={480}
                      height={270}
                      className="w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 group-hover:bg-black/30 transition-all">
                      <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                        <Youtube size={28} className="text-white" />
                      </div>
                    </div>
                  </a>
                </div>
              )
            })()}

            {/* Twin Reviews */}
            {(game.alexReview || game.alanReview) && (
              <div>
                <h2 className="text-xl text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  TWIN REVIEW
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {game.alexReview && (
                    <TwinReviewCard
                      name="Alex"
                      rating={game.alexRating}
                      review={game.alexReview}
                      color="#FF3D00"
                    />
                  )}
                  {game.alanReview && (
                    <TwinReviewCard
                      name="Alan"
                      rating={game.alanRating}
                      review={game.alanReview}
                      color="#FF6B35"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div>
              <h2 className="text-xl text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                LEADERBOARD
              </h2>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <Leaderboard gameId={game.id} variant="game" maxRows={10} />
              </div>
              <Link
                href={`/leaderboard?game=${game.slug}`}
                className="mt-3 flex items-center justify-center gap-1 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
              >
                View full leaderboard
              </Link>
            </div>

            {/* Recommended Games */}
            {recommended.length > 0 && (
              <div>
                <h2 className="text-xl text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  YOU MIGHT ALSO LIKE
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommended.map((rec) => (
                    <Link
                      key={rec.slug}
                      href={`/games/${rec.slug}`}
                      className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent-primary)] transition-all"
                    >
                      <div className="relative h-32">
                        <Image src={rec.thumbnailUrl} alt={rec.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white text-sm font-medium truncate"
                            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                            {rec.title.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">{formatNumber(rec.totalPlays)} plays</span>
                        <span className="text-xs text-[var(--accent-primary)]"
                          style={{ fontFamily: 'var(--font-display)' }}>
                          SCORE {rec.stokesScore}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Score breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm tracking-widest text-[var(--text-muted)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
                STOKES SCORE BREAKDOWN
              </h3>
              <div className="space-y-3">
                <ScoreRow label="Twin Rating" value={`${twinAvg.toFixed(1)}/5`} pct={twinAvg * 20} />
                <ScoreRow label="Fan Score" value={`${game.fanScore}/100`} pct={game.fanScore} />
                <ScoreRow label="Composite" value={`${game.stokesScore}/100`} pct={game.stokesScore} highlight />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm tracking-widest text-[var(--text-muted)] mb-3"
                style={{ fontFamily: 'var(--font-display)' }}>
                CATEGORIES
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/games?category=${cat}`}
                    className="px-3 py-1 rounded-full border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white transition-all"
                  >
                    {cat.replace('_', ' ')}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function TwinReviewCard({
  name, rating, review, color
}: {
  name: string; rating: number; review: string; color: string
}) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-display"
          style={{ background: color, fontFamily: 'var(--font-display)' }}
        >
          {name[0]}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{name}</p>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                fill={i < Math.round(rating) ? color : 'transparent'}
                stroke={color}
              />
            ))}
            <span className="text-xs text-[var(--text-muted)] ml-1">{rating}</span>
          </div>
        </div>
      </div>
      <p className="text-[var(--text-secondary)] text-sm italic leading-relaxed">
        &ldquo;{review}&rdquo;
      </p>
    </div>
  )
}

function ScoreRow({
  label, value, pct, highlight = false
}: {
  label: string; value: string; pct: number; highlight?: boolean
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className={highlight ? 'text-white font-medium' : 'text-[var(--text-secondary)]'}>{value}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: highlight
              ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
              : 'var(--border)',
          }}
        />
      </div>
    </div>
  )
}
