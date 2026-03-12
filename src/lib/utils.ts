import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RankTier } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format large numbers: 12400 → 12.4K */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

/** Format score with commas: 142500 → 142,500 */
export function formatScore(n: number): string {
  return n.toLocaleString()
}

/** Returns the CSS class for a rank tier */
export function rankClass(tier: RankTier): string {
  switch (tier) {
    case 'ROOKIE':      return 'rank-rookie'
    case 'CONTENDER':   return 'rank-contender'
    case 'ELITE':       return 'rank-elite'
    case 'TWIN-LEVEL':  return 'rank-twin-level'
    case 'STOKEMASTER': return 'rank-stokemaster'
    default:            return 'rank-rookie'
  }
}

/** Returns the display label for a rank tier */
export function rankLabel(tier: RankTier): string {
  switch (tier) {
    case 'ROOKIE':      return 'Rookie'
    case 'CONTENDER':   return 'Contender'
    case 'ELITE':       return 'Elite'
    case 'TWIN-LEVEL':  return 'Twin-Level'
    case 'STOKEMASTER': return 'STOKEMASTER'
    default:            return 'Rookie'
  }
}

/** Returns the XP range for a rank tier */
export function rankXpRange(tier: RankTier): [number, number] {
  switch (tier) {
    case 'ROOKIE':      return [0, 1_000]
    case 'CONTENDER':   return [1_001, 10_000]
    case 'ELITE':       return [10_001, 50_000]
    case 'TWIN-LEVEL':  return [50_001, 150_000]
    case 'STOKEMASTER': return [150_001, Infinity]
    default:            return [0, 1_000]
  }
}

/** Derives rank tier from XP */
export function xpToRank(xp: number): RankTier {
  if (xp >= 150_001) return 'STOKEMASTER'
  if (xp >= 50_001)  return 'TWIN-LEVEL'
  if (xp >= 10_001)  return 'ELITE'
  if (xp >= 1_001)   return 'CONTENDER'
  return 'ROOKIE'
}

/** Stokes Score color: green > 70, yellow 50-70, red < 50 */
export function stokesScoreColor(score: number): string {
  if (score >= 70) return '#00FF94'  // --success
  if (score >= 50) return '#FFD700'  // --gold
  return '#FF3D00'                    // --accent-primary
}

/** Returns medal emoji for a score in Flappy Stokes */
export function scoreMedal(score: number): { emoji: string; label: string; color: string } {
  if (score >= 100) return { emoji: '💎', label: 'Diamond',  color: '#00FFFF' }
  if (score >= 50)  return { emoji: '🥇', label: 'Gold',     color: '#FFD700' }
  if (score >= 25)  return { emoji: '🥈', label: 'Silver',   color: '#C0C0C0' }
  if (score >= 10)  return { emoji: '🥉', label: 'Bronze',   color: '#CD7F32' }
  return            { emoji: '🎮',  label: 'Played',   color: '#FF3D00' }
}

/** Format a date as relative time */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 30)   return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Format a countdown from now to a target date */
export function formatCountdown(endsAt: string | Date): string {
  const target = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
  const diff   = target.getTime() - Date.now()

  if (diff <= 0) return 'Ended'

  const days    = Math.floor(diff / 86_400_000)
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)

  if (days > 0)   return `${days}d ${hours}h ${minutes}m`
  if (hours > 0)  return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

/** Generate avatar initials from a display name */
export function getInitials(name: string | null, username: string): string {
  const source = name || username
  return source
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}
