import { cn, rankLabel, rankClass } from '@/lib/utils'
import type { RankTier } from '@/types'

interface RankBadgeProps {
  tier: RankTier
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const TIER_ICONS: Record<RankTier, string> = {
  ROOKIE:      '⬜',
  CONTENDER:   '🔷',
  ELITE:       '💜',
  'TWIN-LEVEL': '🔥',
  STOKEMASTER: '👑',
}

const TIER_BORDER: Record<RankTier, string> = {
  ROOKIE:       'border-[#444444]',
  CONTENDER:    'border-[#4A9EFF]',
  ELITE:        'border-[#A855F7]',
  'TWIN-LEVEL': 'border-[var(--accent-primary)]',
  STOKEMASTER:  'border-[var(--gold)]',
}

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
}

export function RankBadge({
  tier,
  size = 'sm',
  showLabel = true,
  className,
}: RankBadgeProps) {
  const isStokemaster = tier === 'STOKEMASTER'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-display tracking-wide',
        SIZE_CLASSES[size],
        TIER_BORDER[tier],
        'bg-[var(--bg-card)]',
        isStokemaster && 'glow-gold',
        className
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span>{TIER_ICONS[tier]}</span>
      {showLabel && (
        <span className={cn(isStokemaster ? 'rank-stokemaster' : rankClass(tier))}>
          {rankLabel(tier).toUpperCase()}
        </span>
      )}
    </span>
  )
}

/** Circular avatar ring colored by rank tier */
export function RankRing({
  tier,
  size = 40,
  children,
  className,
}: {
  tier: RankTier
  size?: number
  children?: React.ReactNode
  className?: string
}) {
  const ringColor: Record<RankTier, string> = {
    ROOKIE:       '#444444',
    CONTENDER:    '#4A9EFF',
    ELITE:        '#A855F7',
    'TWIN-LEVEL': '#FF3D00',
    STOKEMASTER:  '#FFD700',
  }

  const color = ringColor[tier]
  const isStokemaster = tier === 'STOKEMASTER'

  return (
    <div
      className={cn('relative rounded-full inline-flex items-center justify-center', className)}
      style={{
        padding: 3,
        background: isStokemaster
          ? 'linear-gradient(135deg, #FFD700, #FFA500, #FFEC6B)'
          : color,
        boxShadow: isStokemaster
          ? '0 0 20px rgba(255,215,0,0.5)'
          : `0 0 12px ${color}80`,
        width: size + 6,
        height: size + 6,
      }}
    >
      <div
        className="rounded-full overflow-hidden bg-[var(--bg-card)]"
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    </div>
  )
}
