import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

interface GameRegistryEntry {
  type: 'builtin'
  slug: string
  component: ComponentType<{ gameId: string; gameSlug: string; mode?: string }>
}

const loadingUI = (
  <div className="w-full h-full flex items-center justify-center bg-black">
    <div className="text-center">
      <p className="text-2xl text-[var(--accent-primary)] mb-2"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
        LOADING...
      </p>
      <div className="w-32 h-1 bg-[var(--bg-card)] rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-[var(--accent-primary)] animate-pulse rounded-full w-1/2" />
      </div>
    </div>
  </div>
)

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'flappy-stokes': {
    type: 'builtin',
    slug: 'flappy-stokes',
    component: dynamic(() => import('./flappy-stokes/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'twin-trivia': {
    type: 'builtin',
    slug: 'twin-trivia',
    component: dynamic(() => import('./twin-trivia/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'twin-reaction': {
    type: 'builtin',
    slug: 'twin-reaction',
    component: dynamic(() => import('./twin-reaction/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'stokes-snake': {
    type: 'builtin',
    slug: 'stokes-snake',
    component: dynamic(() => import('./stokes-snake/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'face-dodge': {
    type: 'builtin',
    slug: 'face-dodge',
    component: dynamic(() => import('./face-dodge/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'stokes-runner': {
    type: 'builtin',
    slug: 'stokes-runner',
    component: dynamic(() => import('./stokes-runner/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'car-wash': {
    type: 'builtin',
    slug: 'car-wash',
    component: dynamic(() => import('./car-wash/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'camo-game': {
    type: 'builtin',
    slug: 'camo-game',
    component: dynamic(() => import('./camo-game/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
  'packing-peanuts': {
    type: 'builtin',
    slug: 'packing-peanuts',
    component: dynamic(() => import('./packing-peanuts/Game'), { ssr: false, loading: () => loadingUI as any }),
  },
}
