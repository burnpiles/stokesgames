'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { RUNNER_CONFIG } from './game.config'

type Character = 'ALEX' | 'ALAN'
type GameState = 'CHARACTER_SELECT' | 'PLAYING' | 'DEAD' | 'SCORE_SCREEN'

interface Obstacle {
  id: number; x: number; w: number; h: number
  style: 'low' | 'tall' | 'wide'
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string
}

interface Props { gameId: string; gameSlug: string; mode?: string }

let obsId = 0

const CHAR_CFG = {
  ALEX: { hoodie: '#1E90FF', hoodieDark: '#1060B0', pocket: '#0840A0', glow: 'rgba(30,144,255,0.45)', trail: '#1E90FF' },
  ALAN: { hoodie: '#FF3D00', hoodieDark: '#CC3100', pocket: '#8B1A00', glow: 'rgba(255,61,0,0.45)',   trail: '#FF3D00'   },
} as const

function drawRunner(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, frame: number, char: Character) {
  const c = CHAR_CFG[char]
  const s = pw / 7
  const leg = frame % 18 < 9

  // Hair
  ctx.fillStyle = '#3A2010'
  ctx.fillRect(px + s * 1.5, py, s * 4, s)
  ctx.fillRect(px + s, py - s * 1.2, s, s * 1.2)
  ctx.fillRect(px + s * 2.5, py - s * 1.8, s, s * 1.8)
  ctx.fillRect(px + s * 4, py - s * 1.2, s, s * 1.2)
  ctx.fillRect(px + s * 5, py, s, s * 2)
  // Face
  ctx.fillStyle = '#F5C5A3'
  ctx.fillRect(px + s * 1.5, py + s, s * 3.5, s * 2.5)
  // Eye
  ctx.fillStyle = '#1A1A1A'
  ctx.fillRect(px + s * 3, py + s * 1.5, s * 0.9, s * 0.9)
  ctx.fillStyle = '#FFF'
  ctx.fillRect(px + s * 3, py + s * 1.5, s * 0.35, s * 0.35)
  // Cheek
  ctx.fillStyle = 'rgba(255,140,120,0.5)'
  ctx.fillRect(px + s * 1.8, py + s * 2.5, s * 1.2, s * 0.7)
  // Arms (animated)
  ctx.fillStyle = c.hoodie
  if (leg) {
    ctx.fillRect(px + s * 5.5, py + s * 3.5, s * 1.5, s * 2.5) // back arm back
    ctx.fillRect(px - s * 0.5, py + s * 4.5, s * 1.5, s * 2)   // front arm forward
  } else {
    ctx.fillRect(px + s * 5.5, py + s * 4.5, s * 1.5, s * 2)
    ctx.fillRect(px - s * 0.5, py + s * 3.5, s * 1.5, s * 2.5)
  }
  // Hoodie body
  ctx.fillStyle = c.hoodie
  ctx.fillRect(px + s * 0.5, py + s * 3.5, s * 6, s * 3.5)
  ctx.fillStyle = c.hoodieDark
  ctx.fillRect(px + s * 0.5, py + s * 3.5, s * 6, s * 0.8) // collar
  ctx.fillStyle = '#FFF'
  ctx.fillRect(px + s * 2.8, py + s * 4.2, s * 0.4, s * 1.5)
  ctx.fillRect(px + s * 3.8, py + s * 4.2, s * 0.4, s * 1.5)
  ctx.fillStyle = c.pocket
  ctx.fillRect(px + s * 2, py + s * 5, s * 3, s * 1.5)
  // Jeans
  ctx.fillStyle = '#3A5AB0'
  if (leg) {
    ctx.fillRect(px + s * 0.5, py + s * 7, s * 2.5, s * 3.5)
    ctx.fillRect(px + s * 3.5, py + s * 7.5, s * 2.5, s * 3)
  } else {
    ctx.fillRect(px + s * 0.5, py + s * 7.5, s * 2.5, s * 3)
    ctx.fillRect(px + s * 3.5, py + s * 7, s * 2.5, s * 3.5)
  }
  ctx.fillStyle = '#243880'
  if (leg) {
    ctx.fillRect(px + s * 0.5, py + s * 9, s * 2.5, s * 0.7)
  } else {
    ctx.fillRect(px + s * 3.5, py + s * 9, s * 2.5, s * 0.7)
  }
  // Shoes
  ctx.fillStyle = '#E8E8E8'
  if (leg) {
    ctx.fillRect(px, py + s * 10.5, s * 3.5, s)
    ctx.fillRect(px + s * 3.5, py + s * 10.5, s * 2.5, s)
  } else {
    ctx.fillRect(px, py + s * 10.5, s * 2.5, s)
    ctx.fillRect(px + s * 3, py + s * 10.5, s * 3.5, s)
  }
  ctx.fillStyle = '#888'
  ctx.fillRect(px, py + s * 11.4, s * 3.5, s * 0.3)
}

