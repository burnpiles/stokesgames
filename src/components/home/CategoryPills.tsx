'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'ALL',        emoji: '🎮', value: '' },
  { label: 'SPEED',      emoji: '⚡', value: 'SPEED' },
  { label: 'STRATEGY',   emoji: '🧠', value: 'STRATEGY' },
  { label: 'CHAOTIC',    emoji: '🔥', value: 'CHAOTIC' },
  { label: 'SPOOKY',     emoji: '👻', value: 'SPOOKY' },
  { label: 'MULTIPLAYER',emoji: '🤝', value: 'MULTIPLAYER' },
  { label: 'TWIN PICKS', emoji: '⭐', value: 'TWIN_PICKS' },
]

export function CategoryPills() {
  const params = useSearchParams()
  const active = params.get('category') ?? ''

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {CATEGORIES.map(({ label, emoji, value }) => (
        <Link
          key={value}
          href={value ? `/games?category=${value}` : '/games'}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-all shrink-0',
            active === value
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-white'
          )}
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </Link>
      ))}
    </div>
  )
}
