'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { PEANUTS_CONFIG } from './game.config'

interface Peanut {
  x: number; y: number; vx: number; vy: number
  angle: number; spin: number; color: string
  bounced: boolean
}
interface ScorePopup {
  x: number; y: number; text: string; vy: number; life: number; maxLife: number; color: string
}
interface PowerUp {
  x: number; y: number; vx: number; vy: number
  health: number; hitFlash: number; respawnTimer: number
}
interface Props { gameId: string; gameSlug: string; mode?: string }

const { gameTime: GT, gravity: G, peanutRadius: PR, spawnRate, blowerSpeed, bounceDamp } = PEANUTS_CONFIG
const PEANUT_COLORS = ['#F5E6C8', '#EDD8AA', '#E8CC95', '#F0DDB5', '#DCC890']
const SUPER_PEANUT_COLORS = ['#FFD700', '#FFAA00', '#FFC000', '#FFE040', '#FFB800']

// ─── Power-up constants ───────────────────────────────────────────────────────
const PU_HEALTH = 3        // peanut hits to collect
const PU_RADIUS = 18       // collision/display radius (pixels at ref canvas)
const PU_SUPER_DUR = 8000  // ms of super mode
const PU_RESPAWN = 7000    // ms before power-up reappears after collection
const SUPER_PR = 10        // enlarged peanut radius during super
const SUPER_MULT = 3       // score multiplier during super
const SUPER_SPAWN_RATE = 6 // peanuts per frame during super

// ─── Bucket defs ─────────────────────────────────────────────────────────────
// yf moved so 500 is reachable with a skilled shot (was at 0.08 = impossible)
const BUCKET_DEFS = [
  { xf: 0.455, yf: 0.27, wf: 0.105, pts: 500,  col: '#FFD700', rim: '#AA7700', txt: '#111', label: '500' },
  { xf: 0.105, yf: 0.40, wf: 0.135, pts: 200,  col: '#FF6B00', rim: '#AA3300', txt: '#FFF', label: '200' },
  { xf: 0.750, yf: 0.40, wf: 0.135, pts: 200,  col: '#FF6B00', rim: '#AA3300', txt: '#FFF', label: '200' },
  { xf: 0.030, yf: 0.63, wf: 0.175, pts: 50,   col: '#0088BB', rim: '#004466', txt: '#FFF', label: '50'  },
  { xf: 0.795, yf: 0.63, wf: 0.175, pts: 50,   col: '#0088BB', rim: '#004466', txt: '#FFF', label: '50'  },
]
const BUCKET_H = 30
const BUCKET_MOUTH = 14

// Moving bonus bucket
const BONUS_YF = 0.50
const BONUS_WF = 0.12
const BONUS_PTS = 1000
const BONUS_SPEED_F = 0.0055