function drawJungleObstacle(ctx: CanvasRenderingContext2D, ox: number, oy: number, ow: number, oh: number, style: 'low' | 'tall' | 'wide') {
  if (style === 'tall') {
    // Bamboo pole
    ctx.fillStyle = '#5A8A2A'
    ctx.fillRect(ox, oy, ow, oh)
    ctx.fillStyle = '#6FA832'
    ctx.fillRect(ox + 2, oy, ow - 4, oh)
    // Nodes
    ctx.fillStyle = '#3D6018'
    for (let y = oy + 12; y < oy + oh; y += 14) {
      ctx.fillRect(ox - 2, y, ow + 4, 3)
    }
    // Leaves at top
    ctx.fillStyle = '#4A9A20'
    ctx.fillRect(ox - 6, oy, ow + 12, 8)
    ctx.fillRect(ox - 3, oy - 6, ow + 6, 6)
  } else if (style === 'wide') {
    // Fallen mossy log
    ctx.fillStyle = '#5C3A1A'
    ctx.fillRect(ox, oy, ow, oh)
    ctx.fillStyle = '#6B4422'
    ctx.fillRect(ox + 3, oy + 3, ow - 6, oh - 6)
    // Grain lines
    ctx.fillStyle = '#4A2E12'
    for (let xi = ox + 8; xi < ox + ow - 4; xi += 8) {
      ctx.fillRect(xi, oy + 2, 2, oh - 4)
    }
    // Moss on top
    ctx.fillStyle = '#3A7A20'
    ctx.fillRect(ox + 2, oy, ow - 4, 5)
    ctx.fillStyle = '#2A6018'
    ctx.fillRect(ox + 6, oy - 3, 8, 4); ctx.fillRect(ox + 22, oy - 4, 6, 4)
    if (ow > 40) { ctx.fillRect(ox + 36, oy - 2, 8, 3) }
    // End rings
    ctx.fillStyle = '#3A2010'
    ctx.fillRect(ox, oy, 5, oh); ctx.fillRect(ox + ow - 5, oy, 5, oh)
  } else {
    // Stone ruin slab
    ctx.fillStyle = '#6A6A5A'
    ctx.fillRect(ox, oy, ow, oh)
    ctx.fillStyle = '#7A7A6A'
    ctx.fillRect(ox + 2, oy + 2, ow - 4, oh - 4)
    // Cracks
    ctx.fillStyle = '#5A5A4A'
    ctx.fillRect(ox + 4, oy + 4, 2, oh - 8); ctx.fillRect(ox + ow - 6, oy + 6, 2, oh - 10)
    ctx.fillRect(ox + 8, oy + oh / 2, ow - 16, 2)
    // Moss patches
    ctx.fillStyle = '#3A5A28'
    ctx.fillRect(ox + 2, oy, 6, 4); ctx.fillRect(ox + ow - 10, oy, 7, 3)
    // Highlight
    ctx.fillStyle = '#9A9A8A'
    ctx.fillRect(ox, oy, ow, 2); ctx.fillRect(ox, oy, 2, oh)
  }
}

