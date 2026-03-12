'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { useAudio } from '@/lib/game-engine/useAudio'
import { rectsCollide } from '@/lib/game-engine/collision'
import { GameSDK } from '@/lib/game-sdk'
import { GAME_CONFIG, type CharacterKey } from './game.config'
import { scoreMedal, formatScore } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type GameState = 'CHARACTER_SELECT' | 'TITLE' | 'PLAYING' | 'DEAD' | 'SCORE_SCREEN'

interface Pipe {
  x: number
  gapY: number
  gapH: number
  passed: boolean
  width: number
}

interface Bird {
  y: number
  vy: number
  rotation: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CFG = GAME_CONFIG

// ─── Main Component ───────────────────────────────────────────────────────────

interface FlappyStokesProps {
  gameId: string
  gameSlug: string
  mode?: string
}

export default function FlappyStokes({ gameId, gameSlug }: FlappyStokesProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const sdkRef     = useRef<GameSDK | null>(null)
  const stateRef   = useRef<GameState>('CHARACTER_SELECT')
  const birdRef    = useRef<Bird>({ y: 0, vy: 0, rotation: 0 })
  const pipesRef   = useRef<Pipe[]>([])
  const scoreRef   = useRef(0)
  const speedRef   = useRef(CFG.pipe.speedInitial)
  const gapRef     = useRef(CFG.pipe.gapInitial)
  const lastPipeRef = useRef(0)
  const charRef    = useRef<CharacterKey>('alex')
  const flapRef    = useRef(false)
  const deadTimerRef = useRef(0)

  const [gameState, setGameState] = useState<GameState>('CHARACTER_SELECT')
  const [score, setScore] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [personalBest, setPersonalBest] = useState(0)
  const [muted, setMuted] = useState(false)
  const [showMilestone, setShowMilestone] = useState('')
  const [character, setCharacter] = useState<CharacterKey>('alex')

  const audio = useAudio()

  // Load personal best
  useEffect(() => {
    const pb = parseInt(localStorage.getItem(`sg_fs_pb_${gameSlug}`) ?? '0', 10)
    setPersonalBest(pb)
  }, [gameSlug])

  // Init SDK
  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId, gameSlug })
    sdkRef.current.onReady()
    return () => sdkRef.current?.destroy()
  }, [gameId, gameSlug])

  // Sync mute state
  useEffect(() => {
    audio.setMuted(muted)
  }, [muted, audio])

  // Canvas sizing
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement!
      canvas.width  = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ─── Game logic ────────────────────────────────────────────────────────────

  const getCanvas = () => canvasRef.current
  const W = () => canvasRef.current?.width  ?? 400
  const H = () => canvasRef.current?.height ?? 600

  const resetGame = useCallback(() => {
    const canvas = getCanvas(); if (!canvas) return
    birdRef.current = {
      y:        H() * 0.45,
      vy:       0,
      rotation: 0,
    }
    pipesRef.current = []
    scoreRef.current = 0
    speedRef.current = CFG.pipe.speedInitial
    gapRef.current   = CFG.pipe.gapInitial
    lastPipeRef.current = 0
    setScore(0)
  }, [])

  const startGame = useCallback(() => {
    resetGame()
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')
    sdkRef.current?.onStart()
  }, [resetGame])

  const doFlap = useCallback(() => {
    if (stateRef.current === 'CHARACTER_SELECT') return

    if (stateRef.current === 'TITLE') {
      startGame()
      return
    }

    if (stateRef.current === 'PLAYING') {
      birdRef.current.vy = CFG.flapStrength
      audio.playFlap()
      flapRef.current = true
      setTimeout(() => { flapRef.current = false }, 100)
    }
  }, [startGame, audio])

  // Input listeners
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        doFlap()
      }
    }
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      doFlap()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouch, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouch)
    }
  }, [doFlap])

  // ─── Game loop ─────────────────────────────────────────────────────────────

  const isRunning = gameState === 'PLAYING' || gameState === 'DEAD'

  useGameLoop((delta) => {
    const canvas = getCanvas(); if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const groundH = h * CFG.ground.heightRatio
    const groundY = h - groundH
    const pipeW = w * CFG.pipe.widthRatio
    const birdX = w * CFG.bird.x
    const birdR = CFG.bird.radius

    const state = stateRef.current

    // ── Update physics (only when playing) ──
    if (state === 'PLAYING') {
      const bird = birdRef.current

      // Gravity
      bird.vy = Math.min(bird.vy + CFG.gravity, CFG.maxFallSpeed)
      bird.y += bird.vy

      // Rotation
      const targetRot = bird.vy < 0
        ? CFG.bird.rotateUp
        : Math.min((bird.vy / CFG.maxFallSpeed) * CFG.bird.rotateDown, CFG.bird.rotateDown)
      bird.rotation += (targetRot - bird.rotation) * 0.15

      // Spawn pipes
      const now = performance.now()
      const interval = Math.max(1000, CFG.pipe.spawnIntervalMs - scoreRef.current * 5)
      if (now - lastPipeRef.current > interval) {
        const gapY = groundH + (groundY - groundH - gapRef.current) * (0.2 + Math.random() * 0.6)
        pipesRef.current.push({
          x:      w + pipeW,
          gapY,
          gapH:   gapRef.current,
          passed: false,
          width:  pipeW,
        })
        lastPipeRef.current = now
      }

      // Move & score pipes
      for (const pipe of pipesRef.current) {
        pipe.x -= speedRef.current

        // Score
        if (!pipe.passed && pipe.x + pipe.width < birdX - birdR) {
          pipe.passed = true
          scoreRef.current++
          setScore(scoreRef.current)
          audio.playScore()
          speedRef.current += CFG.pipe.speedIncrement
          gapRef.current = Math.max(CFG.pipe.gapMin, gapRef.current - CFG.pipe.gapDecrement)

          // Milestone
          if (CFG.milestones.includes(scoreRef.current)) {
            setShowMilestone(`${scoreRef.current} 🔥`)
            setTimeout(() => setShowMilestone(''), 1200)
            audio.playMedal()
          }
        }
      }

      // Remove off-screen pipes
      pipesRef.current = pipesRef.current.filter((p) => p.x > -pipeW * 2)

      // ── Collision detection ──
      const birdRect = { x: birdX - birdR + 4, y: bird.y - birdR + 4, w: birdR * 2 - 8, h: birdR * 2 - 8 }

      // Ground / ceiling
      if (bird.y + birdR >= groundY || bird.y - birdR <= 0) {
        die()
        return
      }

      // Pipes
      for (const pipe of pipesRef.current) {
        const topPipe  = { x: pipe.x, y: 0,                w: pipe.width, h: pipe.gapY }
        const botPipe  = { x: pipe.x, y: pipe.gapY + pipe.gapH, w: pipe.width, h: groundY - pipe.gapY - pipe.gapH }
        if (rectsCollide(birdRect, topPipe) || rectsCollide(birdRect, botPipe)) {
          die()
          return
        }
      }
    }

    // Dead tumble animation
    if (state === 'DEAD') {
      const bird = birdRef.current
      bird.vy = Math.min(bird.vy + CFG.gravity * 1.5, CFG.maxFallSpeed * 1.5)
      bird.y  += bird.vy
      bird.rotation += 8

      deadTimerRef.current += delta
      if (deadTimerRef.current > 800) {
        stateRef.current = 'SCORE_SCREEN'
        setGameState('SCORE_SCREEN')
      }
    }

    // ── Draw ──
    draw(ctx, w, h, groundH, groundY, pipeW, birdX, birdR, state)
  }, isRunning)

  function die() {
    if (stateRef.current !== 'PLAYING') return
    stateRef.current = 'DEAD'
    setGameState('DEAD')
    deadTimerRef.current = 0
    audio.playDeath()

    const s = scoreRef.current
    setFinalScore(s)
    const pb = parseInt(localStorage.getItem(`sg_fs_pb_${gameSlug}`) ?? '0', 10)
    if (s > pb) {
      localStorage.setItem(`sg_fs_pb_${gameSlug}`, String(s))
      setPersonalBest(s)
    }
    sdkRef.current?.onGameOver(s, { character: charRef.current })
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    groundH: number, groundY: number,
    pipeW: number, birdX: number, birdR: number,
    state: GameState
  ) {
    const bird = birdRef.current
    const cfg = CFG.character[charRef.current]

    // ── Sky gradient ──
    const sky = ctx.createLinearGradient(0, 0, 0, groundY)
    sky.addColorStop(0, CFG.background.skyTop)
    sky.addColorStop(1, CFG.background.skyBottom)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    // ── Pipes ──
    for (const pipe of pipesRef.current) {
      drawPipe(ctx, pipe.x, 0, pipe.width, pipe.gapY)
      drawPipe(ctx, pipe.x, pipe.gapY + pipe.gapH, pipe.width, groundY - pipe.gapY - pipe.gapH)
    }

    // ── Ground ──
    ctx.fillStyle = CFG.background.groundColor
    ctx.fillRect(0, groundY, w, groundH)
    ctx.fillStyle = CFG.background.groundLine
    ctx.fillRect(0, groundY, w, 2)

    // ── Bird ──
    ctx.save()
    ctx.translate(birdX, bird.y)
    ctx.rotate((bird.rotation * Math.PI) / 180)

    const r = birdR

    // Body (round)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = cfg.bodyColor
    ctx.fill()
    ctx.strokeStyle = cfg.color
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Wing (animated flap)
    const wingY = flapRef.current ? -r * 0.55 : r * 0.28
    ctx.beginPath()
    ctx.ellipse(-r * 0.44, wingY, r * 0.54, r * 0.26, -0.25, 0, Math.PI * 2)
    ctx.fillStyle = cfg.color
    ctx.fill()

    // Skin-tone face area
    ctx.beginPath()
    ctx.ellipse(r * 0.1, r * 0.06, r * 0.6, r * 0.63, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#F4C09E'
    ctx.fill()

    // Left eye — white
    ctx.beginPath()
    ctx.arc(-r * 0.04, -r * 0.17, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    // Left pupil
    ctx.beginPath()
    ctx.arc(r * 0.0, -r * 0.18, r * 0.11, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()
    // Left highlight
    ctx.beginPath()
    ctx.arc(r * 0.04, -r * 0.24, r * 0.04, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // Right eye — white
    ctx.beginPath()
    ctx.arc(r * 0.3, -r * 0.17, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    // Right pupil
    ctx.beginPath()
    ctx.arc(r * 0.34, -r * 0.18, r * 0.11, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()
    // Right highlight
    ctx.beginPath()
    ctx.arc(r * 0.38, -r * 0.24, r * 0.04, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // Beak
    ctx.fillStyle = '#FFBF00'
    ctx.beginPath()
    ctx.moveTo(r * 0.6,  -r * 0.03)
    ctx.lineTo(r * 1.02,  r * 0.06)
    ctx.lineTo(r * 0.6,   r * 0.17)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#B38600'
    ctx.lineWidth = 1
    ctx.stroke()

    // Hair — dark spiky on top
    ctx.fillStyle = '#1A0A00'
    // Hair base cap
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.42, r * 0.9, r * 0.5, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    // Left spike
    ctx.beginPath()
    ctx.moveTo(-r * 0.52, -r * 0.82)
    ctx.lineTo(-r * 0.64, -r * 1.12)
    ctx.lineTo(-r * 0.36, -r * 0.86)
    ctx.closePath()
    ctx.fill()
    // Center spike
    ctx.beginPath()
    ctx.moveTo(-r * 0.14, -r * 0.88)
    ctx.lineTo(-r * 0.2,  -r * 1.2)
    ctx.lineTo(r * 0.06,  -r * 0.9)
    ctx.closePath()
    ctx.fill()
    // Right spike
    ctx.beginPath()
    ctx.moveTo(r * 0.22, -r * 0.8)
    ctx.lineTo(r * 0.18, -r * 1.06)
    ctx.lineTo(r * 0.44, -r * 0.82)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // ── Flame trail ──
    if (state === 'PLAYING' && flapRef.current) {
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        ctx.beginPath()
        ctx.arc(
          birdX - birdR - i * 6 + (Math.random() - 0.5) * 4,
          bird.y + (Math.random() - 0.5) * 8,
          (1 - t) * 5 + 1,
          0, Math.PI * 2
        )
        ctx.fillStyle = `rgba(255, ${60 + t * 100}, 0, ${1 - t})`
        ctx.fill()
      }
    }

    // ── Score (while playing) ──
    if (state === 'PLAYING' || state === 'DEAD') {
      ctx.font = `bold ${Math.round(w * 0.12)}px 'Bebas Neue', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillText(String(scoreRef.current), w / 2 + 2, h * 0.12 + 2)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(String(scoreRef.current), w / 2, h * 0.12)
    }
  }

  function drawPipe(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number
  ) {
    if (h <= 0) return
    // Body
    ctx.fillStyle = CFG.pipes.color
    ctx.fillRect(x, y, w, h)
    // Border
    ctx.strokeStyle = CFG.pipes.borderColor
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
    // SG label
    const capH = 18
    const isTop = y === 0
    const capY  = isTop ? h - capH : y
    ctx.fillStyle = '#AA0000'
    ctx.fillRect(x - 4, capY, w + 8, capH)
    ctx.strokeStyle = CFG.pipes.borderColor
    ctx.strokeRect(x - 4, capY, w + 8, capH)
    ctx.fillStyle = CFG.pipes.labelColor
    ctx.font = `bold ${Math.round(w * 0.5)}px 'Bebas Neue', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(CFG.pipes.label, x + w / 2, capY + capH / 2)
    ctx.textBaseline = 'alphabetic'
  }

  // ─── Select character ────────────────────────────────────────────────────────

  const selectCharacter = useCallback((char: CharacterKey) => {
    charRef.current = char
    setCharacter(char)
    stateRef.current = 'TITLE'
    setGameState('TITLE')

    // Draw initial frame
    const canvas = getCanvas(); if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const h = canvas.height
    birdRef.current = { y: h * 0.45, vy: 0, rotation: 0 }
  }, [])

  // ─── Restart ─────────────────────────────────────────────────────────────────

  const restart = useCallback(() => {
    stateRef.current = 'TITLE'
    setGameState('TITLE')
    resetGame()
  }, [resetGame])

  const medal = scoreMedal(finalScore)
  const isNewBest = finalScore > 0 && finalScore >= personalBest

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden"
      style={{ background: '#0A0A1A', touchAction: 'none' }}
      onClick={doFlap}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Mute toggle */}
      {gameState !== 'CHARACTER_SELECT' && (
        <button
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white"
          onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      )}

      {/* Milestone flash */}
      {showMilestone && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl text-white animate-[score-reveal_0.3s_ease] pointer-events-none z-30"
          style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 20px var(--accent-glow)' }}>
          {showMilestone}
        </div>
      )}

      {/* ─ Character Select Screen ─ */}
      {gameState === 'CHARACTER_SELECT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A1A]/95 z-10 p-6">
          <h1 className="text-4xl sm:text-6xl text-white mb-2 text-center"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            FLAPPY STOKES
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
            WHO&apos;S BETTER? Play to prove it.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            {(['alex', 'alan'] as CharacterKey[]).map((char) => {
              const c = CFG.character[char]
              return (
                <button
                  key={char}
                  onClick={(e) => { e.stopPropagation(); selectCharacter(char) }}
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-4xl border-4 group-hover:scale-110 transition-transform"
                    style={{ background: c.bodyColor, borderColor: c.color }}
                  >
                    {c.emoji}
                  </div>
                  <span className="text-white text-sm"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                    PLAY AS {c.label}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-[var(--text-muted)] text-xs mt-6 text-center">
            Top scores tracked separately per twin
          </p>
        </div>
      )}

      {/* ─ Title Screen ─ */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <p className="text-[var(--accent-primary)] text-sm tracking-widest mb-2 animate-pulse"
            style={{ fontFamily: 'var(--font-display)' }}>
            TAP TO START
          </p>
          {personalBest > 0 && (
            <p className="text-[var(--text-muted)] text-xs mt-2"
              style={{ fontFamily: 'var(--font-display)' }}>
              YOUR BEST: {personalBest}
            </p>
          )}
        </div>
      )}

      {/* ─ Score Screen ─ */}
      {gameState === 'SCORE_SCREEN' && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4 animate-[score-reveal_0.4s_ease]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-xs text-center">
            {medal && <div className="text-5xl mb-3">{medal.emoji}</div>}

            <p className="text-[var(--text-muted)] text-xs tracking-widest mb-1"
              style={{ fontFamily: 'var(--font-display)' }}>SCORE</p>
            <p className="text-6xl text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}>
              {formatScore(finalScore)}
            </p>

            {isNewBest && (
              <p className="text-[var(--gold)] text-xs tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-display)' }}>
                🏆 NEW BEST!
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-2">
                <p className="text-[var(--text-muted)] mb-0.5">BEST</p>
                <p className="text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatScore(Math.max(finalScore, personalBest))}
                </p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-2">
                <p className="text-[var(--text-muted)] mb-0.5">PLAYING AS</p>
                <p className="text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {CFG.character[character].label}
                </p>
              </div>
            </div>

            <button
              onClick={restart}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
            >
              <RotateCcw size={14} />
              TRY AGAIN
            </button>

            <button
              onClick={() => selectCharacter(character === 'alex' ? 'alan' : 'alex')}
              className="mt-2 w-full py-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Switch to {character === 'alex' ? 'Alan' : 'Alex'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
