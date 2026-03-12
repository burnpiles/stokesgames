'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play, Zap, Users } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { StokesScore } from './StokesScore'
import type { Game, GameBadge } from '@/types'

interface GameCardProps {
  game: Game
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const BADGE_STYLES: Record<GameBadge, { label: string; className: string }> = {
  NEW:        { label: 'NEW',        className: 'bg-[#4A9EFF] text-white' },
  HOT:        { label: '🔥 HOT',     className: 'bg-[var(--accent-secondary)] text-white' },
  TWIN_PICK:  { label: '⚡ TWIN PICK', className: 'bg-[var(--accent-primary)] text-white' },
  EXCLUSIVE:  { label: 'EXCLUSIVE',  className: 'bg-[#A855F7] text-white' },
  CHALLENGE:  { label: '🏆 CHALLENGE', className: 'bg-[var(--gold)] text-black' },
}

export function GameCard({ game, variant = 'default', className }: GameCardProps) {
  const primaryBadge = game.badges[0]

  return (
    <div
      className={cn(
        'group relative rounded-lg bg-[var(--bg-card)] overflow-hidden',
        'card-hover border-top-accent cursor-pointer',
        className
      )}
    >
      {/* Thumbnail */}
      <Link href={`/games/${game.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)]">
          <Image
            src={game.thumbnailUrl || `/games/${game.slug}/thumbnail.jpg`}
            alt={game.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              // Fallback to placeholder
              const img = e.currentTarget
              img.src = `https://placehold.co/800x450/161616/555555?text=${encodeURIComponent(game.title)}`
            }}
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play button overlay — visible on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-[var(--accent-primary)] text-white rounded-full p-4 shadow-[0_0_20px_var(--accent-glow)] scale-90 group-hover:scale-100 transition-transform duration-200">
              <Play size={24} fill="white" />
            </div>
          </div>

          {/* Badge top-left */}
          {primaryBadge && (
            <span
              className={cn(
                'absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] tracking-widest font-display',
                BADGE_STYLES[primaryBadge].className
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {BADGE_STYLES[primaryBadge].label}
            </span>
          )}

          {/* Instant Play indicator */}
          {game.isInstantPlay && (
            <span className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-[var(--success)] text-[10px] px-2 py-0.5 rounded">
              <Zap size={10} />
              <span className="font-display tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>INSTANT</span>
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate text-sm leading-tight">
                {game.title}
              </h3>
              <p className="text-[var(--text-muted)] text-xs mt-0.5 line-clamp-2">
                {game.description}
              </p>
            </div>
            <StokesScore score={game.stokesScore} size="sm" animated={false} className="shrink-0" />
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
              <Users size={11} />
              <span>{formatNumber(game.totalPlays)} plays</span>
            </div>
            {game.activePlayers && game.activePlayers > 0 && (
              <div className="flex items-center gap-1 text-[var(--success)] text-xs">
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                <span>{formatNumber(game.activePlayers)} playing</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Instant Play CTA */}
      <Link
        href={`/play/${game.slug}`}
        className="absolute bottom-0 left-0 right-0 bg-[var(--accent-primary)] text-white text-center py-2.5 text-sm font-display tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-200 hover:bg-[var(--accent-secondary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        ▶ PLAY NOW
      </Link>
    </div>
  )
}

/** Compact horizontal game row for leaderboard/search results */
export function GameRow({ game, className }: { game: Game; className?: string }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors',
        className
      )}
    >
      <div className="relative w-16 aspect-video rounded overflow-hidden bg-[var(--bg-secondary)] shrink-0">
        <Image
          src={game.thumbnailUrl || `/games/${game.slug}/thumbnail.jpg`}
          alt={game.title}
          fill
          unoptimized
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{game.title}</p>
        <p className="text-[var(--text-muted)] text-xs">{formatNumber(game.totalPlays)} plays</p>
      </div>
      <StokesScore score={game.stokesScore} size="sm" animated={false} />
    </Link>
  )
}

/** Skeleton placeholder for GameCard */
export function GameCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg bg-[var(--bg-card)] overflow-hidden border border-[var(--border)]', className)}>
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-1/2" />
      </div>
    </div>
  )
}