export default function StokesRunner({ gameId, gameSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('CHARACTER_SELECT')
  const [personalBest, setPersonalBest] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  const stateRef = useRef<GameState>('CHARACTER_SELECT')
  const charRef = useRef<Character>('ALAN')
  const playerRef = useRef({ x: 80, y: 0, vy: 0, jumping: false, doubleJumped: false, dead: false })
  const obstaclesRef = useRef<Obstacle[]>([])
  const particlesRef = useRef<Particle[]>([])
  const scoreRef = useRef(0)
  const speedRef = useRef(RUNNER_CONFIG.initialSpeed)
  const frameRef = useRef(0)
  const spawnCountdownRef = useRef(80)
  const scrollRef = useRef(0) // universal scroll offset for parallax
  const groundParticlesRef = useRef<number[]>(Array.from({ length: 14 }, () => Math.random() * 800))
  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'stokes-runner', gameSlug: 'stokes-runner' })
    const pb = parseInt(localStorage.getItem('sg_pb_stokes-runner') ?? '0', 10)
    setPersonalBest(pb)
    sdkRef.current.onReady()
    return () => { sdkRef.current?.destroy(); sdkRef.current = null }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement!
    const doResize = () => {
      const w = parent.clientWidth
      const h = parent.clientHeight || Math.max(window.innerHeight - 144, 300)
      if (w <= 0 || h <= 0) return
      canvas.width = w; canvas.height = h
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent); doResize()
    return () => ro.disconnect()
  }, [])

  const jump = useCallback(() => {
    if (stateRef.current !== 'PLAYING') return
    const p = playerRef.current
    if (!p.jumping) { p.vy = RUNNER_CONFIG.jumpStrength; p.jumping = true }
    else if (!p.doubleJumped) { p.vy = RUNNER_CONFIG.doubleJumpStrength; p.doubleJumped = true }
  }, [])

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') { jump(); e.preventDefault() }
    }
    const td = (e: TouchEvent) => { jump(); e.preventDefault() }
    const md = (e: MouseEvent) => { if (e.button === 0) jump() }
    window.addEventListener('keydown', kd)
    window.addEventListener('touchstart', td, { passive: false })
    window.addEventListener('mousedown', md)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('touchstart', td)
      window.removeEventListener('mousedown', md)
    }
  }, [jump])

  const endGame = useCallback(() => {
    stateRef.current = 'DEAD'
    playerRef.current.dead = true
    const s = Math.floor(scoreRef.current)
    setFinalScore(s)
    sdkRef.current?.onGameOver(s)
    const pb = parseInt(localStorage.getItem('sg_pb_stokes-runner') ?? '0', 10)
    if (s > pb) { localStorage.setItem('sg_pb_stokes-runner', String(s)); setPersonalBest(s) }
    setTimeout(() => { stateRef.current = 'SCORE_SCREEN'; setGameState('SCORE_SCREEN') }, 1000)
  }, [])

  const startGame = useCallback((char?: Character) => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (char) charRef.current = char
    const groundY = canvas.height * RUNNER_CONFIG.groundY
    obstaclesRef.current = []
    particlesRef.current = []
    playerRef.current = { x: 80, y: groundY - RUNNER_CONFIG.playerHeight, vy: 0, jumping: false, doubleJumped: false, dead: false }
    scoreRef.current = 0
    speedRef.current = RUNNER_CONFIG.initialSpeed
    frameRef.current = 0
    spawnCountdownRef.current = 80
    scrollRef.current = 0
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')
    sdkRef.current?.onStart()
  }, [])

  const gameLoop = useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas || (stateRef.current !== 'PLAYING' && stateRef.current !== 'DEAD')) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const groundY = height * RUNNER_CONFIG.groundY
    const p = playerRef.current
    const alive = stateRef.current === 'PLAYING'
    const char = charRef.current
    const cc = CHAR_CFG[char]

    if (alive) {
      // Physics
      p.vy += RUNNER_CONFIG.gravity * (dt / 16)
      p.y += p.vy * (dt / 16)
      if (p.y >= groundY - RUNNER_CONFIG.playerHeight) {
        p.y = groundY - RUNNER_CONFIG.playerHeight
        p.vy = 0; p.jumping = false; p.doubleJumped = false
      }

      speedRef.current = Math.min(speedRef.current + RUNNER_CONFIG.speedIncrement * dt, RUNNER_CONFIG.maxSpeed)
      scrollRef.current += speedRef.current * (dt / 16)

      // Spawn obstacle
      spawnCountdownRef.current -= dt / 16
      if (spawnCountdownRef.current <= 0) {
        const styles: Array<'low' | 'tall' | 'wide'> = ['low', 'tall', 'wide']
        const obsConfigs = RUNNER_CONFIG.obstacles
        const idx = Math.floor(Math.random() * obsConfigs.length)
        obstaclesRef.current.push({
          id: obsId++, x: width + 20,
          w: obsConfigs[idx].width, h: obsConfigs[idx].height, style: styles[idx],
        })
        spawnCountdownRef.current = 60 + Math.random() * 60
      }

      for (const obs of obstaclesRef.current) obs.x -= speedRef.current * (dt / 16)
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -o.w - 10)

      // Collision
      for (const obs of obstaclesRef.current) {
        const pw = RUNNER_CONFIG.playerWidth, ph = RUNNER_CONFIG.playerHeight, m = 6
        if (p.x + pw - m > obs.x + m && p.x + m < obs.x + obs.w - m &&
          p.y + ph - m > groundY - obs.h && p.y + m < groundY) {
          const char = charRef.current
          const cc = CHAR_CFG[char]
          for (let i = 0; i < 24; i++) {
            particlesRef.current.push({
              x: p.x + pw / 2, y: p.y + ph / 2,
              vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 4,
              life: 1, color: i % 2 === 0 ? cc.hoodie : '#FFD700',
            })
          }
          endGame(); return
        }
      }

      // Score (framerate-independent float accumulation)
      scoreRef.current += dt / 16
      frameRef.current++
    }

    for (const pt of particlesRef.current) {
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.3; pt.life -= 0.025
    }
    particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0)

    // ── Draw ────────────────────────────────────────────────────────────────
    // Sky gradient — warm jungle sunset
    const sky = ctx.createLinearGradient(0, 0, 0, groundY)
    sky.addColorStop(0, '#05100A')
    sky.addColorStop(0.4, '#0A2010')
    sky.addColorStop(1, '#152A0A')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, width, groundY)

    // Moon glow
    const moonX = width * 0.82, moonY = groundY * 0.18
    const moonGrd = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 100)
    moonGrd.addColorStop(0, 'rgba(255,240,180,0.25)')
    moonGrd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = moonGrd
    ctx.fillRect(moonX - 100, moonY - 100, 200, 200)
    ctx.fillStyle = '#FFF8D0'
    ctx.fillRect(moonX - 10, moonY - 10, 20, 20)
    ctx.fillStyle = '#FFFAEE'
    ctx.fillRect(moonX - 7, moonY - 7, 14, 14)

    // Far silhouette mountains
    ctx.fillStyle = '#0A1E0A'
    const mOffX = (scrollRef.current * 0.05) % width
    const mtns = [0.05,0.18,0.31,0.44,0.57,0.70,0.83,0.96]
    const mtnH = [0.28,0.38,0.25,0.42,0.32,0.36,0.22,0.40]
    for (let mi = -1; mi <= 1; mi++) {
      for (let mii = 0; mii < mtns.length; mii++) {
        const mx = (mtns[mii] * width - mOffX + mi * width + width) % (width * 2) - width * 0.5
        const mh = mtnH[mii] * groundY
        ctx.fillRect(mx - 30, groundY - mh, 80, mh)
      }
    }

    // Far tree canopy silhouette (parallax layer 1)
    ctx.fillStyle = '#081808'
    const t1Off = (scrollRef.current * 0.12) % width
    const drawTreeRow = (offX: number, treeColor: string, heights: number[], yBase: number, spread: number) => {
      ctx.fillStyle = treeColor
      for (let ti = -1; ti <= Math.ceil(width / (spread * 2)) + 1; ti++) {
        const tx = ti * spread - (offX % spread)
        const thi = ((ti + 1000) % heights.length)
        const th = heights[thi]
        // Tree silhouette: trunk + canopy
        ctx.fillRect(tx + spread * 0.4, yBase - th * 0.3, spread * 0.12, th * 0.3)
        ctx.fillRect(tx + spread * 0.15, yBase - th, spread * 0.6, th * 0.7)
        ctx.fillRect(tx + spread * 0.25, yBase - th * 1.15, spread * 0.4, th * 0.4)
      }
    }
    const farHeights = [0.22,0.30,0.18,0.34,0.26,0.28,0.20,0.32].map(h => h * groundY)
    drawTreeRow(t1Off, '#081808', farHeights, groundY - 2, 90)

    // Mid canopy (parallax layer 2)
    const t2Off = (scrollRef.current * 0.25) % width
    const midHeights = [0.30,0.42,0.25,0.50,0.36,0.44,0.28,0.40].map(h => h * groundY)
    drawTreeRow(t2Off, '#0A2210', midHeights, groundY - 2, 70)

    // Near palms (parallax layer 3)
    const t3Off = (scrollRef.current * 0.5) % width
    ctx.fillStyle = '#0C2A12'
    for (let pi = -1; pi <= Math.ceil(width / 120) + 1; pi++) {
      const px2 = pi * 120 - (t3Off % 120)
      const ph2 = groundY * (0.45 + ((pi * 13) % 7) * 0.04)
      // Palm trunk
      ctx.fillRect(px2 + 48, groundY - ph2, 8, ph2)
      // Palm fronds
      ctx.fillStyle = '#1A4020'
      for (let fi = 0; fi < 6; fi++) {
        const angle = (fi / 6) * Math.PI - Math.PI / 2
        const fx = px2 + 52 + Math.cos(angle) * 28
        const fy = groundY - ph2 + Math.sin(angle) * 16
        ctx.fillRect(fx - 12, fy - 3, 24, 6)
      }
      ctx.fillStyle = '#0C2A12'
    }

    // Jungle floor
    const groundGrd = ctx.createLinearGradient(0, groundY, 0, height)
    groundGrd.addColorStop(0, '#1A3A0A')
    groundGrd.addColorStop(0.3, '#0F2006')
    groundGrd.addColorStop(1, '#080F04')
    ctx.fillStyle = groundGrd
    ctx.fillRect(0, groundY, width, height - groundY)

    // Ground line (jungle green)
    ctx.strokeStyle = '#3A8A20'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke()

    // Ground grass tufts
    ctx.fillStyle = '#2A6A18'
    const gOff = scrollRef.current % 40
    for (let gi = 0; gi < width / 40 + 1; gi++) {
      const gx = gi * 40 - gOff
      ctx.fillRect(gx, groundY - 3, 3, 3); ctx.fillRect(gx + 8, groundY - 5, 3, 5)
      ctx.fillRect(gx + 16, groundY - 4, 3, 4); ctx.fillRect(gx + 28, groundY - 3, 3, 3)
    }

    // Moving ground particles (dirt)
    ctx.fillStyle = 'rgba(80,160,40,0.4)'
    for (let gi = 0; gi < groundParticlesRef.current.length; gi++) {
      groundParticlesRef.current[gi] = (groundParticlesRef.current[gi] - speedRef.current * (dt / 16) * 0.5 + width) % width
      ctx.fillRect(groundParticlesRef.current[gi], groundY + 5, 2, 2)
    }

    // Obstacles
    for (const obs of obstaclesRef.current) {
      drawJungleObstacle(ctx, obs.x, groundY - obs.h, obs.w, obs.h, obs.style)
    }

    // Player speed trail
    if (alive && frameRef.current % 3 === 0) {
      ctx.save()
      ctx.globalAlpha = 0.25
      ctx.shadowBlur = 10
      ctx.shadowColor = cc.trail
      drawRunner(ctx, p.x - 12, p.y, RUNNER_CONFIG.playerWidth, frameRef.current, char)
      ctx.restore()
    }

    // Player with glow
    if (!p.dead) {
      ctx.save()
      ctx.shadowBlur = 20
      ctx.shadowColor = cc.glow
      drawRunner(ctx, p.x, p.y, RUNNER_CONFIG.playerWidth, frameRef.current, char)
      ctx.restore()
    }

    // Jump shadow
    if (!p.dead && p.jumping) {
      const shadowAlpha = Math.max(0, 0.5 - (groundY - p.y - RUNNER_CONFIG.playerHeight) / groundY)
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`
      ctx.beginPath()
      ctx.ellipse(p.x + RUNNER_CONFIG.playerWidth / 2, groundY - 1, RUNNER_CONFIG.playerWidth / 2, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Particles
    for (const pt of particlesRef.current) {
      ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color
      ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8)
    }
    ctx.globalAlpha = 1

    // Death overlay
    if (stateRef.current === 'DEAD') {
      ctx.fillStyle = 'rgba(255,61,0,0.2)'
      ctx.fillRect(0, 0, width, height)
    }

    // ── HUD ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.68)'
    ctx.fillRect(0, 0, width, 40)
    ctx.strokeStyle = char === 'ALAN' ? 'rgba(255,61,0,0.6)' : 'rgba(30,144,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(width, 40); ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold 22px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.floor(scoreRef.current)}m`, 12, 20)
    ctx.fillStyle = '#666'
    ctx.font = `13px "Bebas Neue", var(--font-display), sans-serif`
    ctx.fillText(`BEST: ${personalBest}m`, 12, 34)

    ctx.fillStyle = '#888'
    ctx.font = `13px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText('SPACE / TAP TO JUMP', width - 12, 20)
  }, [endGame, personalBest])

  useGameLoop(gameLoop, gameState === 'PLAYING' || gameState === 'DEAD')

  const isNewBest = finalScore > personalBest

  return (
    <div className="absolute inset-0 bg-[#05100A]" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: 'pixelated', touchAction: 'none' }} />

      {/* ── CHARACTER SELECT ──────────────────────────────────────────────────── */}
      {gameState === 'CHARACTER_SELECT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'linear-gradient(to bottom, #05100A, #0A200A)' }}>
          <h1 className="text-5xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            STOKES RUNNER
          </h1>
          <p className="text-sm mb-8" style={{ color: '#3A8A20', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
            CHOOSE YOUR TWIN
          </p>

          <div className="flex gap-5 mb-8">
            {/* ALAN */}
            <button
              onClick={() => startGame('ALAN')}
              className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl transition-all active:scale-95 hover:scale-105"
              style={{ border: '2px solid #FF3D00', background: 'rgba(255,61,0,0.08)' }}
            >
              <canvas width={56} height={84} style={{ imageRendering: 'pixelated', width: 70, height: 105 }}
                ref={(c) => {
                  if (!c) return
                  const x = c.getContext('2d')!
                  x.clearRect(0, 0, 56, 84)
                  drawRunner(x, 8, 4, 40, 0, 'ALAN')
                }}
              />
              <span className="text-xl" style={{ color: '#FF3D00', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>ALAN</span>
              <span className="text-xs text-[#666]">The Red Twin</span>
            </button>

            {/* ALEX */}
            <button
              onClick={() => startGame('ALEX')}
              className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl transition-all active:scale-95 hover:scale-105"
              style={{ border: '2px solid #1E90FF', background: 'rgba(30,144,255,0.08)' }}
            >
              <canvas width={56} height={84} style={{ imageRendering: 'pixelated', width: 70, height: 105 }}
                ref={(c) => {
                  if (!c) return
                  const x = c.getContext('2d')!
                  x.clearRect(0, 0, 56, 84)
                  drawRunner(x, 8, 4, 40, 0, 'ALEX')
                }}
              />
              <span className="text-xl" style={{ color: '#1E90FF', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>ALEX</span>
              <span className="text-xs text-[#666]">The Blue Twin</span>
            </button>
          </div>

          <p className="text-[#3A5A2A] text-xs">Space / Tap to jump · Double jump!</p>
          {personalBest > 0 && (
            <p className="text-sm mt-4" style={{ color: '#3A8A20', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              BEST: {personalBest}m
            </p>
          )}
        </div>
      )}

      {/* ── SCORE SCREEN ─────────────────────────────────────────────────────── */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(5,16,10,0.95)' }}>
          {isNewBest && finalScore > 0 && (
            <div className="text-sm mb-2 animate-bounce" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
              🌿 NEW BEST! 🌿
            </div>
          )}
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>WIPED OUT</h2>
          <p className="text-6xl mb-1" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>{finalScore}m</p>
          <p className="text-[#555] text-sm mb-8">Distance run</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => startGame()}
              className="px-6 py-3 text-white rounded-xl transition-all active:scale-95"
              style={{ background: 'var(--accent-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
            >
              RUN AGAIN
            </button>
            <button
              onClick={() => { stateRef.current = 'CHARACTER_SELECT'; setGameState('CHARACTER_SELECT') }}
              className="px-6 py-3 border border-[#333] hover:border-[#666] text-[#999] hover:text-white rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
            >
              SWITCH
            </button>
            <button
              onClick={() => sdkRef.current?.showLeaderboard()}
              className="px-6 py-3 border border-[#1E1E1E] hover:border-[var(--accent-primary)] text-[#555] hover:text-white rounded-xl transition-all"
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
