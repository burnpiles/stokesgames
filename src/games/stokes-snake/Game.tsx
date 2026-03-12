'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { SNAKE_CONFIG } from './game.config'

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'TITLE' | 'PLAYING' | 'DEAD' | 'SCORE_SCREEN'
type Point = { x: number; y: number }

interface Props { gameId: string; gameSlug: string; mode?: string }

const G = SNAKE_CONFIG.gridSize

function randomCell(snake: Point[]): Point {
  let cell: Point
  do { cell = { x: Math.floor(Math.random() * G), y: Math.floor(Math.random() * G) } }
  while (snake.some((s) => s.x === cell.x && s.y === cell.y))
  return cell
}

export default function StokesSnake({ gameId, gameSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('TITLE')
  const [score, setScore] = useState(0)
  const [personalBest, setPersonalBest] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const foodRef = useRef<Point>({ x: 5, y: 5 })
  const dirRef = useRef<Dir>('RIGHT')
  const nextDirRef = useRef<Dir>('RIGHT')
  const scoreRef = useRef(0)
  const speedRef = useRef(SNAKE_CONFIG.initialSpeed)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef<GameState>('TITLE')
  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'stokes-snake', gameSlug: 'stokes-snake' })
    const pb = parseInt(localStorage.getItem('sg_pb_stokes-snake') ?? '0', 10)
    setPersonalBest(pb)
    sdkRef.current.onReady()
    return () => { sdkRef.current?.destroy(); sdkRef.current = null }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const cell = Math.min(width, height) / G

    ctx.fillStyle = SNAKE_CONFIG.colors.bg
    ctx.fillRect(0, 0, width, height)

    const gridW = G * cell

    // Grid lines (more visible)
    ctx.strokeStyle = SNAKE_CONFIG.colors.grid
    ctx.lineWidth = 1
    for (let i = 0; i <= G; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cell, 0)
      ctx.lineTo(i * cell, gridW)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cell)
      ctx.lineTo(gridW, i * cell)
      ctx.stroke()
    }

    // Bold border around play area
    ctx.strokeStyle = SNAKE_CONFIG.colors.gridBorder
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, gridW, gridW)

    // Food — YouTube play button (red rounded rect + white triangle)
    const f = foodRef.current
    const fx = f.x * cell + cell / 2, fy = f.y * cell + cell / 2
    const btnW = cell - 4, btnH = Math.round((cell - 4) * 0.72)
    const bx = fx - btnW / 2, by = fy - btnH / 2
    // Glow
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = '#FF0000'
    // Red rounded rect
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.roundRect(bx, by, btnW, btnH, 4)
    ctx.fill()
    // White play triangle
    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFFFFF'
    const tSize = btnH * 0.44
    const tx = fx - tSize * 0.36, ty = fy
    ctx.beginPath()
    ctx.moveTo(tx - tSize * 0.5, ty - tSize * 0.6)
    ctx.lineTo(tx - tSize * 0.5, ty + tSize * 0.6)
    ctx.lineTo(tx + tSize * 0.7, ty)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Snake
    snakeRef.current.forEach((seg, i) => {
      const isHead = i === 0
      ctx.fillStyle = isHead ? SNAKE_CONFIG.colors.snakeHead : SNAKE_CONFIG.colors.snake
      const pad = isHead ? 1 : 2
      ctx.beginPath()
      ctx.roundRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, isHead ? 6 : 4)
      ctx.fill()
      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#0A0A0A'
        const ex = dirRef.current === 'LEFT' ? 4 : dirRef.current === 'RIGHT' ? cell - 8 : cell / 2 - 4
        const ey = dirRef.current === 'UP' ? 4 : dirRef.current === 'DOWN' ? cell - 8 : cell / 2 - 4
        ctx.beginPath(); ctx.arc(seg.x * cell + ex, seg.y * cell + ey, 2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(seg.x * cell + ex + (dirRef.current === 'UP' || dirRef.current === 'DOWN' ? 8 : 0), seg.y * cell + ey + (dirRef.current === 'LEFT' || dirRef.current === 'RIGHT' ? 8 : 0), 2, 0, Math.PI * 2); ctx.fill()
      }
    })

    // Score HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, width, 28)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold 14px "Bebas Neue", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`SCORE: ${scoreRef.current}`, 8, 14)
    ctx.textAlign = 'right'
    ctx.fillText(`BEST: ${personalBest}`, width - 8, 14)
  }, [personalBest])

  const tick = useCallback(() => {
    if (stateRef.current !== 'PLAYING') return
    const snake = snakeRef.current
    dirRef.current = nextDirRef.current

    const head = snake[0]
    let nx = head.x, ny = head.y
    if (dirRef.current === 'UP') ny--
    else if (dirRef.current === 'DOWN') ny++
    else if (dirRef.current === 'LEFT') nx--
    else nx++

    // Wall collision
    if (nx < 0 || nx >= G || ny < 0 || ny >= G) { endGame(); return }
    // Self collision
    if (snake.some((s) => s.x === nx && s.y === ny)) { endGame(); return }

    const newHead = { x: nx, y: ny }
    const ateFood = nx === foodRef.current.x && ny === foodRef.current.y
    const newSnake = [newHead, ...snake]
    if (!ateFood) newSnake.pop()
    snakeRef.current = newSnake

    if (ateFood) {
      const newScore = scoreRef.current + SNAKE_CONFIG.pointsPerFood
      scoreRef.current = newScore
      setScore(newScore)
      foodRef.current = randomCell(newSnake)
      // Speed up
      speedRef.current = Math.max(SNAKE_CONFIG.minSpeed, speedRef.current - SNAKE_CONFIG.speedIncrement)
      // Restart interval with new speed
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(tick, speedRef.current)
    }

    draw()
  }, [draw]) // eslint-disable-line react-hooks/exhaustive-deps

  const endGame = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    stateRef.current = 'DEAD'
    const s = scoreRef.current
    setFinalScore(s)
    sdkRef.current?.onGameOver(s)
    if (s > personalBest) {
      localStorage.setItem('sg_pb_stokes-snake', String(s))
      setPersonalBest(s)
    }
    setTimeout(() => setGameState('SCORE_SCREEN'), 600)
  }, [personalBest])

  const startGame = useCallback(() => {
    const initSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
    snakeRef.current = initSnake
    foodRef.current = randomCell(initSnake)
    dirRef.current = 'RIGHT'
    nextDirRef.current = 'RIGHT'
    scoreRef.current = 0
    speedRef.current = SNAKE_CONFIG.initialSpeed
    setScore(0)
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')
    sdkRef.current?.onStart()

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(tick, speedRef.current)
  }, [tick])

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      }
      const dir = map[e.key]
      if (!dir) return
      const opposite: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
      if (dir !== opposite[dirRef.current]) nextDirRef.current = dir
      e.preventDefault()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Canvas resize — uses ResizeObserver so it fires once the flex layout is painted
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement!
    const doResize = () => {
      const w = parent.clientWidth
      // clientHeight can be 0 in a flex chain before layout; fall back to window minus nav + huds (~144px)
      const h = parent.clientHeight || Math.max(window.innerHeight - 144, 200)
      const size = Math.min(w, h)
      if (size <= 0) return
      canvas.width = size
      canvas.height = size
      draw()
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent)
    doResize()
    return () => ro.disconnect()
  }, [draw])

  // Swipe controls
  useEffect(() => {
    let sx = 0, sy = 0
    const onStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx
      const dy = e.changedTouches[0].clientY - sy
      const opposite: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
      let dir: Dir
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'RIGHT' : 'LEFT'
      else dir = dy > 0 ? 'DOWN' : 'UP'
      if (dir !== opposite[dirRef.current]) nextDirRef.current = dir
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const isNewBest = finalScore >= personalBest

  // Canvas is always mounted so the ResizeObserver fires correctly.
  // TITLE and SCORE_SCREEN are absolute overlays on top of the canvas.
  return (
    <div className="absolute inset-0 bg-[#0A0A0A]" style={{ touchAction: 'none' }}>
      {/* Always-present canvas */}
      <div className="w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="block" style={{ imageRendering: 'pixelated' }} />
      </div>

      {/* ── TITLE overlay ──────────────────────────────────────────────────── */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] text-center px-6 select-none">
          <div className="text-6xl mb-4">🐍</div>
          <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            STOKES SNAKE
          </h1>
          <p className="text-[#999] mb-2">Classic snake, StokeGames style</p>
          <p className="text-[#666] text-sm mb-8">Arrow keys or WASD · Swipe on mobile</p>
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
            PLAY
          </button>
        </div>
      )}

      {/* ── SCORE SCREEN overlay ───────────────────────────────────────────── */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] text-center px-6 select-none">
          <div className="text-5xl mb-3">{finalScore >= 200 ? '👑' : finalScore >= 100 ? '🥇' : '🐍'}</div>
          {isNewBest && finalScore > 0 && (
            <div className="text-[#FFD700] text-sm mb-2 animate-bounce" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
              ⭐ NEW BEST! ⭐
            </div>
          )}
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>GAME OVER</h2>
          <p className="text-6xl mb-2" style={{ color: '#FF3D00', fontFamily: 'var(--font-display)' }}>{finalScore}</p>
          <p className="text-[#666] text-sm mb-8">Length: {snakeRef.current.length} segments</p>
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-[#FF3D00] hover:bg-[#CC3100] text-white rounded-xl transition-all active:scale-95"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
            >
              PLAY AGAIN
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
      )}
    </div>
  )
}
