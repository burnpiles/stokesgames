'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { DODGE_CONFIG } from './game.config'

type Character = 'ALEX' | 'ALAN'
type GameState = 'CHARACTER_SELECT' | 'PLAYING' | 'DEAD' | 'SCORE_SCREEN'

interface FallingItem {
  id: number; x: number; y: number; speed: number
  type: 'bad' | 'good'; variant: number; w: number; h: number; phase: number
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; sz: number
}

interface Props { gameId: string; gameSlug: string; mode?: string }

let itemIdCounter = 0

const CHAR_CFG = {
  ALEX: { hoodie: '#1E90FF', hoodieDark: '#1060B0', pocket: '#0840A0', glow: 'rgba(30,144,255,0.5)', gridColor: 'rgba(30,144,255,0.06)' },
  ALAN: { hoodie: '#FF3D00', hoodieDark: '#CC3100', pocket: '#8B1A00', glow: 'rgba(255,61,0,0.5)',   gridColor: 'rgba(255,61,0,0.06)'   },
} as const

function drawChar(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, char: Character) {
  const c = CHAR_CFG[char]
  const s = pw / 8
  // Hair
  ctx.fillStyle = '#3A2010'
  ctx.fillRect(px + s, py, s * 6, s * 1.5)
  ctx.fillRect(px + s, py, s, s * 3); ctx.fillRect(px + s * 6, py, s, s * 3)
  ctx.fillRect(px + s * 1.5, py - s, s * 0.8, s)
  ctx.fillRect(px + s * 3.1, py - s * 1.5, s * 0.8, s * 1.5)
  ctx.fillRect(px + s * 5.1, py - s, s * 0.8, s)
  // Face
  ctx.fillStyle = '#F5C5A3'
  ctx.fillRect(px + s * 2, py + s, s * 4, s * 3.5)
  // Eyebrows
  ctx.fillStyle = '#3A2010'
  ctx.fillRect(px + s * 2.2, py + s * 1.5, s * 1.1, s * 0.5)
  ctx.fillRect(px + s * 4.7, py + s * 1.5, s * 1.1, s * 0.5)
  // Eyes
  ctx.fillStyle = '#1A1A1A'
  ctx.fillRect(px + s * 2.4, py + s * 2.2, s, s); ctx.fillRect(px + s * 4.6, py + s * 2.2, s, s)
  ctx.fillStyle = '#FFF'
  ctx.fillRect(px + s * 2.4, py + s * 2.2, s * 0.4, s * 0.4)
  ctx.fillRect(px + s * 4.6, py + s * 2.2, s * 0.4, s * 0.4)
  // Cheeks
  ctx.fillStyle = 'rgba(255,130,110,0.5)'
  ctx.fillRect(px + s * 1.8, py + s * 3.1, s * 1.2, s * 0.6)
  ctx.fillRect(px + s * 5, py + s * 3.1, s * 1.2, s * 0.6)
  // Smile
  ctx.fillStyle = '#C05A48'
  ctx.fillRect(px + s * 3, py + s * 3.8, s * 2, s * 0.5)
  // Arms
  ctx.fillStyle = c.hoodie
  ctx.fillRect(px, py + s * 4.5, s * 1.5, s * 3.5)
  ctx.fillRect(px + s * 6.5, py + s * 4.5, s * 1.5, s * 3.5)
  // Hoodie body
  ctx.fillStyle = c.hoodie
  ctx.fillRect(px + s * 1.5, py + s * 4.5, s * 5, s * 4)
  ctx.fillStyle = c.hoodieDark
  ctx.fillRect(px + s * 2.5, py + s * 4.5, s * 3, s)
  ctx.fillStyle = '#FFF'
  ctx.fillRect(px + s * 3.2, py + s * 5.2, s * 0.4, s * 2)
  ctx.fillRect(px + s * 4.4, py + s * 5.2, s * 0.4, s * 2)
  ctx.fillStyle = c.pocket
  ctx.fillRect(px + s * 2.5, py + s * 6.5, s * 3, s * 1.5)
  // Hands
  ctx.fillStyle = '#F5C5A3'
  ctx.fillRect(px + s * 0.2, py + s * 8, s * 1.3, s)
  ctx.fillRect(px + s * 6.5, py + s * 8, s * 1.3, s)
  // Jeans
  ctx.fillStyle = '#3A5AB0'
  ctx.fillRect(px + s * 2, py + s * 8.5, s * 1.8, s * 2.5)
  ctx.fillRect(px + s * 4.2, py + s * 8.5, s * 1.8, s * 2.5)
  ctx.fillStyle = '#243880'
  ctx.fillRect(px + s * 2, py + s * 9.5, s * 1.8, s * 0.5)
  ctx.fillRect(px + s * 4.2, py + s * 9.5, s * 1.8, s * 0.5)
  // Shoes
  ctx.fillStyle = '#E8E8E8'
  ctx.fillRect(px + s * 1.5, py + s * 11, s * 2.5, s)
  ctx.fillRect(px + s * 4, py + s * 11, s * 2.5, s)
  ctx.fillStyle = '#999'
  ctx.fillRect(px + s * 1.5, py + s * 11.8, s * 2.5, s * 0.3)
  ctx.fillRect(px + s * 4, py + s * 11.8, s * 2.5, s * 0.3)
}

