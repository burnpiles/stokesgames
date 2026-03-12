'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2, X, ArrowLeft } from 'lucide-react'
import { cn, formatScore } from '@/lib/utils'
import { ScoreCard } from './ScoreCard'
import { ShareCard } from './ShareCard'
import { GAME_REGISTRY } from '@/games/registry'
import type { Game } from '@/types'

interface GamePlayerProps {
  game: Game
  mode?: 'normal' | 'challenge'
}

interface ScoreEvent {
  type: string
  score: number
  gameId: string
  gameSlug: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export function GamePlayer({ game, mode = 'normal' }: GamePlayerProps) {
  const [sessionScore, setSessionScore] = useState<number | null>(null)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [personalBest, setPersonalBest] = useState(0)
  const [rank, setRank] = useState<number | null>(null)
  const [showScoreCard, setShowScoreCard] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHUD, setShowHUD] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isBuiltin = game.type === 'builtin' && GAME_REGISTRY[game.slug]

  // Load personal best from local storage
  useEffect(() => {
    const stored = localStorage.getItem(`sg_pb_${game.slug}`)
    if (stored) setPersonalBest(parseInt(stored, 10))
  }, [game.slug])

  // postMessage bridge
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'object' || !e.data.type) return
      const data = e.data as ScoreEvent

      if (data.type === 'STOKES_GAME_OVER' || data.type === 'STOKES_SDK_GAME_OVER') {
        const score = Math.floor(data.score ?? 0)
        if (score <= 0 || score > game.maxScore) return  // anti-cheat

        setFinalScore(score)
        setSessionScore(score)

        const isNewBest = score > personalBest
        if (isNewBest) {
          setPersonalBest(score)
          localStorage.setItem(`sg_pb_${game.slug}`, String(score))
        }

        // Submit to API
        submitScore(game.id, score, data.metadata)
          .then((res) => { if (res?.rank) setRank(res.rank) })
          .catch(console.error)

        setShowScoreCard(true)
      }

      if (data.type === 'STOKES_GAME_START') {
        setShowScoreCard(false)
        setSessionScore(null)
      }
    }

    const handleSdkEvent = (e: Event) => {
      handleMessage({ data: (e as CustomEvent).detail } as MessageEvent)
    }

    // Listen from iframe (Type B/C) and custom events (Type A)
    window.addEventListener('message', handleMessage)
    window.addEventListener('stokes:sdk' as keyof WindowEventMap, handleSdkEvent)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('stokes:sdk' as keyof WindowEventMap, handleSdkEvent)
    }
  }, [game.id, game.slug, game.maxScore, personalBest])

  const handlePlayAgain = useCallback(() => {
    setShowScoreCard(false)
    setFinalScore(null)
    setSessionScore(null)
    // Tell iframe to restart
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'STOKES_RESTART' },
      '*'
    )
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const BuiltinGame = isBuiltin ? GAME_REGISTRY[game.slug].component : null

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col bg-black',
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100dvh-64px)]'
      )}
    >
      {/* Top bar */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 bg-[var(--bg-primary)] border-b border-[var(--border)] transition-opacity',
          !showHUD && 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-3">
          <Link href={`/games/${game.slug}`} className="text-[var(--text-muted)] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span
            className="text-white text-sm"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            {game.title.toUpperCase()}
          </span>
          {mode === 'challenge' && (
            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent-primary)] text-white rounded tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}>
              CHALLENGE MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {sessionScore !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)] text-xs">SCORE</span>
              <span
                className="score-number text-[var(--accent-primary)] text-lg"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formatScore(sessionScore)}
              </span>
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="text-[var(--text-muted)] hover:text-white transition-colors p-1"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <Link href={`/games/${game.slug}`} className="text-[var(--text-muted)] hover:text-white transition-colors p-1">
            <X size={16} />
          </Link>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Type A: built-in React component */}
        {BuiltinGame && (
          <div className="w-full h-full">
            <BuiltinGame gameId={game.id} gameSlug={game.slug} mode={mode} />
          </div>
        )}

        {/* Type B/C: iframe embed */}
        {!BuiltinGame && (
          <iframe
            ref={iframeRef}
            src={game.embedUrl}
            title={game.title}
            className="w-full h-full border-none"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => {/* handled by error boundary */}}
          />
        )}

        {/* Score card overlay */}
        {showScoreCard && finalScore !== null && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10 animate-[score-reveal_0.4s_ease]">
            <ScoreCard
              score={finalScore}
              game={game}
              rank={rank}
              personalBest={personalBest}
              isPersonalBest={finalScore >= personalBest}
              onPlayAgain={handlePlayAgain}
              onShare={() => setShowShareCard(true)}
            />
          </div>
        )}
      </div>

      {/* Share card overlay */}
      {showShareCard && finalScore !== null && (
        <ShareCard
          game={game}
          score={finalScore}
          rank={rank ?? undefined}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Bottom HUD (collapsible) */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 bg-[var(--bg-primary)] border-t border-[var(--border)] transition-all duration-200',
          !showHUD && 'opacity-0 pointer-events-none h-0 py-0 border-0 overflow-hidden'
        )}
      >
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>BEST: <span className="text-white">{formatScore(personalBest)}</span></span>
          {rank && <span>RANK: <span className="text-[var(--accent-primary)]">#{rank}</span></span>}
        </div>
        <button
          onClick={() => setShowHUD(false)}
          className="text-[var(--text-muted)] text-xs hover:text-white transition-colors"
        >
          Hide HUD
        </button>
      </div>

      {/* Sticky restore tab — only visible when HUD is hidden */}
      {!showHUD && (
        <button
          onClick={() => setShowHUD(true)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-t-lg text-[10px] transition-colors z-20"
          style={{
            background: 'rgba(20,20,20,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            color: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(4px)',
          }}
          aria-label="Show HUD"
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
            <path d="M5 0L0 6h10L5 0z" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>HUD</span>
        </button>
      )}
    </div>
  )
}

async function submitScore(
  gameId: string,
  score: number,
  metadata?: Record<string, unknown>
): Promise<{ rank: number } | null> {
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, score, metadata }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
