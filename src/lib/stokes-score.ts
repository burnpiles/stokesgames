import type { Game } from '@/types'

/**
 * Calculate the composite Stokes Score (0–100) for a game.
 * Weights:
 *   Twin Rating: 35%   (Alex + Alan avg, normalized to 0-100)
 *   Fan Score:   45%   (already 0-100)
 *   Hype Score:  20%   (trending, based on play velocity)
 */
export function calculateStokesScore(game: Pick<
  Game,
  'alexRating' | 'alanRating' | 'fanScore' | 'totalPlays' | 'createdAt'
>): number {
  const twinAvg = ((game.alexRating + game.alanRating) / 2) * 20   // 0-100
  const fanNorm = game.fanScore                                       // 0-100
  const hype    = calculateHypeScore(game.totalPlays, game.createdAt) // 0-100

  return Math.round(twinAvg * 0.35 + fanNorm * 0.45 + hype * 0.20)
}

/**
 * Hype score based on plays-per-day since launch.
 * 500+ plays/day = 100, scales down proportionally.
 */
export function calculateHypeScore(totalPlays: number, createdAt: string): number {
  const msPerDay   = 86_400_000
  const ageDays    = Math.max(1, (Date.now() - new Date(createdAt).getTime()) / msPerDay)
  const playsPerDay = totalPlays / ageDays
  return Math.min(100, Math.round((playsPerDay / 500) * 100))
}