// Pixel art Lambo — wide bad item (variant 5)
function drawLamboItem(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x - w / 2
  const cy = y - h / 2
  const u = w / 20  // 20 units wide

  // Shadow under car
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(cx + u * 2, cy + h * 0.88, w - u * 4, h * 0.12)

  // Main body (gold)
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(cx + u * 0.5, cy + h * 0.38, w - u, h * 0.5)

  // Low front nose (slope)
  ctx.fillStyle = '#FFC200'
  ctx.fillRect(cx + u * 15.5, cy + h * 0.45, u * 4, h * 0.25)
  ctx.fillRect(cx + u * 18, cy + h * 0.5, u * 1.5, h * 0.15)

  // Roof cabin
  ctx.fillStyle = '#FFC200'
  ctx.fillRect(cx + u * 5, cy + h * 0.08, u * 9, h * 0.32)

  // Side skirt stripe (darker gold)
  ctx.fillStyle = '#CC9B00'
  ctx.fillRect(cx + u * 0.5, cy + h * 0.78, w - u, h * 0.08)

  // Front windshield (light blue)
  ctx.fillStyle = '#A0E8FF'
  ctx.fillRect(cx + u * 13.5, cy + h * 0.12, u * 1, h * 0.25)

  // Rear window
  ctx.fillStyle = '#A0E8FF'
  ctx.fillRect(cx + u * 5.2, cy + h * 0.1, u * 1.5, h * 0.28)

  // Side glass
  ctx.fillStyle = '#A0E8FF'
  ctx.fillRect(cx + u * 7, cy + h * 0.1, u * 6, h * 0.28)

  // Headlights (bright white/yellow)
  ctx.fillStyle = '#FFFFCC'
  ctx.fillRect(cx + u * 18.5, cy + h * 0.42, u * 1, h * 0.12)
  ctx.fillStyle = '#FF8C00'
  ctx.fillRect(cx + u * 18.8, cy + h * 0.52, u * 0.7, h * 0.08)

  // Taillights (red)
  ctx.fillStyle = '#FF2020'
  ctx.fillRect(cx + u * 0.5, cy + h * 0.42, u * 1.2, h * 0.18)
  ctx.fillStyle = '#FF6060'
  ctx.fillRect(cx + u * 0.5, cy + h * 0.42, u * 0.6, h * 0.08)

  // Front wheel well
  ctx.fillStyle = '#111'
  ctx.fillRect(cx + u * 14, cy + h * 0.78, u * 4, h * 0.22)
  ctx.fillStyle = '#444'
  ctx.fillRect(cx + u * 14.8, cy + h * 0.8, u * 2.4, h * 0.18)
  // Wheel shine
  ctx.fillStyle = '#888'
  ctx.fillRect(cx + u * 15.4, cy + h * 0.82, u * 1.2, h * 0.06)

  // Rear wheel well
  ctx.fillStyle = '#111'
  ctx.fillRect(cx + u * 3, cy + h * 0.78, u * 4, h * 0.22)
  ctx.fillStyle = '#444'
  ctx.fillRect(cx + u * 3.8, cy + h * 0.8, u * 2.4, h * 0.18)
  ctx.fillStyle = '#888'
  ctx.fillRect(cx + u * 4.4, cy + h * 0.82, u * 1.2, h * 0.06)

  // LAMBO label on body
  ctx.save()
  ctx.fillStyle = '#7A5900'
  ctx.font = `bold ${Math.max(8, Math.floor(h * 0.24))}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('LAMBO', x, cy + h * 0.62)
  ctx.restore()

  // Gold glow outline hint
  ctx.strokeStyle = 'rgba(255,215,0,0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(cx + u * 0.5, cy + h * 0.38, w - u, h * 0.5)
}

function drawBadItem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, variant: number) {
  const s = size / 8
  const cx = x - size / 2, cy = y - size / 2
  if (variant === 0) {
    ctx.fillStyle = '#222'; ctx.fillRect(cx + s, cy + s * 2, s * 6, s * 5)
    ctx.fillStyle = '#444'; ctx.fillRect(cx + s * 2, cy + s, s * 4, s * 6)
    ctx.fillStyle = '#8B4513'; ctx.fillRect(cx + s * 3.5, cy, s, s * 1.5)
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx + s * 3, cy - s, s * 2, s)
    ctx.fillStyle = '#FFF'
    ctx.fillRect(cx + s * 2, cy + s * 2.5, s, s); ctx.fillRect(cx + s * 5, cy + s * 2.5, s, s)
    ctx.fillRect(cx + s * 2.5, cy + s * 4.5, s, s); ctx.fillRect(cx + s * 4.5, cy + s * 4.5, s, s)
  } else if (variant === 1) {
    ctx.fillStyle = '#CC0000'
    ctx.fillRect(cx + s * 2, cy + s * 2, s * 4, s * 4)
    ctx.fillStyle = '#FF4444'
    ctx.fillRect(cx + s, cy + s * 3, s * 6, s * 2); ctx.fillRect(cx + s * 3, cy + s, s * 2, s * 6)
    ctx.fillStyle = '#880000'
    ctx.fillRect(cx, cy + s * 3.5, s, s); ctx.fillRect(cx + s * 7, cy + s * 3.5, s, s)
    ctx.fillRect(cx + s * 3.5, cy, s, s); ctx.fillRect(cx + s * 3.5, cy + s * 7, s, s)
  } else if (variant === 2) {
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(cx + s * 4, cy, s * 3, s * 3); ctx.fillRect(cx + s * 2, cy + s * 3, s * 5, s * 2)
    ctx.fillRect(cx + s, cy + s * 5, s * 3, s * 3)
    ctx.fillStyle = '#FFA500'
    ctx.fillRect(cx + s * 4.5, cy, s * 2, s * 3); ctx.fillRect(cx + s * 2.5, cy + s * 3, s * 4, s * 2)
    ctx.fillRect(cx + s * 1.5, cy + s * 5, s * 2, s * 3)
  } else if (variant === 3) {
    ctx.fillStyle = '#888'
    ctx.fillRect(cx + s * 2, cy + s, s * 4, s * 6); ctx.fillRect(cx + s, cy + s * 2, s * 6, s * 4)
    ctx.fillStyle = '#999'; ctx.fillRect(cx + s * 2, cy + s, s * 3, s * 2)
    ctx.fillStyle = '#666'; ctx.fillRect(cx + s * 3, cy + s * 5, s * 2, s * 2); ctx.fillRect(cx + s, cy + s * 3, s, s * 2)
  } else {
    ctx.fillStyle = '#FF0000'; ctx.fillRect(cx + s, cy + s, s * 6, s * 6)
    ctx.fillStyle = '#FFF'
    ctx.fillRect(cx + s, cy + s, s * 2, s * 2); ctx.fillRect(cx + s * 5, cy + s, s * 2, s * 2)
    ctx.fillRect(cx + s * 3, cy + s * 3, s * 2, s * 2)
    ctx.fillRect(cx + s, cy + s * 5, s * 2, s * 2); ctx.fillRect(cx + s * 5, cy + s * 5, s * 2, s * 2)
  }
}

function drawGoodItem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, variant: number) {
  const s = size / 8
  const cx = x - size / 2, cy = y - size / 2
  if (variant === 0) {
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(cx + s * 3, cy, s * 2, s * 8); ctx.fillRect(cx, cy + s * 3, s * 8, s * 2)
    ctx.fillRect(cx + s, cy + s, s * 2, s * 2); ctx.fillRect(cx + s * 5, cy + s, s * 2, s * 2)
    ctx.fillRect(cx + s, cy + s * 5, s * 2, s * 2); ctx.fillRect(cx + s * 5, cy + s * 5, s * 2, s * 2)
    ctx.fillStyle = '#FFF099'
    ctx.fillRect(cx + s * 3, cy, s * 2, s * 2); ctx.fillRect(cx + s * 3, cy + s * 3, s * 2, s * 2)
  } else if (variant === 1) {
    ctx.fillStyle = '#B8860B'; ctx.fillRect(cx + s, cy + s, s * 6, s * 6)
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(cx + s * 2, cy, s * 4, s * 8); ctx.fillRect(cx, cy + s * 2, s * 8, s * 4)
    ctx.fillStyle = '#FFF099'; ctx.fillRect(cx + s * 2, cy + s * 2, s * 2, s * 2)
    ctx.fillStyle = '#B8860B'; ctx.fillRect(cx + s * 3, cy + s * 3, s * 2, s * 2)
  } else if (variant === 2) {
    ctx.fillStyle = '#00D4FF'
    ctx.fillRect(cx + s * 3, cy, s * 2, s * 2); ctx.fillRect(cx + s * 2, cy + s * 2, s * 4, s * 4)
    ctx.fillRect(cx + s * 3, cy + s * 6, s * 2, s * 2)
    ctx.fillStyle = '#80EEFF'; ctx.fillRect(cx + s * 3, cy + s, s, s * 2)
    ctx.fillStyle = '#0088AA'; ctx.fillRect(cx + s * 3, cy + s * 5, s * 2, s * 2)
  } else if (variant === 3) {
    ctx.fillStyle = '#FF6B00'
    ctx.fillRect(cx + s * 3, cy, s * 2, s * 3); ctx.fillRect(cx + s * 2, cy + s * 2, s * 4, s * 4)
    ctx.fillRect(cx + s, cy + s * 4, s * 6, s * 3)
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(cx + s * 3, cy + s * 2, s * 2, s * 3); ctx.fillRect(cx + s * 2, cy + s * 4, s * 4, s * 2)
    ctx.fillStyle = '#FF3D00'; ctx.fillRect(cx + s * 3, cy + s * 3, s, s)
  } else {
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(cx + s * 2, cy, s * 4, s * 5); ctx.fillRect(cx + s * 3, cy + s * 5, s * 2, s * 2)
    ctx.fillRect(cx + s, cy + s * 7, s * 6, s)
    ctx.fillStyle = '#FFF099'; ctx.fillRect(cx + s * 3, cy + s, s, s * 2)
    ctx.fillStyle = '#B8860B'; ctx.fillRect(cx + s * 2, cy + s * 4, s * 4, s)
  }
}

// Stage colors for banner
const STAGE_COLORS = ['#FF3D00', '#FF8C00', '#FFD700', '#00D4FF', '#A020F0', '#FF00AA', '#00FF88', '#FF2020', '#FFA500', '#FFFFFF']

export default function FaceDodge({ gameId, gameSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('CHARACTER_SELECT')
  const [personalBest, setPersonalBest] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  const stateRef = useRef<GameState>('CHARACTER_SELECT')
  const charRef = useRef<Character>('ALAN')
  const playerRef = useRef({ x: 0, y: 0, w: DODGE_CONFIG.playerWidth, h: DODGE_CONFIG.playerHeight })
  const itemsRef = useRef<FallingItem[]>([])
  const particlesRef = useRef<Particle[]>([])
  const livesRef = useRef(DODGE_CONFIG.lives)
  const scoreRef = useRef(0)
  const speedMultRef = useRef(1)
  const spawnTimerRef = useRef(0)
  const spawnIntervalRef = useRef(DODGE_CONFIG.spawnInterval)
  const keysRef = useRef<Set<string>>(new Set())
  const touchXRef = useRef<number | null>(null)
  const touchDirRef = useRef<-1 | 0 | 1>(0)  // -1=left tap, 1=right tap, 0=drag/none
  const touchStartXRef = useRef(0)
  const flashRef = useRef(0)
  const shakeRef = useRef({ x: 0, y: 0, frames: 0 })
  const stageRef = useRef(1)
  const stageBannerRef = useRef({ text: '', frames: 0, color: '#FF3D00' })
  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'face-dodge', gameSlug: 'face-dodge' })
    const pb = parseInt(localStorage.getItem('sg_pb_face-dodge') ?? '0', 10)
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
      playerRef.current.y = h - DODGE_CONFIG.playerHeight - 20
      if (playerRef.current.x === 0) playerRef.current.x = w / 2 - DODGE_CONFIG.playerWidth / 2
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent); doResize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key) }
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [])

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const tx = e.touches[0].clientX
      touchStartXRef.current = tx
      touchXRef.current = null  // clear follow-finger mode
      // Set tap direction based on which half of canvas is tapped
      const canvas = canvasRef.current
      const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, width: window.innerWidth }
      touchDirRef.current = tx < rect.left + rect.width / 2 ? -1 : 1
    }
    const onMove = (e: TouchEvent) => {
      const tx = e.touches[0].clientX
      const moved = Math.abs(tx - touchStartXRef.current)
      if (moved > 28) {
        // Switched to follow-finger drag mode
        touchDirRef.current = 0
        touchXRef.current = tx
      }
    }
    const onEnd = () => {
      touchXRef.current = null
      touchDirRef.current = 0
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  const endGame = useCallback(() => {
    stateRef.current = 'DEAD'
    const s = Math.floor(scoreRef.current)
    setFinalScore(s)
    sdkRef.current?.onGameOver(s)
    const pb = parseInt(localStorage.getItem('sg_pb_face-dodge') ?? '0', 10)
    if (s > pb) { localStorage.setItem('sg_pb_face-dodge', String(s)); setPersonalBest(s) }
    setTimeout(() => { stateRef.current = 'SCORE_SCREEN'; setGameState('SCORE_SCREEN') }, 800)
  }, [])

  const startGame = useCallback((char?: Character) => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (char) charRef.current = char
    itemsRef.current = []
    particlesRef.current = []
    livesRef.current = DODGE_CONFIG.lives
    scoreRef.current = 0
    speedMultRef.current = 1
    spawnTimerRef.current = 0
    spawnIntervalRef.current = DODGE_CONFIG.spawnInterval
    flashRef.current = 0
    shakeRef.current = { x: 0, y: 0, frames: 0 }
    stageRef.current = 1
    stageBannerRef.current = { text: 'STAGE 1', frames: 70, color: STAGE_COLORS[0] }
    playerRef.current = {
      x: canvas.width / 2 - DODGE_CONFIG.playerWidth / 2,
      y: canvas.height - DODGE_CONFIG.playerHeight - 20,
      w: DODGE_CONFIG.playerWidth,
      h: DODGE_CONFIG.playerHeight,
    }
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')
    sdkRef.current?.onStart()
  }, [])

  const gameLoop = useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas || stateRef.current !== 'PLAYING') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const p = playerRef.current
    const char = charRef.current
    const cc = CHAR_CFG[char]

    // ── Stage progression ───────────────────────────────────────────────────
    const newStage = Math.floor(scoreRef.current / 1000) + 1
    if (newStage > stageRef.current) {
      stageRef.current = newStage
      const si = Math.min(newStage - 1, STAGE_COLORS.length - 1)
      stageBannerRef.current = { text: `STAGE ${newStage}`, frames: 80, color: STAGE_COLORS[si] }
    }
    const stage = stageRef.current
    const stageBonus = stage - 1
    const speedCap = Math.min(3 + stageBonus * 0.35, 6.5)
    const spawnMinForStage = Math.max(180, DODGE_CONFIG.spawnIntervalMin - stageBonus * 28)

    // ── Update ──────────────────────────────────────────────────────────────
    const speed = DODGE_CONFIG.playerSpeed * (dt / 16)
    const keys = keysRef.current

    if ((keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) && p.x > 0)
      p.x = Math.max(0, p.x - speed)
    if ((keys.has('ArrowRight') || keys.has('d') || keys.has('D')) && p.x + p.w < width)
      p.x = Math.min(width - p.w, p.x + speed)

    // Tap-direction mobile control
    const tDir = touchDirRef.current
    if (tDir === -1 && p.x > 0) p.x = Math.max(0, p.x - speed)
    else if (tDir === 1 && p.x + p.w < width) p.x = Math.min(width - p.w, p.x + speed)

    // Follow-finger drag control
    if (touchXRef.current !== null) {
      p.x += (touchXRef.current - p.w / 2 - p.x) * 0.15
      p.x = Math.max(0, Math.min(width - p.w, p.x))
    }

    speedMultRef.current = Math.min(speedMultRef.current + DODGE_CONFIG.speedIncrement * dt, speedCap)

    spawnTimerRef.current += dt
    if (spawnTimerRef.current >= spawnIntervalRef.current) {
      spawnTimerRef.current = 0
      spawnIntervalRef.current = Math.max(spawnMinForStage, spawnIntervalRef.current - DODGE_CONFIG.spawnDecrement)

      // Determine item type and variant
      const isGood = Math.random() < 0.25
      // At stage 3+, 18% chance to spawn a Lambo (bad, wide)
      const spawnLambo = !isGood && stage >= 3 && Math.random() < 0.18
      const lamboW = Math.min(96, Math.floor(width * 0.28))
      const lamboH = Math.floor(lamboW * 0.46)

      const itemW = spawnLambo ? lamboW : 44
      const itemH = spawnLambo ? lamboH : 44
      const margin = itemW / 2 + 4
      itemsRef.current.push({
        id: itemIdCounter++,
        x: Math.random() * (width - margin * 2) + margin,
        y: -itemH - 10,
        speed: DODGE_CONFIG.itemFallSpeed * (0.8 + Math.random() * 0.4),
        type: isGood ? 'good' : 'bad',
        variant: spawnLambo ? 5 : Math.floor(Math.random() * 5),
        w: itemW,
        h: itemH,
        phase: Math.random() * Math.PI * 2,
      })

      // At stage 5+, 12% chance of a bonus double spawn
      if (stage >= 5 && Math.random() < 0.12) {
        itemsRef.current.push({
          id: itemIdCounter++,
          x: Math.random() * (width - 80) + 40,
          y: -80,
          speed: DODGE_CONFIG.itemFallSpeed * (0.8 + Math.random() * 0.4),
          type: Math.random() < 0.3 ? 'good' : 'bad',
          variant: Math.floor(Math.random() * 5),
          w: 44, h: 44,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    // Collisions
    const remaining: FallingItem[] = []
    const goodColors = ['#FFD700', '#FF6B35', '#FFFFFF', '#FF3D00', '#00D4FF']
    for (const item of itemsRef.current) {
      item.y += item.speed * speedMultRef.current * (dt / 16)
      if (item.y > height + 80) continue
      const hit =
        item.x - item.w / 2 < p.x + p.w && item.x + item.w / 2 > p.x &&
        item.y - item.h / 2 < p.y + p.h && item.y + item.h / 2 > p.y
      if (hit) {
        if (item.type === 'good') {
          scoreRef.current += 100
          for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2
            particlesRef.current.push({
              x: item.x, y: item.y,
              vx: Math.cos(angle) * (2 + Math.random() * 4),
              vy: Math.sin(angle) * (2 + Math.random() * 4) - 1,
              life: 28, maxLife: 28,
              color: goodColors[Math.floor(Math.random() * goodColors.length)],
              sz: 3 + Math.random() * 4,
            })
          }
        } else {
          // Lambo does double damage at stage 5+
          const dmg = item.variant === 5 && stage >= 5 ? 2 : 1
          livesRef.current = Math.max(0, livesRef.current - dmg)
          flashRef.current = item.variant === 5 ? 18 : 12
          shakeRef.current = { x: 0, y: 0, frames: item.variant === 5 ? 12 : 8 }
          if (livesRef.current <= 0) { endGame(); return }
        }
        continue
      }
      remaining.push(item)
    }
    itemsRef.current = remaining

    // Score ticks up over time
    scoreRef.current += dt / 16

    // Particles
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0)
    for (const pt of particlesRef.current) {
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.3; pt.life--
    }

    if (flashRef.current > 0) flashRef.current--
    const shake = shakeRef.current
    if (shake.frames > 0) {
      shake.x = (Math.random() - 0.5) * 9
      shake.y = (Math.random() - 0.5) * 9
      shake.frames--
    } else { shake.x = 0; shake.y = 0 }

    if (stageBannerRef.current.frames > 0) stageBannerRef.current.frames--

    // ── Draw ────────────────────────────────────────────────────────────────
    ctx.save()
    ctx.translate(shake.x, shake.y)

    // Background gradient — shifts slightly by stage
    const bgR = Math.min(5 + stageBonus * 3, 20)
    const bgGrd = ctx.createLinearGradient(0, 0, 0, height)
    bgGrd.addColorStop(0, `rgb(${bgR},${bgR},${Math.max(5, 16 - stageBonus * 2)})`); bgGrd.addColorStop(1, `rgb(${bgR * 2},${bgR},32)`)
    ctx.fillStyle = bgGrd
    ctx.fillRect(-10, -10, width + 20, height + 20)

    // Neon grid lines
    ctx.strokeStyle = cc.gridColor; ctx.lineWidth = 1
    const gs = 56
    for (let xi = 0; xi < width; xi += gs) {
      ctx.beginPath(); ctx.moveTo(xi, 0); ctx.lineTo(xi, height); ctx.stroke()
    }
    for (let yi = 0; yi < height; yi += gs) {
      ctx.beginPath(); ctx.moveTo(0, yi); ctx.lineTo(width, yi); ctx.stroke()
    }

    // Floor glow strip
    const floorGrd = ctx.createLinearGradient(0, height - 60, 0, height)
    floorGrd.addColorStop(0, 'rgba(0,0,0,0)')
    floorGrd.addColorStop(1, cc.glow.replace('0.5)', '0.15)'))
    ctx.fillStyle = floorGrd
    ctx.fillRect(0, height - 60, width, 60)

    // Character spotlight
    const spotGrd = ctx.createRadialGradient(p.x + p.w / 2, p.y + p.h, 0, p.x + p.w / 2, p.y + p.h / 2, p.w * 2.5)
    spotGrd.addColorStop(0, cc.glow.replace('0.5)', '0.18)'))
    spotGrd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = spotGrd
    ctx.fillRect(p.x - p.w * 2, p.y - p.h, p.w * 5, p.h * 5)

    // Items with glow
    for (const item of itemsRef.current) {
      ctx.save()
      ctx.shadowBlur = 20
      ctx.shadowColor = item.type === 'bad' ? (item.variant === 5 ? '#FFD700' : '#FF2020') : '#FFD700'
      if (item.variant === 5) {
        drawLamboItem(ctx, item.x, item.y, item.w, item.h)
      } else if (item.type === 'bad') {
        drawBadItem(ctx, item.x, item.y, item.w, item.variant)
      } else {
        drawGoodItem(ctx, item.x, item.y, item.w, item.variant)
      }
      ctx.restore()
    }

    // Particles
    for (const pt of particlesRef.current) {
      ctx.globalAlpha = pt.life / pt.maxLife
      ctx.fillStyle = pt.color
      ctx.fillRect(pt.x - pt.sz / 2, pt.y - pt.sz / 2, pt.sz, pt.sz)
    }
    ctx.globalAlpha = 1

    // Player with glow halo
    ctx.save()
    ctx.shadowBlur = 28
    ctx.shadowColor = cc.glow
    drawChar(ctx, p.x, p.y, p.w, char)
    ctx.restore()

    // Hit flash overlay
    if (flashRef.current > 0) {
      ctx.fillStyle = `rgba(255,0,0,${flashRef.current / 18 * 0.45})`
      ctx.fillRect(0, 0, width, height)
    }

    ctx.restore() // end shake

    // ── HUD (outside shake) ──────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, width, 44)
    ctx.strokeStyle = char === 'ALAN' ? 'rgba(255,61,0,0.7)' : 'rgba(30,144,255,0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(width, 44); ctx.stroke()

    // Pixel hearts
    for (let li = 0; li < DODGE_CONFIG.lives; li++) {
      const hx = 10 + li * 34, hy = 8, hs = 3
      const active = li < livesRef.current
      ctx.fillStyle = active ? '#FF3D00' : '#2A2A2A'
      ctx.fillRect(hx + hs, hy, hs * 2, hs); ctx.fillRect(hx + hs * 5, hy, hs * 2, hs)
      ctx.fillRect(hx, hy + hs, hs * 8, hs * 3)
      ctx.fillRect(hx + hs, hy + hs * 4, hs * 6, hs)
      ctx.fillRect(hx + hs * 2, hy + hs * 5, hs * 4, hs)
      ctx.fillRect(hx + hs * 3, hy + hs * 6, hs * 2, hs)
      if (active) {
        ctx.fillStyle = '#FF6B35'
        ctx.fillRect(hx + hs, hy + hs, hs * 2, hs); ctx.fillRect(hx + hs * 5, hy + hs, hs * 2, hs)
      }
    }

    // Stage indicator (right of hearts, left of score)
    const stageColor = STAGE_COLORS[Math.min(stage - 1, STAGE_COLORS.length - 1)]
    ctx.fillStyle = stageColor
    ctx.font = `bold 13px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(`STG ${stage}`, 10 + DODGE_CONFIG.lives * 34 + 6, 22)

    // Score display
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold 22px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.floor(scoreRef.current)}`, width - 12, 20)
    ctx.fillStyle = '#666'
    ctx.font = `13px "Bebas Neue", var(--font-display), sans-serif`
    ctx.fillText(`BEST: ${personalBest}`, width - 12, 36)

    // Stage banner overlay
    const banner = stageBannerRef.current
    if (banner.frames > 0) {
      const progress = banner.frames / 80
      const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (progress - 0.8) / 0.2 : 1
      ctx.save()
      ctx.globalAlpha = alpha * 0.92
      const bannerH = 56
      const bannerY = height / 2 - bannerH / 2
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(0, bannerY, width, bannerH)
      ctx.strokeStyle = banner.color
      ctx.lineWidth = 2
      ctx.strokeRect(0, bannerY, width, bannerH)
      ctx.fillStyle = banner.color
      ctx.font = `bold 32px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(banner.text, width / 2, bannerY + bannerH / 2)
      ctx.restore()
    }
  }, [endGame, personalBest])

  useGameLoop(gameLoop, gameState === 'PLAYING')

  const isNewBest = finalScore > personalBest

  return (
    <div className="absolute inset-0 bg-[#050510]" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: 'pixelated', touchAction: 'none' }} />

      {/* ── CHARACTER SELECT ──────────────────────────────────────────────────── */}
      {gameState === 'CHARACTER_SELECT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'linear-gradient(to bottom, #050510, #0A0028)' }}>
          <h1 className="text-5xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            FACE DODGE
          </h1>
          <p className="text-sm mb-8" style={{ color: '#FF3D00', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
            CHOOSE YOUR TWIN
          </p>

          <div className="flex gap-5 mb-8">
            {/* ALAN */}
            <button
              onClick={() => startGame('ALAN')}
              className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl transition-all active:scale-95 hover:scale-105"
              style={{ border: '2px solid #FF3D00', background: 'rgba(255,61,0,0.08)' }}
            >
              <canvas width={64} height={96} style={{ imageRendering: 'pixelated', width: 80, height: 120 }}
                ref={(c) => {
                  if (!c) return
                  const x = c.getContext('2d')!
                  x.clearRect(0, 0, 64, 96)
                  drawChar(x, 8, 8, 48, 'ALAN')
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
              <canvas width={64} height={96} style={{ imageRendering: 'pixelated', width: 80, height: 120 }}
                ref={(c) => {
                  if (!c) return
                  const x = c.getContext('2d')!
                  x.clearRect(0, 0, 64, 96)
                  drawChar(x, 8, 8, 48, 'ALEX')
                }}
              />
              <span className="text-xl" style={{ color: '#1E90FF', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>ALEX</span>
              <span className="text-xs text-[#666]">The Blue Twin</span>
            </button>
          </div>

          <p className="text-[#444] text-xs">← → or A/D · tap left/right half on mobile · {DODGE_CONFIG.lives} lives</p>
          <p className="text-[#333] text-xs mt-1">Watch out for the Lambo at Stage 3!</p>
          {personalBest > 0 && (
            <p className="text-sm mt-4" style={{ color: '#FF3D00', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              BEST: {personalBest}
            </p>
          )}
        </div>
      )}

      {/* ── SCORE SCREEN ─────────────────────────────────────────────────────── */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(5,5,16,0.95)' }}>
          {isNewBest && finalScore > 0 && (
            <div className="text-sm mb-2 animate-bounce" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
              ⭐ NEW BEST! ⭐
            </div>
          )}
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>GAME OVER</h2>
          <div className="text-sm mb-1" style={{ color: STAGE_COLORS[Math.min(stageRef.current - 1, STAGE_COLORS.length - 1)], fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            REACHED STAGE {stageRef.current}
          </div>
          <p className="text-6xl mb-6" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>{finalScore}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => startGame()}
              className="px-6 py-3 text-white rounded-xl transition-all active:scale-95"
              style={{ background: 'var(--accent-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
            >
              RETRY
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
