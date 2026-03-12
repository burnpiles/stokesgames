'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { REACTION_CONFIG, REACTION_SIGNALS } from './game.config'

type Phase = 'TITLE' | 'WAIT' | 'SIGNAL' | 'RESULT' | 'SCORE_SCREEN'

interface Props { gameId: string; gameSlug: string; mode?: string }

function getGrade(avgMs: number) {
  if (avgMs < 200) return { label: 'INSANE', emoji: '🔥', color: '#FF3D00' }
  if (avgMs < 250) return { label: 'ELITE', emoji: '⚡', color: '#FFD700' }
  if (avgMs < 300) return { label: 'FAST', emoji: '💨', color: '#00FF94' }
  if (avgMs < 400) return { label: 'AVERAGE', emoji: '👍', color: '#4A9EFF' }
  return { label: 'SLOW', emoji: '🐢', color: '#999' }
}

export default function TwinReaction({ gameId, gameSlug }: Props) {
  const [phase, setPhase] = useState<Phase>('TITLE')
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [signalStart, setSignalStart] = useState(0)
  const [lastReaction, setLastReaction] = useState<number | null>(null)
  const [isTooEarly, setIsTooEarly] = useState(false)
  const [personalBest, setPersonalBest] = useState(0)
  const [currentSignal, setCurrentSignal] = useState(REACTION_SIGNALS[0])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'twin-reaction', gameSlug: 'twin-reaction' })
    const pb = parseInt(localStorage.getItem('sg_pb_twin-reaction') ?? '0', 10)
    setPersonalBest(pb)
    sdkRef.current.onReady()
    return () => { sdkRef.current?.destroy(); sdkRef.current = null }
  }, [])

  const clearT = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const startRound = useCallback((currentRound: number) => {
    setIsTooEarly(false)
    setLastReaction(null)
    setPhase('WAIT')

    const delay = REACTION_CONFIG.minDelay + Math.random() * (REACTION_CONFIG.maxDelay - REACTION_CONFIG.minDelay)
    const sig = REACTION_SIGNALS[Math.floor(Math.random() * REACTION_SIGNALS.length)]
    setCurrentSignal(sig)

    timeoutRef.current = setTimeout(() => {
      setSignalStart(Date.now())
      setPhase('SIGNAL')

      // Auto-fail if no tap in 2s
      timeoutRef.current = setTimeout(() => {
        handleTap(currentRound, Date.now() - Date.now() + 2000)
      }, 2000)
    }, delay)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = useCallback((currentRound: number, forcedMs?: number) => {
    clearT()
    if (phase === 'WAIT') {
      // Too early
      setIsTooEarly(true)
      setTimes((prev) => [...prev, REACTION_CONFIG.tooEarlyPenalty])
      setLastReaction(null)
      setPhase('RESULT')
      return
    }
    if (phase !== 'SIGNAL') return

    const reactionMs = forcedMs ?? (Date.now() - signalStart)
    setLastReaction(reactionMs)
    setTimes((prev) => {
      const newTimes = [...prev, reactionMs]
      if (currentRound + 1 >= REACTION_CONFIG.rounds) {
        // Game over
        const avg = newTimes.reduce((s, t) => s + t, 0) / newTimes.length
        const finalScore = Math.min(
          Math.round(REACTION_CONFIG.scoreMultiplier / avg),
          REACTION_CONFIG.maxScore
        )
        sdkRef.current?.onGameOver(finalScore)
        if (finalScore > personalBest) {
          localStorage.setItem('sg_pb_twin-reaction', String(finalScore))
        }
        setPhase('SCORE_SCREEN')
      } else {
        setPhase('RESULT')
      }
      return newTimes
    })
  }, [phase, signalStart, clearT, personalBest])

  const handleScreenTap = useCallback(() => {
    if (phase === 'WAIT' || phase === 'SIGNAL') {
      handleTap(round)
    } else if (phase === 'RESULT') {
      const nextRound = round + 1
      setRound(nextRound)
      startRound(nextRound)
    }
  }, [phase, round, handleTap, startRound])

  const startGame = () => {
    setRound(0)
    setTimes([])
    setIsTooEarly(false)
    setLastReaction(null)
    sdkRef.current?.onStart()
    startRound(0)
  }

  // ── TITLE ──────────────────────────────────────────────────────────────────
  if (phase === 'TITLE') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] text-center px-6 select-none">
        <div className="text-6xl mb-4">⚡</div>
        <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          TWIN REACTION
        </h1>
        <p className="text-[#999] mb-2">Tap when the signal appears</p>
        <p className="text-[#666] text-sm mb-8">{REACTION_CONFIG.rounds} rounds · Don&apos;t tap early!</p>
        {personalBest > 0 && (
          <p className="text-[#FF3D00] text-sm mb-6" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            YOUR BEST: {personalBest}
          </p>
        )}
        <button
          onClick={startGame}
          className="px-10 py-4 bg-[#FF3D00] hover:bg-[#CC3100] text-white rounded-xl text-lg transition-all active:scale-95"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
        >
          START
        </button>
      </div>
    )
  }

  // ── SCORE SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'SCORE_SCREEN') {
    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length)
    const finalScore = Math.min(
      Math.round(REACTION_CONFIG.scoreMultiplier / avg),
      REACTION_CONFIG.maxScore
    )
    const grade = getGrade(avg)
    const isNewBest = finalScore > personalBest

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] text-center px-6 select-none">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        {isNewBest && (
          <div className="text-[#FFD700] text-sm mb-2 animate-bounce" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            ⭐ NEW BEST! ⭐
          </div>
        )}
        <p className="text-sm mb-1" style={{ color: grade.color, fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
          {grade.label}
        </p>
        <p className="text-6xl text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>{finalScore}</p>
        <p className="text-[#666] text-sm mb-4">avg {avg}ms reaction</p>

        {/* Per-round breakdown */}
        <div className="flex gap-2 mb-8">
          {times.map((t, i) => (
            <div key={i} className="text-center">
              <div
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: t >= REACTION_CONFIG.tooEarlyPenalty ? '#FF3D00/10' : '#111',
                  color: t >= REACTION_CONFIG.tooEarlyPenalty ? '#FF3D00' : '#00FF94',
                  fontFamily: 'var(--font-display)',
                  border: `1px solid ${t >= REACTION_CONFIG.tooEarlyPenalty ? '#FF3D00' : '#1E1E1E'}`,
                }}
              >
                {t >= REACTION_CONFIG.tooEarlyPenalty ? 'EARLY' : `${t}ms`}
              </div>
              <p className="text-[#555] text-xs mt-1">{i + 1}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-[#FF3D00] hover:bg-[#CC3100] text-white rounded-xl transition-all active:scale-95"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            RETRY
          </button>
          <button
            onClick={() => sdkRef.current?.showLeaderboard()}
            className="px-6 py-3 border border-[#1E1E1E] hover:border-[#FF3D00] text-[#999] hover:text-white rounded-xl transition-all"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    )
  }

  // ── WAIT ───────────────────────────────────────────────────────────────────
  if (phase === 'WAIT') {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] cursor-pointer select-none"
        onClick={handleScreenTap}
        onTouchStart={handleScreenTap}
      >
        <p className="text-[#333] text-2xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
          ROUND {round + 1} / {REACTION_CONFIG.rounds}
        </p>
        <div className="mt-6 w-4 h-4 rounded-full bg-[#1E1E1E] animate-pulse" />
        <p className="text-[#333] text-sm mt-6">wait for it...</p>
      </div>
    )
  }

  // ── SIGNAL ─────────────────────────────────────────────────────────────────
  if (phase === 'SIGNAL') {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none"
        style={{ background: currentSignal.bg }}
        onClick={handleScreenTap}
        onTouchStart={handleScreenTap}
      >
        <div className="text-8xl mb-4 animate-bounce">{currentSignal.emoji}</div>
        <p className="text-white text-5xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
          {currentSignal.label}
        </p>
        <p className="text-white/60 text-sm mt-4">TAP NOW!</p>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] cursor-pointer select-none"
      style={{ touchAction: 'none' }}
      onClick={handleScreenTap}
      onTouchStart={handleScreenTap}
    >
      {isTooEarly ? (
        <>
          <div className="text-6xl mb-4">❌</div>
          <p className="text-[#FF3D00] text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
            TOO EARLY!
          </p>
          <p className="text-[#666] text-sm">+{REACTION_CONFIG.tooEarlyPenalty}ms penalty</p>
        </>
      ) : (
        <>
          <div className="text-6xl mb-4">{lastReaction && lastReaction < 250 ? '🔥' : '✅'}</div>
          <p className="text-white text-5xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {lastReaction}ms
          </p>
          <p className="text-[#666] text-sm">
            {lastReaction && lastReaction < 200 ? 'INSANE reaction!' :
             lastReaction && lastReaction < 300 ? 'Great reaction!' : 'Keep going!'}
          </p>
        </>
      )}
      <p className="text-[#444] text-xs mt-8">tap to continue</p>
    </div>
  )
}
