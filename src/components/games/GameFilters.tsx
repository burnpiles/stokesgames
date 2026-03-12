'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'

const CATEGORIES = ['SPEED', 'STRATEGY', 'CHAOTIC', 'SPOOKY', 'MULTIPLAYER', 'TWIN_PICKS']
const SORT_OPTIONS = [
  { label: 'Trending',    value: 'trending' },
  { label: 'Newest',      value: 'newest' },
  { label: 'Top Rated',   value: 'rating' },
  { label: 'Most Played', value: 'plays' },
]

export function GameFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/games?${next.toString()}`)
    },
    [params, router]
  )

  const activeCategory = params.get('category') ?? ''
  const activeSort     = params.get('sort') ?? 'trending'
  const activeQuery    = params.get('q') ?? ''
  const hasActiveFilters = !!(activeCategory || activeSort !== 'trending' || activeQuery)

  return (
    <div>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white hover:border-[var(--accent-primary)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} />
          FILTERS
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          )}
        </div>
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Filter content — always visible on lg, toggleable on mobile */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block mt-3 lg:mt-0 space-y-6`}>
        {/* Search */}
        <div>
          <label className="flex items-center gap-2 text-xs tracking-widest text-[var(--text-muted)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}>
            <Search size={12} />
            SEARCH
          </label>
          <input
            type="text"
            placeholder="Search games…"
            defaultValue={activeQuery}
            onChange={(e) => update('q', e.target.value)}
            className="w-full px-3 py-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
          />
        </div>

        {/* Sort */}
        <div>
          <p className="text-xs tracking-widest text-[var(--text-muted)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}>
            SORT BY
          </p>
          <div className="space-y-1">
            {SORT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => update('sort', value)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeSort === value
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs tracking-widest text-[var(--text-muted)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}>
            CATEGORY
          </p>
          <div className="space-y-1">
            <button
              onClick={() => update('category', '')}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeCategory === ''
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => update('category', cat)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeCategory === cat
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => router.push('/games')}
            className="w-full text-xs text-[var(--text-muted)] hover:text-white border border-[var(--border)] hover:border-[var(--accent-primary)] rounded py-2 transition-all"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