// ─── Obstacle defs ────────────────────────────────────────────────────────────
// 4 obstacles with different types and movement patterns
interface ObsDef {
  type: 'crate' | 'bar' | 'bumper'
  startXf: number; startYf: number; wf: number; hf: number
  vxDir: number; vyDir: number
  minXf: number; maxXf: number; minYf: number; maxYf: number
  speedF: number
}
const OBS_DEFS: ObsDef[] = [
  // Crate 1: mid-left, horizontal mover
  { type: 'crate',  startXf: 0.25, startYf: 0.42, wf: 0.135, hf: 0.065, vxDir: 1,  vyDir: 0, minXf: 0.06, maxXf: 0.56, minYf: 0.42, maxYf: 0.42, speedF: 0.0040 },
  // Crate 2: mid-right, horizontal (opposite direction)
  { type: 'crate',  startXf: 0.54, startYf: 0.58, wf: 0.115, hf: 0.060, vxDir: -1, vyDir: 0, minXf: 0.26, maxXf: 0.78, minYf: 0.58, maxYf: 0.58, speedF: 0.0038 },
  // Bar: thin metal rail, upper area — moves fast, guards path to 500 bucket
  { type: 'bar',    startXf: 0.12, startYf: 0.21, wf: 0.200, hf: 0.022, vxDir: 1,  vyDir: 0, minXf: 0.04, maxXf: 0.65, minYf: 0.21, maxYf: 0.21, speedF: 0.0062 },
  // Bumper: small diagonal mover — ricochets peanuts in surprising directions
  { type: 'bumper', startXf: 0.46, startYf: 0.47, wf: 0.080, hf: 0.080, vxDir: 1,  vyDir: 1, minXf: 0.18, maxXf: 0.74, minYf: 0.30, maxYf: 0.62, speedF: 0.0028 },
]

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawBucket(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, col: string, rim: string, txt: string,
  flash: number, isBonus: boolean, t: number, superMode: boolean
) {
  ctx.save()
  const effectiveCol = superMode ? '#FF8800' : col
  const effectiveRim = superMode ? '#AA4400' : rim

  if (isBonus) {
    ctx.shadowBlur = 12 + Math.sin(t * 0.006) * 5
    ctx.shadowColor = superMode ? '#FF4400' : '#CC00FF'
  } else if (flash > 0) {
    ctx.shadowBlur = flash * 1.5
    ctx.shadowColor = superMode ? '#FF8800' : '#FFFFFF'
  }

  ctx.globalAlpha = flash > 0 ? Math.min(1, 0.65 + flash / 20 * 0.35) : 0.80
  ctx.fillStyle = flash > 0 ? '#FFFFFF' : effectiveCol
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(255,255,255,0.20)'
  ctx.fillRect(x + 2, y + 2, w - 4, 4)
  ctx.fillStyle = effectiveRim; ctx.fillRect(x, y, 4, h)
  ctx.fillRect(x + w - 4, y, 4, h)
  ctx.fillRect(x, y + h - 4, w, 4)
  ctx.shadowBlur = 0
  ctx.fillStyle = effectiveRim
  ctx.fillRect(x - 3, y - 3, w + 6, 4)

  const fs = Math.max(10, Math.min(15, Math.floor(h * 0.48)))
  ctx.font = `bold ${fs}px "Bebas Neue", monospace`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = txt
  const displayLabel = superMode ? `${label}×3` : label
  ctx.fillText(displayLabel, x + w / 2, y + h / 2)

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,180,${flash / 20 * 0.5})`
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
  }
  ctx.restore()
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.fillStyle = '#7A4E12'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#9E6A24'; ctx.fillRect(x + 2, y + 2, w - 4, Math.max(3, Math.floor(h * 0.22)))
  ctx.fillStyle = '#5A3808'; ctx.fillRect(x, y + Math.floor(h * 0.50) - 1, w, 2)
  ctx.strokeStyle = '#5A3808'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + w - 3, y + h - 3); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w - 3, y + 3); ctx.lineTo(x + 3, y + h - 3); ctx.stroke()
  ctx.fillStyle = '#3A2404'
  for (const [nx, ny] of [[x + 5, y + 4], [x + w - 5, y + 4], [x + 5, y + h - 5], [x + w - 5, y + h - 5]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2); ctx.fill()
  }
  ctx.strokeStyle = '#3A2404'; ctx.lineWidth = 1.5
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
  ctx.restore()
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  ctx.save()
  // Chrome/metal bar
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, '#C8C8C8')
  grad.addColorStop(0.3, '#E8E8E8')
  grad.addColorStop(0.7, '#A0A0A0')
  grad.addColorStop(1, '#888888')
  ctx.fillStyle = grad; ctx.fillRect(x, y, w, h)
  // Bolt pattern
  ctx.fillStyle = '#666'
  for (let bx = x + 8; bx < x + w - 6; bx += 18) {
    ctx.beginPath(); ctx.arc(bx, y + h / 2, 2, 0, Math.PI * 2); ctx.fill()
  }
  // Moving shimmer
  const shimX = x + ((t * 0.12) % (w + 20)) - 10
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(Math.max(x, shimX), y, 8, h)
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

function drawBumperBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const cx = x + w / 2, cy = y + h / 2, r = w / 2
  ctx.save()
  // Glow halo
  ctx.shadowBlur = 10 + Math.sin(t * 0.005) * 5
  ctx.shadowColor = '#FF6600'
  // Outer circle
  ctx.fillStyle = '#CC4400'
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  // Inner gradient
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
  grad.addColorStop(0, '#FF8844')
  grad.addColorStop(0.6, '#CC3300')
  grad.addColorStop(1, '#881A00')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.fill()
  // Star spokes (rotate with t)
  ctx.strokeStyle = '#FF9966'; ctx.lineWidth = 2; ctx.shadowBlur = 0
  const rot = t * 0.004
  for (let i = 0; i < 4; i++) {
    const angle = rot + (i / 4) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * r * 0.35, cy + Math.sin(angle) * r * 0.35)
    ctx.lineTo(cx + Math.cos(angle) * r * 0.85, cy + Math.sin(angle) * r * 0.85)
    ctx.stroke()
  }
  // Center dot
  ctx.fillStyle = '#FFCC88'
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, t: number, pr: number) {
  const { x, y, health, hitFlash } = pu
  ctx.save()
  const pulse = Math.sin(t * 0.008) * 0.12 + 1
  const r = pr * pulse
  const hitAlpha = hitFlash / 10

  // Outer glow
  ctx.shadowBlur = 20 + hitFlash * 3
  ctx.shadowColor = hitFlash > 0 ? '#FFFFFF' : '#00FFAA'

  // Outer ring
  ctx.strokeStyle = hitFlash > 0 ? '#FFFFFF' : '#00FFAA'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.stroke()

  // Body
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
  grad.addColorStop(0, hitFlash > 0 ? '#FFFFFF' : '#44FFCC')
  grad.addColorStop(0.5, hitFlash > 0 ? '#FFAA00' : '#00BB88')
  grad.addColorStop(1, '#006644')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()

  // ⚡ icon
  ctx.shadowBlur = 0
  ctx.fillStyle = hitAlpha > 0 ? `rgba(255,255,255,${1 - hitAlpha * 0.5})` : '#FFFFAA'
  ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('⚡', x, y)

  // Health dots below
  const dotR = 4, dotSpacing = 12, dotY = y + r + 10
  const dotsX = x - ((PU_HEALTH - 1) / 2) * dotSpacing
  for (let i = 0; i < PU_HEALTH; i++) {
    const filled = i < health
    ctx.fillStyle = filled ? '#00FFAA' : 'rgba(0,255,170,0.2)'
    ctx.strokeStyle = '#00FFAA'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(dotsX + i * dotSpacing, dotY, dotR, 0, Math.PI * 2)
    if (filled) ctx.fill(); else ctx.stroke()
  }

  ctx.restore()
}

export default function PackingPeanuts({ gameId, gameSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'SCORE_SCREEN'>('TITLE')
  const [personalBest, setPersonalBest] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GT)

  const stateRef = useRef<'TITLE' | 'PLAYING' | 'SCORE_SCREEN'>('TITLE')
  const peanutsRef = useRef<Peanut[]>([])
  const popupsRef = useRef<ScorePopup[]>([])
  const pointerRef = useRef({ x: 200, y: 100 })
  const timerRef = useRef(GT * 1000)
  const scoreRef = useRef(0)
  const charRef = useRef({ x: 0, y: 0 })
  const playAreaRef = useRef({ top: 50, bottom: 400 })
  const timeRef = useRef(0)
  const bucketFlashRef = useRef<number[]>(Array(BUCKET_DEFS.length + 1).fill(0))
  const bonusXFRef = useRef(0.42)
  const bonusDirRef = useRef(1)
  const obsXFRef = useRef(OBS_DEFS.map(d => d.startXf))
  const obsYFRef = useRef(OBS_DEFS.map(d => d.startYf))
  const obsDirXRef = useRef(OBS_DEFS.map(d => d.vxDir))
  const obsDirYRef = useRef(OBS_DEFS.map(d => d.vyDir))

  // Power-up + super mode
  const puRef = useRef<PowerUp>({ x: 0, y: 0, vx: 1.8, vy: -1.4, health: PU_HEALTH, hitFlash: 0, respawnTimer: 0 })
  const superTimerRef = useRef(0)        // ms remaining of super mode (0 = off)
  const superBannerRef = useRef(0)       // display timer for "SUPER PEANUTS!" text
  const puActiveRef = useRef(true)       // is power-up visible/hittable?

  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'packing-peanuts', gameSlug: 'packing-peanuts' })
    const pb = parseInt(localStorage.getItem('sg_pb_packing-peanuts') ?? '0', 10)
    setPersonalBest(pb)
    sdkRef.current.onReady()
    return () => { sdkRef.current?.destroy(); sdkRef.current = null }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const parent = canvas.parentElement!
    const doResize = () => {
      const w = parent.clientWidth
      const h = parent.clientHeight || Math.max(window.innerHeight - 144, 300)
      if (w <= 0 || h <= 0) return
      canvas.width = w; canvas.height = h
      const hudH = 50, charZoneH = 110
      charRef.current = { x: w / 2, y: h - charZoneH / 2 }
      playAreaRef.current = { top: hudH, bottom: h - charZoneH }
      pointerRef.current = { x: w / 2, y: hudH + 80 }
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent); doResize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const toCanvas = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect()
      return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) }
    }
    const onMove = (e: MouseEvent) => { pointerRef.current = toCanvas(e.clientX, e.clientY) }
    const onTouch = (e: TouchEvent) => { pointerRef.current = toCanvas(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouch)
    }
  }, [])

  const startGame = useCallback(() => {
    peanutsRef.current = []
    popupsRef.current = []
    timerRef.current = GT * 1000
    scoreRef.current = 0
    timeRef.current = 0
    bonusXFRef.current = 0.42
    bonusDirRef.current = 1
    obsXFRef.current = OBS_DEFS.map(d => d.startXf)
    obsYFRef.current = OBS_DEFS.map(d => d.startYf)
    obsDirXRef.current = OBS_DEFS.map(d => d.vxDir)
    obsDirYRef.current = OBS_DEFS.map(d => d.vyDir)
    bucketFlashRef.current = Array(BUCKET_DEFS.length + 1).fill(0)
    superTimerRef.current = 0
    superBannerRef.current = 0
    puActiveRef.current = true
    // Init power-up in upper-center of play area
    const { top: cy, bottom: fy } = playAreaRef.current
    const pw = canvasRef.current?.width ?? 400
    puRef.current = { x: pw * 0.50, y: cy + (fy - cy) * 0.30, vx: 2.0, vy: -1.5, health: PU_HEALTH, hitFlash: 0, respawnTimer: 0 }
    setTimeLeft(GT)
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')
    sdkRef.current?.onStart()
  }, [])

  const endGame = useCallback(() => {
    const s = scoreRef.current
    setFinalScore(s)
    sdkRef.current?.onGameOver(s)
    const pb = parseInt(localStorage.getItem('sg_pb_packing-peanuts') ?? '0', 10)
    if (s > pb) { localStorage.setItem('sg_pb_packing-peanuts', String(s)); setPersonalBest(s) }
    stateRef.current = 'SCORE_SCREEN'
    setGameState('SCORE_SCREEN')
  }, [])

  const gameLoop = useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas || stateRef.current !== 'PLAYING') return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { width, height } = canvas
    const { top: ceilY, bottom: floorY } = playAreaRef.current
    const char = charRef.current
    const pointer = pointerRef.current
    const pw = width
    const playH = floorY - ceilY
    timeRef.current += dt

    // ── Timer ────────────────────────────────────────────────────────────────
    timerRef.current -= dt
    const secLeft = Math.max(0, Math.ceil(timerRef.current / 1000))
    setTimeLeft(secLeft)
    if (timerRef.current <= 0) { endGame(); return }

    const t = timeRef.current
    const superMode = superTimerRef.current > 0
    const activeSpawnRate = superMode ? SUPER_SPAWN_RATE : spawnRate
    const activePR = superMode ? SUPER_PR : PR

    // ── Super mode countdown ─────────────────────────────────────────────────
    if (superMode) {
      superTimerRef.current = Math.max(0, superTimerRef.current - dt)
      if (superTimerRef.current === 0) {
        // Super ended — start power-up respawn countdown
        puRef.current.respawnTimer = PU_RESPAWN
        puActiveRef.current = false
      }
    }
    if (superBannerRef.current > 0) superBannerRef.current = Math.max(0, superBannerRef.current - dt)

    // ── Power-up respawn ────────────────────────────────────────────────────
    if (!puActiveRef.current && !superMode) {
      puRef.current.respawnTimer -= dt
      if (puRef.current.respawnTimer <= 0) {
        // Respawn at random upper-play-area position
        puRef.current.x = pw * (0.25 + Math.random() * 0.5)
        puRef.current.y = ceilY + playH * (0.20 + Math.random() * 0.30)
        puRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random())
        puRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random())
        puRef.current.health = PU_HEALTH
        puRef.current.hitFlash = 0
        puActiveRef.current = true
      }
    }

    // ── Move bonus bucket ────────────────────────────────────────────────────
    const bonusMinXF = 0.08, bonusMaxXF = 1 - BONUS_WF - 0.08
    bonusXFRef.current += bonusDirRef.current * BONUS_SPEED_F * (dt / 16)
    if (bonusXFRef.current < bonusMinXF) { bonusXFRef.current = bonusMinXF; bonusDirRef.current = 1 }
    if (bonusXFRef.current > bonusMaxXF) { bonusXFRef.current = bonusMaxXF; bonusDirRef.current = -1 }

    // ── Move obstacles ───────────────────────────────────────────────────────
    OBS_DEFS.forEach((d, i) => {
      obsXFRef.current[i] += obsDirXRef.current[i] * d.speedF * (dt / 16)
      if (obsXFRef.current[i] < d.minXf) { obsXFRef.current[i] = d.minXf; obsDirXRef.current[i] = 1 }
      if (obsXFRef.current[i] > d.maxXf) { obsXFRef.current[i] = d.maxXf; obsDirXRef.current[i] = -1 }
      if (d.vyDir !== 0) {
        obsYFRef.current[i] += obsDirYRef.current[i] * d.speedF * 0.5 * (dt / 16)
        if (obsYFRef.current[i] < d.minYf) { obsYFRef.current[i] = d.minYf; obsDirYRef.current[i] = 1 }
        if (obsYFRef.current[i] > d.maxYf) { obsYFRef.current[i] = d.maxYf; obsDirYRef.current[i] = -1 }
      }
    })

    // ── Move power-up ────────────────────────────────────────────────────────
    const pu = puRef.current
    if (puActiveRef.current) {
      pu.x += pu.vx * (dt / 16)
      pu.y += pu.vy * (dt / 16)
      if (pu.x - PU_RADIUS < 0)    { pu.x = PU_RADIUS;       pu.vx =  Math.abs(pu.vx) }
      if (pu.x + PU_RADIUS > pw)   { pu.x = pw - PU_RADIUS;  pu.vx = -Math.abs(pu.vx) }
      if (pu.y - PU_RADIUS < ceilY) { pu.y = ceilY + PU_RADIUS; pu.vy =  Math.abs(pu.vy) }
      if (pu.y + PU_RADIUS > floorY) { pu.y = floorY - PU_RADIUS; pu.vy = -Math.abs(pu.vy) }
      if (pu.hitFlash > 0) pu.hitFlash--
    }

    // ── Compute pixel rects ──────────────────────────────────────────────────
    const buckets = BUCKET_DEFS.map(d => ({ x: d.xf * pw, y: ceilY + d.yf * playH, w: d.wf * pw, h: BUCKET_H }))
    const bonusBucket = { x: bonusXFRef.current * pw, y: ceilY + BONUS_YF * playH, w: BONUS_WF * pw, h: BUCKET_H - 2 }
    const obstacles = OBS_DEFS.map((d, i) => ({
      x: obsXFRef.current[i] * pw, y: ceilY + obsYFRef.current[i] * playH,
      w: d.wf * pw, h: d.hf * playH, type: d.type,
    }))

    // ── Aim ──────────────────────────────────────────────────────────────────
    const dx = pointer.x - char.x
    const dy = pointer.y - char.y
    let aimAngle = Math.atan2(dy, dx)
    if (aimAngle > 0) aimAngle = dx >= 0 ? -0.1 : -Math.PI + 0.1
    aimAngle = Math.max(-Math.PI + 0.1, Math.min(-0.1, aimAngle))
    const nozzleLen = 40
    const armOriginX = char.x, armOriginY = char.y - 16
    const nozzleX = armOriginX + Math.cos(aimAngle) * nozzleLen
    const nozzleY = armOriginY + Math.sin(aimAngle) * nozzleLen

    // ── Spawn peanuts ────────────────────────────────────────────────────────
    const peanuts = peanutsRef.current
    const colorSet = superMode ? SUPER_PEANUT_COLORS : PEANUT_COLORS
    if (peanuts.length < 800) {
      for (let i = 0; i < activeSpawnRate; i++) {
        const spread = superMode ? 0.28 : 0.22
        const ang = aimAngle + (Math.random() - 0.5) * spread
        const speed = blowerSpeed * (0.88 + Math.random() * 0.24) * (superMode ? 1.15 : 1)
        peanuts.push({
          x: nozzleX + (Math.random() - 0.5) * 4,
          y: nozzleY + (Math.random() - 0.5) * 4,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.22,
          color: colorSet[Math.floor(Math.random() * colorSet.length)],
          bounced: false,
        })
      }
    }

    // ── All score targets ────────────────────────────────────────────────────
    const allTargets = [
      ...buckets.map((b, i) => ({ ...b, pts: BUCKET_DEFS[i].pts, flashIdx: i })),
      { ...bonusBucket, pts: BONUS_PTS, flashIdx: BUCKET_DEFS.length },
    ]

    // ── Physics + scoring ────────────────────────────────────────────────────
    const surviving: Peanut[] = []
    for (const p of peanuts) {
      p.vy += G * (dt / 16)
      p.x += p.vx * (dt / 16)
      p.y += p.vy * (dt / 16)
      p.angle += p.spin
      if (p.x - activePR < 0)    { p.x = activePR;       p.vx =  Math.abs(p.vx) * bounceDamp }
      if (p.x + activePR > width) { p.x = width - activePR; p.vx = -Math.abs(p.vx) * bounceDamp }
      if (p.y - activePR < ceilY) { p.y = ceilY + activePR; p.vy =  Math.abs(p.vy) * bounceDamp }
      if (p.y + activePR > floorY) continue

      // ── Obstacle collisions (AABB circle-rect) ───────────────────────────
      for (const obs of obstacles) {
        const nearX = Math.max(obs.x, Math.min(p.x, obs.x + obs.w))
        const nearY = Math.max(obs.y, Math.min(p.y, obs.y + obs.h))
        const distX = p.x - nearX, distY = p.y - nearY
        const dist2 = distX * distX + distY * distY
        if (dist2 < activePR * activePR && dist2 > 0.001) {
          const dist = Math.sqrt(dist2)
          const nx = distX / dist, ny = distY / dist
          p.x = nearX + nx * (activePR + 1)
          p.y = nearY + ny * (activePR + 1)
          const dot = p.vx * nx + p.vy * ny
          const damp = obs.type === 'bumper' ? 0.85 : 0.72 // bumper is more elastic
          p.vx = (p.vx - 2 * dot * nx) * damp
          p.vy = (p.vy - 2 * dot * ny) * damp
          p.bounced = true
        }
      }

      // ── Power-up collision (circle-circle) ──────────────────────────────
      if (puActiveRef.current) {
        const pdx = p.x - pu.x, pdy = p.y - pu.y
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy)
        if (pdist < activePR + PU_RADIUS) {
          // Bounce peanut off power-up
          const nx = pdx / (pdist || 1), ny = pdy / (pdist || 1)
          const dot = p.vx * nx + p.vy * ny
          p.vx = (p.vx - 2 * dot * nx) * 0.9
          p.vy = (p.vy - 2 * dot * ny) * 0.9
          p.x = pu.x + nx * (activePR + PU_RADIUS + 1)
          p.y = pu.y + ny * (activePR + PU_RADIUS + 1)

          // Only count as a hit once per contact (brief cooldown via hitFlash)
          if (pu.hitFlash === 0) {
            pu.health--
            pu.hitFlash = 12
            if (pu.health <= 0) {
              // ACTIVATE SUPER PEANUTS!
              puActiveRef.current = false
              superTimerRef.current = PU_SUPER_DUR
              superBannerRef.current = 3000
              // Show big popup
              popupsRef.current.push({
                x: pu.x, y: pu.y - 20,
                text: '⚡ SUPER PEANUTS! ⚡',
                vy: -1.2, life: 90, maxLife: 90,
                color: '#FFD700',
              })
            } else {
              popupsRef.current.push({
                x: pu.x, y: pu.y - 14,
                text: `${pu.health} hit${pu.health === 1 ? '' : 's'} left`,
                vy: -1.5, life: 40, maxLife: 40,
                color: '#00FFAA',
              })
            }
          }
        }
      }

      // ── Bucket scoring ───────────────────────────────────────────────────
      let scored = false
      for (const tgt of allTargets) {
        const inX = p.x > tgt.x + 2 && p.x < tgt.x + tgt.w - 2
        const inMouth = p.vy > 0 && p.y >= tgt.y - activePR * 0.4 && p.y <= tgt.y + BUCKET_MOUTH
        if (inX && inMouth) {
          const mult = (superMode ? SUPER_MULT : 1) * (p.bounced ? 2 : 1)
          const pts = tgt.pts * mult
          scoreRef.current += pts
          bucketFlashRef.current[tgt.flashIdx] = 20
          let label = `+${pts}`
          if (p.bounced && superMode) label += ' 🎯⚡'
          else if (p.bounced) label += ' 🎯'
          else if (superMode) label += ' ⚡'
          popupsRef.current.push({
            x: tgt.x + tgt.w / 2, y: tgt.y - 4,
            text: label, vy: -2.0, life: 46, maxLife: 46,
            color: p.bounced ? '#FFD700' : (superMode ? '#FF8800' : tgt.pts >= 1000 ? '#CC00FF' : tgt.pts >= 500 ? '#FFD700' : tgt.pts >= 200 ? '#FF8844' : '#00BBDD'),
          })
          scored = true; break
        }
      }
      if (scored) continue
      surviving.push(p)
    }
    peanutsRef.current = surviving

    bucketFlashRef.current = bucketFlashRef.current.map(f => Math.max(0, f - 1))
    for (const pp of popupsRef.current) { pp.y += pp.vy; pp.vy *= 0.96; pp.life-- }
    popupsRef.current = popupsRef.current.filter(pp => pp.life > 0)

    // ── Draw ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#180E06'; ctx.fillRect(0, 0, width, height)

    // Play area with super-mode tint
    if (superMode) {
      ctx.fillStyle = '#2A1A00'; ctx.fillRect(0, ceilY, pw, playH)
      // Gold border
      const superFrac = superTimerRef.current / PU_SUPER_DUR
      ctx.strokeStyle = `rgba(255,180,0,${0.5 + Math.sin(t * 0.012) * 0.3})`
      ctx.lineWidth = 3
      ctx.strokeRect(1, ceilY + 1, pw - 2, playH - 2)
    } else {
      ctx.fillStyle = '#1E1208'; ctx.fillRect(0, ceilY, pw, playH)
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(55,35,14,0.35)'; ctx.lineWidth = 0.5
    for (let gx = 0; gx <= pw; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, ceilY); ctx.lineTo(gx, floorY); ctx.stroke() }
    for (let gy = ceilY; gy <= floorY; gy += 36) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(pw, gy); ctx.stroke() }
    ctx.strokeStyle = '#3A2010'; ctx.lineWidth = 1.5; ctx.strokeRect(1, ceilY, pw - 2, playH)
    ctx.fillStyle = '#3A2010'; ctx.fillRect(0, floorY - 5, pw, 5)

    // ── Draw obstacles ───────────────────────────────────────────────────────
    for (const obs of obstacles) {
      if (obs.type === 'crate') drawCrate(ctx, obs.x, obs.y, obs.w, obs.h)
      else if (obs.type === 'bar') drawBar(ctx, obs.x, obs.y, obs.w, obs.h, t)
      else drawBumperBlock(ctx, obs.x, obs.y, obs.w, obs.h, t)
    }

    // ── Draw power-up ────────────────────────────────────────────────────────
    if (puActiveRef.current) {
      drawPowerUp(ctx, pu, t, PU_RADIUS)
    }

    // ── Draw buckets ─────────────────────────────────────────────────────────
    BUCKET_DEFS.forEach((d, i) => {
      drawBucket(ctx, buckets[i].x, buckets[i].y, buckets[i].w, BUCKET_H,
        d.label, d.col, d.rim, d.txt, bucketFlashRef.current[i], false, t, superMode)
    })
    drawBucket(ctx, bonusBucket.x, bonusBucket.y, bonusBucket.w, bonusBucket.h,
      superMode ? `⚡${BONUS_PTS * 3}` : `⚡${BONUS_PTS}`, '#CC00FF', '#880099', '#FFF',
      bucketFlashRef.current[BUCKET_DEFS.length], true, t, false)

    // ── Draw peanuts ─────────────────────────────────────────────────────────
    for (const p of peanutsRef.current) {
      ctx.save()
      ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      if (superMode) {
        ctx.shadowBlur = 6; ctx.shadowColor = p.color
      }
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.ellipse(0, 0, activePR, activePR * 0.62, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(-activePR * 0.3, 0); ctx.lineTo(activePR * 0.3, 0); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath(); ctx.ellipse(-activePR * 0.2, -activePR * 0.18, activePR * 0.3, activePR * 0.18, -0.4, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    // ── Score popups ─────────────────────────────────────────────────────────
    for (const pp of popupsRef.current) {
      ctx.save()
      ctx.globalAlpha = pp.life / pp.maxLife
      ctx.fillStyle = pp.color
      const fs = pp.text.includes('SUPER') ? 18 : 16
      ctx.font = `bold ${fs}px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(pp.text, pp.x, pp.y)
      ctx.restore()
    }

    // ── "SUPER PEANUTS!" banner ──────────────────────────────────────────────
    if (superBannerRef.current > 0) {
      const bannerAlpha = Math.min(1, superBannerRef.current / 600)
      ctx.fillStyle = `rgba(0,0,0,${bannerAlpha * 0.7})`
      ctx.fillRect(0, ceilY + playH * 0.35, pw, playH * 0.20)
      ctx.fillStyle = `rgba(255,200,0,${bannerAlpha})`
      ctx.font = `bold ${Math.min(36, pw * 0.08)}px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('⚡ SUPER PEANUTS! ⚡', pw / 2, ceilY + playH * 0.45)
      ctx.fillStyle = `rgba(255,150,0,${bannerAlpha * 0.8})`
      ctx.font = `bold ${Math.min(18, pw * 0.04)}px "Bebas Neue", var(--font-display), sans-serif`
      ctx.fillText(`${SUPER_MULT}× SCORE · BIGGER PEANUTS · ${Math.ceil(superTimerRef.current / 1000)}s`, pw / 2, ceilY + playH * 0.52)
    } else if (superMode) {
      // Mini super indicator during super mode (after banner fades)
      ctx.fillStyle = `rgba(255,180,0,${0.6 + Math.sin(t * 0.015) * 0.3})`
      ctx.font = `bold ${Math.min(14, pw * 0.032)}px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.fillText(`⚡ SUPER ×3 · ${Math.ceil(superTimerRef.current / 1000)}s`, pw - 12, ceilY + playH * 0.08)
    }

    // ── Character zone ───────────────────────────────────────────────────────
    ctx.fillStyle = '#120A04'; ctx.fillRect(0, floorY + 2, pw, height - floorY - 2)
    const bx = char.x, by = char.y
    ctx.fillStyle = '#333'; ctx.fillRect(bx - 14, by - 2, 10, 20); ctx.fillRect(bx + 4, by - 2, 10, 20)
    ctx.fillStyle = '#FF3D00'; ctx.fillRect(bx - 14, by - 28, 28, 30)
    ctx.fillStyle = '#F5C5A3'; ctx.beginPath(); ctx.arc(bx, by - 38, 12, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#5A3310'; ctx.fillRect(bx - 11, by - 50, 22, 10)
    ctx.beginPath(); ctx.arc(bx, by - 50, 11, Math.PI, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = '#1A1A1A'; ctx.beginPath(); ctx.arc(bx + 4, by - 40, 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = superMode ? '#FFD700' : '#888'; ctx.lineWidth = 9; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(armOriginX, armOriginY); ctx.lineTo(nozzleX, nozzleY); ctx.stroke()
    ctx.fillStyle = superMode ? '#AA8800' : '#555'; ctx.beginPath(); ctx.arc(nozzleX, nozzleY, 7, 0, Math.PI * 2); ctx.fill()
    ctx.save()
    ctx.globalAlpha = 0.12; ctx.fillStyle = superMode ? '#FFD700' : '#FFFFFF'
    ctx.beginPath(); ctx.moveTo(nozzleX, nozzleY)
    ctx.lineTo(nozzleX + Math.cos(aimAngle - 0.36) * 44, nozzleY + Math.sin(aimAngle - 0.36) * 44)
    ctx.lineTo(nozzleX + Math.cos(aimAngle) * 60, nozzleY + Math.sin(aimAngle) * 60)
    ctx.lineTo(nozzleX + Math.cos(aimAngle + 0.36) * 44, nozzleY + Math.sin(aimAngle + 0.36) * 44)
    ctx.closePath(); ctx.fill()
    ctx.restore()

    // Hint (first 5 s)
    if (timerRef.current > (GT - 5) * 1000) {
      ctx.fillStyle = 'rgba(255,210,100,0.85)'
      ctx.font = `bold 12px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('HIT ⚡ FOR SUPER PEANUTS · AIM INTO BUCKETS · BOUNCE FOR 2X', pw / 2, floorY + (height - floorY) / 2 + 14)
    }

    // ── HUD ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = superMode ? 'rgba(40,20,0,0.94)' : 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, pw, ceilY)
    ctx.strokeStyle = superMode ? 'rgba(255,180,0,0.5)' : 'rgba(245,215,120,0.3)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, ceilY); ctx.lineTo(pw, ceilY); ctx.stroke()
    const hudMid = ceilY / 2
    ctx.fillStyle = secLeft <= 10 ? '#FF3D00' : '#FFFFFF'
    ctx.font = `bold 26px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(`⏱ ${secLeft}s`, 12, hudMid)
    ctx.fillStyle = superMode ? '#FFD700' : '#F5E6C8'; ctx.textAlign = 'right'
    ctx.fillText(`${scoreRef.current}`, pw - 12, hudMid)
  }, [endGame])

  useGameLoop(gameLoop, gameState === 'PLAYING')

  const isNewBest = finalScore > personalBest

  return (
    <div className="absolute inset-0 bg-[#180E06]" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" style={{ touchAction: 'none', cursor: 'crosshair' }} />

      {/* ── TITLE ───────────────────────────────────────────────────────────── */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'linear-gradient(to bottom, #180E06, #2A1A0C)' }}>
          <div className="text-6xl mb-4">🥜</div>
          <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>PACKING PEANUTS</h1>
          <p className="text-sm mb-1" style={{ color: '#F5E6C8', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            SHOOT INTO BUCKETS · RICOCHET FOR 2X
          </p>
          <p className="text-xs mb-6" style={{ color: '#88FF66', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            HIT ⚡ POWER-UP FOR SUPER PEANUTS (3× SCORE!)
          </p>
          <div className="flex gap-3 text-xs text-[#555] mb-8 justify-center flex-wrap">
            <span>50 pts — side buckets</span>
            <span>200 pts — mid buckets</span>
            <span>500 pts — top center</span>
            <span>⚡1000 pts — moving bonus</span>
          </div>
          {personalBest > 0 && (
            <p className="text-sm mb-6" style={{ color: '#F5E6C8', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>BEST: {personalBest} pts</p>
          )}
          <button onClick={startGame}
            className="px-10 py-4 rounded-xl text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(245,230,200,0.3)]"
            style={{ background: '#8B6914', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', color: '#FFF' }}>
            BLOW IT!
          </button>
        </div>
      )}

      {/* ── SCORE SCREEN (Runner-style) ──────────────────────────────────────── */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(18,10,4,0.97)' }}>
          {isNewBest && finalScore > 0 && (
            <div className="text-sm mb-2 animate-bounce" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
              🥜 NEW BEST! 🥜
            </div>
          )}
          <div className="text-5xl mb-3">{finalScore >= 10000 ? '🏆' : finalScore >= 4000 ? '⚡' : '🥜'}</div>
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>TIME&apos;S UP!</h2>
          <p className="text-6xl mb-1" style={{ color: '#F5E6C8', fontFamily: 'var(--font-display)' }}>{finalScore}</p>
          <p className="text-[#555] text-sm mb-8">points packed</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={startGame}
              className="px-6 py-3 text-white rounded-xl transition-all active:scale-95"
              style={{ background: '#8B6914', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              BLOW AGAIN
            </button>
            <button onClick={() => { stateRef.current = 'TITLE'; setGameState('TITLE') }}
              className="px-6 py-3 border border-[#2A1A08] hover:border-[#8B6914] text-[#666] hover:text-white rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              MENU
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
