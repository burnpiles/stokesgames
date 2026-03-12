import { Suspense } from 'react'
import { GamesGrid } from '@/components/games/GamesGrid'
import { GameFilters } from '@/components/games/GameFilters'
import { GameCardSkeleton } from '@/components/game/GameCard'
import { SEED_GAMES } from '@/lib/seed-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Games',
  description: 'Browse and play all StokeGames instant-play games.',
}

interface GamesPageProps {
  searchParams: {
    category?: string
    badge?: string
    sort?: string
    q?: string
    minScore?: string
    maxScore?: string
  }
}

export default function GamesPage({ searchParams }: GamesPageProps) {
  let games = SEED_GAMES // TODO: fetch from Supabase with filters

  // Apply search filter
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    games = games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    )
  }

  // Apply category filter
  if (searchParams.category) {
    games = games.filter((g) =>
      g.categories.includes(searchParams.category as any)
    )
  }

  // Apply badge filter
  if (searchParams.badge) {
    games = games.filter((g) =>
      g.badges.includes(searchParams.badge as any)
    )
  }

  // Apply sort
  const sort = searchParams.sort ?? 'trending'
  if (sort === 'rating') {
    games = [...games].sort((a, b) => b.stokesScore - a.stokesScore)
  } else if (sort === 'newest') {
    games = [...games].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } else if (sort === 'plays') {
    games = [...games].sort((a, b) => b.totalPlays - a.totalPlays)
  } else {
    // Trending — active players weighted
    games = [...games].sort(
      (a, b) => (b.activePlayers ?? 0) * 10 + b.totalPlays / 1000 - ((a.activePlayers ?? 0) * 10 + a.totalPlays / 1000)
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-5xl text-white mb-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          ALL GAMES
        </h1>
        <p className="text-[var(--text-secondary)]">
          {games.length} game{games.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <GameFilters />
        </aside>

        {/* Games grid */}
        <div className="flex-1">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <GamesGrid games={games} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
