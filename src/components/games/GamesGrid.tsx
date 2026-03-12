import { GameCard } from '@/components/game/GameCard'
import type { Game } from '@/types'

export function GamesGrid({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="py-20 text-center text-[var(--text-muted)]">
        <p className="text-4xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>NO GAMES FOUND</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
