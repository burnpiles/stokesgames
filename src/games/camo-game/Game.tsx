'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { CAMO_CONFIG } from './game.config'

type Phase = 'PLACING' | 'SCANNING' | 'RESULT'
type Character = 'ALEX' | 'ALAN'
type GSType = 'CHAR_SELECT' | 'PLAYING' | 'SCORE_SCREEN'
interface Props { gameId: string; gameSlug: string; mode?: string }

const { rounds: ROUNDS, scanSpeed: SCAN_SPEED, maxScore: MAX_SCORE } = CAMO_CONFIG
const PLACE_TIME = 5  // fast — reflex game

// ─── CAMO TYPES ──────────────────────────────────────────────────────────────
// 5 muted earth-tone palettes. Colors are DELIBERATELY close in value/saturation
// so it takes a real visual read — not just "tap the obvious bright circle".
const CAMO_TYPES = [
  { id: 'jungle',
    body: '#2A6E1C', bodyDark: '#164010', leg: '#0E2408', shoe: '#080808',
    zoneCol: '#1E5A14', zoneDark: '#0E2C08',
    spot1: 'rgba(10,38,4,0.55)', spot2: 'rgba(5,18,2,0.40)',
    swatchBorder: '#3A8828' },
  { id: 'desert',
    body: '#A87428', bodyDark: '#6A4818', leg: '#38240A', shoe: '#120C04',
    zoneCol: '#8A5E1E', zoneDark: '#4A3210',
    spot1: 'rgba(60,34,4,0.55)', spot2: 'rgba(30,17,2,0.40)',
    swatchBorder: '#C89030' },
  { id: 'arctic',
    body: '#5888A4', bodyDark: '#386278', leg: '#1E404E', shoe: '#0E1E28',
    zoneCol: '#426E84', zoneDark: '#264858',
    spot1: 'rgba(56,96,130,0.50)', spot2: 'rgba(28,56,80,0.40)',
    swatchBorder: '#70A8C4' },
  { id: 'urban',
    body: '#2C3040', bodyDark: '#181C26', leg: '#0E1018', shoe: '#060608',
    zoneCol: '#1E2230', zoneDark: '#0E101C',
    spot1: 'rgba(16,20,34,0.58)', spot2: 'rgba(8,10,20,0.42)',
    swatchBorder: '#44485A' },
  { id: 'forest',
    body: '#5C6C28', bodyDark: '#384018', leg: '#1C2208', shoe: '#0A0A06',
    zoneCol: '#465418', zoneDark: '#24280C',
    spot1: 'rgba(30,40,4,0.55)', spot2: 'rgba(15,20,2,0.40)',
    swatchBorder: '#7A8C30' },
]

// ─── LEVEL CONFIGS ────────────────────────────────────────────────────────────
// Zones always occupy 4 quadrants (top-left, top-right, bottom-left, bottom-right)
// — easy to scan quickly. correctZoneIdx is which quadrant position holds the correct type.
// Zone shapes cycle: 0=organic blob, 1=flat ellipse, 2=tall shadow, 3=diamond wedge
const LEVEL_CONFIGS = [
  { name: 'JUNGLE',  bg1: '#051005', bg2: '#0D1E0A', correctZoneIdx: 0, zones: [
    { ct: 0, cx: 0.20, cy: 0.34, r: 0.10 }, // JUNGLE ← correct  (organic blob)
    { ct: 2, cx: 0.78, cy: 0.30, r: 0.09 }, // arctic decoy       (flat ellipse)
    { ct: 4, cx: 0.18, cy: 0.68, r: 0.10 }, // forest decoy       (tall shadow)
    { ct: 1, cx: 0.80, cy: 0.66, r: 0.09 }, // desert decoy       (diamond)
  ]},
  { name: 'DESERT',  bg1: '#3A2808', bg2: '#5A3E14', correctZoneIdx: 1, zones: [
    { ct: 4, cx: 0.20, cy: 0.32, r: 0.09 }, // forest decoy
    { ct: 1, cx: 0.80, cy: 0.35, r: 0.10 }, // DESERT ← correct
    { ct: 3, cx: 0.18, cy: 0.70, r: 0.09 }, // urban decoy
    { ct: 0, cx: 0.78, cy: 0.68, r: 0.09 }, // jungle decoy
  ]},
  { name: 'ARCTIC',  bg1: '#9AB8C4', bg2: '#C0D4DE', correctZoneIdx: 3, zones: [
    { ct: 0, cx: 0.20, cy: 0.33, r: 0.09 }, // jungle decoy
    { ct: 4, cx: 0.78, cy: 0.32, r: 0.09 }, // forest decoy
    { ct: 1, cx: 0.18, cy: 0.68, r: 0.10 }, // desert decoy
    { ct: 2, cx: 0.80, cy: 0.67, r: 0.10 }, // ARCTIC ← correct
  ]},
  { name: 'URBAN',   bg1: '#070710', bg2: '#12121E', correctZoneIdx: 2, zones: [
    { ct: 2, cx: 0.20, cy: 0.34, r: 0.09 }, // arctic decoy
    { ct: 0, cx: 0.79, cy: 0.31, r: 0.09 }, // jungle decoy
    { ct: 3, cx: 0.18, cy: 0.69, r: 0.10 }, // URBAN ← correct
    { ct: 4, cx: 0.80, cy: 0.67, r: 0.09 }, // forest decoy
  ]},
  { name: 'FOREST',  bg1: '#040A04', bg2: '#081008', correctZoneIdx: 1, zones: [
    { ct: 3, cx: 0.20, cy: 0.33, r: 0.09 }, // urban decoy
    { ct: 4, cx: 0.78, cy: 0.32, r: 0.10 }, // FOREST ← correct
    { ct: 1, cx: 0.18, cy: 0.69, r: 0.09 }, // desert decoy
    { ct: 2, cx: 0.80, cy: 0.67, r: 0.09 }, // arctic decoy
  ]},
]

function makeRng(seed: number) {
  return (n: number) => {
    const x = Math.sin(seed + n * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
  }
}

// ─── Draw a natural zone shape ────────────────────────────────────────────────
// shapeIdx 0: organic blob | 1: wide flat | 2: tall shadow | 3: wedge/diamond
function drawNaturalZone(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  ct: typeof CAMO_TYPES[0],
  rng: (n: number) => number, seed: number, shapeIdx: number
) {
  ctx.save()
  ctx.globalAlpha = 0.84

  switch (shapeIdx % 4) {
    case 0: {
      // Organic blob — uneven polygon with smooth variation
      ctx.fillStyle = ct.zoneCol
      ctx.beginPath()
      const pts = 8
      for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * Math.PI * 2
        const rad = r * (0.68 + rng(seed + i * 7) * 0.44)
        const px = cx + Math.cos(angle) * rad
        const py = cy + Math.sin(angle) * rad * 0.78
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = ct.zoneDark
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.42, r * 0.35, 0, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 1: {
      // Wide flat ellipse — rock base, snowdrift, sand shadow
      const tilt = rng(seed) * 0.35 - 0.18
      ctx.fillStyle = ct.zoneCol
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * 1.7, r * 0.62, tilt, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ct.zoneDark
      ctx.beginPath()
      ctx.ellipse(cx + r * 0.12, cy + r * 0.12, r * 1.1, r * 0.34, tilt, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 2: {
      // Tall shadow — wall corner, tree trunk shadow, pillar base
      const hw = r * 0.72, hh = r * 1.55
      ctx.fillStyle = ct.zoneCol
      ctx.beginPath()
      ctx.moveTo(cx - hw, cy + hh * 0.55)
      ctx.bezierCurveTo(cx - hw * 1.1, cy - hh * 0.65, cx - hw * 0.5, cy - hh, cx, cy - hh)
      ctx.bezierCurveTo(cx + hw * 0.5, cy - hh, cx + hw * 1.1, cy - hh * 0.65, cx + hw, cy + hh * 0.55)
      ctx.bezierCurveTo(cx + hw * 0.55, cy + hh, cx - hw * 0.55, cy + hh, cx - hw, cy + hh * 0.55)
      ctx.fill()
      ctx.fillStyle = ct.zoneDark
      ctx.beginPath()
      ctx.ellipse(cx, cy + r * 0.1, hw * 0.45, hh * 0.52, 0, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 3: {
      // Angular wedge — rubble heap, ice chunk, debris pile
      ctx.fillStyle = ct.zoneCol
      ctx.beginPath()
      ctx.moveTo(cx, cy - r * 1.05)
      ctx.lineTo(cx + r * 1.25, cy - r * 0.18)
      ctx.lineTo(cx + r * 0.85, cy + r * 0.88)
      ctx.lineTo(cx - r * 0.85, cy + r * 0.88)
      ctx.lineTo(cx - r * 1.25, cy - r * 0.18)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = ct.zoneDark
      ctx.beginPath()
      ctx.moveTo(cx, cy - r * 0.45)
      ctx.lineTo(cx + r * 0.55, cy + r * 0.32)
      ctx.lineTo(cx - r * 0.55, cy + r * 0.32)
      ctx.closePath(); ctx.fill()
      break
    }
  }

  // Camo texture dots (no outline, no labels — purely visual)
  ctx.fillStyle = ct.spot1
  for (let i = 0; i < 5; i++) {
    const sx = cx + (rng(seed + i * 11) - 0.5) * r * 1.3
    const sy = cy + (rng(seed + i * 13) - 0.5) * r * 0.9
    const sr = r * (0.05 + rng(seed + i * 17) * 0.07)
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = ct.spot2
  for (let i = 0; i < 3; i++) {
    const sx = cx + (rng(seed + i * 23) - 0.5) * r * 0.8
    const sy = cy + (rng(seed + i * 29) - 0.5) * r * 0.7
    ctx.beginPath(); ctx.arc(sx, sy, r * 0.09, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ─── Character pixel art ──────────────────────────────────────────────────────
function drawCamoChar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  char: Character, camoTypeIdx: number, caught: boolean
) {
  const ct = CAMO_TYPES[camoTypeIdx % CAMO_TYPES.length]
  const hoodie     = caught ? '#CC0000' : ct.body
  const hoodieDark = caught ? '#880000' : ct.bodyDark
  const legCol     = caught ? '#880000' : ct.leg
  const shoeCol    = caught ? '#440000' : ct.shoe

  const s = size / 10
  const px = cx - size / 2
  const py = cy - size

  // Hair
  ctx.fillStyle = '#2A1808'
  ctx.fillRect(px + s, py + s * 0.5, s * 8, s * 1.2)
  ctx.fillRect(px + s, py + s * 0.5, s, s * 2.5)
  ctx.fillRect(px + s * 8, py + s * 0.5, s, s * 2.5)
  ctx.fillRect(px + s * 2, py, s * 0.8, s * 0.8)
  ctx.fillRect(px + s * 4, py - s * 0.5, s * 0.8, s)
  ctx.fillRect(px + s * 6, py, s * 0.8, s * 0.8)

  // Face
  ctx.fillStyle = caught ? '#FF6666' : '#F5C5A3'
  ctx.fillRect(px + s * 2.2, py + s * 1.2, s * 5.6, s * 3.8)

  // Eyes
  ctx.fillStyle = '#1A1A1A'
  ctx.fillRect(px + s * 3.1, py + s * 2.2, s * 1.1, s * 1.1)
  ctx.fillRect(px + s * 5.8, py + s * 2.2, s * 1.1, s * 1.1)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(px + s * 3.1, py + s * 2.2, s * 0.5, s * 0.5)
  ctx.fillRect(px + s * 5.8, py + s * 2.2, s * 0.5, s * 0.5)

  ctx.fillStyle = '#2A1808'
  ctx.fillRect(px + s * (char === 'ALEX' ? 3.0 : 3.1), py + s * 1.8, s * 1.3, s * 0.4)
  ctx.fillRect(px + s * (char === 'ALEX' ? 5.7 : 5.6), py + s * 1.8, s * 1.3, s * 0.4)
  ctx.fillStyle = char === 'ALAN' ? 'rgba(255,120,100,0.5)' : 'rgba(255,130,110,0.4)'
  ctx.fillRect(px + s * 2.2, py + s * 3.5, s * 1.2, s * 0.8)
  ctx.fillRect(px + s * 6.6, py + s * 3.5, s * 1.2, s * 0.8)
  ctx.fillStyle = caught ? '#FF0000' : '#C05A48'
  ctx.fillRect(px + s * 3.8, py + s * 4.5, s * 2.4, s * 0.5)

  // Arms
  ctx.fillStyle = hoodie
  ctx.fillRect(px, py + s * 5, s * 2, s * 3.5)
  ctx.fillRect(px + s * 8, py + s * 5, s * 2, s * 3.5)
  // Hoodie body
  ctx.fillStyle = hoodie
  ctx.fillRect(px + s * 1.8, py + s * 5, s * 6.4, s * 4)
  ctx.fillStyle = hoodieDark
  ctx.fillRect(px + s * 3, py + s * 5, s * 4, s * 0.8)
  // Zipper
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(px + s * 4.6, py + s * 5.8, s * 0.6, s * 2.2)

  // Camo spots on hoodie (always visible — this IS the outfit they wear)
  const spotSeeds = [[0.2, 0.1], [0.6, 0.3], [0.15, 0.55], [0.55, 0.65], [0.35, 0.85], [0.75, 0.9]]
  for (const [fx, fy] of spotSeeds) {
    ctx.fillStyle = ct.spot1
    ctx.fillRect(px + s * (2 + fx * 6), py + s * (5.2 + fy * 3), s * 1.2, s * 1.2)
  }
  ctx.fillStyle = ct.spot2
  ctx.fillRect(px + s * 2.8, py + s * 7, s * 0.9, s * 0.9)
  ctx.fillRect(px + s * 6.0, py + s * 6.2, s * 0.9, s * 0.9)

  // Hands
  ctx.fillStyle = caught ? '#FF6666' : '#F5C5A3'
  ctx.fillRect(px + s * 0.2, py + s * 8.5, s * 1.8, s * 0.9)
  ctx.fillRect(px + s * 8, py + s * 8.5, s * 1.8, s * 0.9)

  // Legs
  ctx.fillStyle = legCol
  ctx.fillRect(px + s * 2.2, py + s * 9, s * 2.2, s * 2.8)
  ctx.fillRect(px + s * 5.6, py + s * 9, s * 2.2, s * 2.8)
  ctx.fillStyle = hoodieDark
  ctx.fillRect(px + s * 2.2, py + s * 10.2, s * 2.2, s * 0.5)
  ctx.fillRect(px + s * 5.6, py + s * 10.2, s * 2.2, s * 0.5)

  // Shoes
  ctx.fillStyle = shoeCol
  ctx.fillRect(px + s * 1.5, py + s * 11.8, s * 3.2, s * 1)
  ctx.fillRect(px + s * 5.2, py + s * 11.8, s * 3.2, s * 1)
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(px + s * 1.5, py + s * 12.5, s * 3.2, s * 0.3)
  ctx.fillRect(px + s * 5.2, py + s * 12.5, s * 3.2, s * 0.3)
}

// ─── Environment backgrounds ─────────────────────────────────────────────────
function drawEnv(ctx: CanvasRenderingContext2D, w: number, h: number, levelIdx: number, rng: (n: number) => number) {
  const lv = LEVEL_CONFIGS[levelIdx]
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, lv.bg1); bg.addColorStop(1, lv.bg2)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

  if (levelIdx === 0) {
    // JUNGLE: canopy, vines, undergrowth
    ctx.fillStyle = '#0A1808'; ctx.fillRect(0, h * 0.55, w, h * 0.45)
    ctx.fillStyle = '#060F06'
    for (let i = 0; i < 12; i++) {
      const tx = rng(i * 13) * w, th = (rng(i * 7) * 0.4 + 0.2) * h, tw = (rng(i * 11) * 0.025 + 0.012) * w
      ctx.fillRect(tx, h - th, tw, th)
    }
    for (let i = 0; i < 16; i++) {
      const lx = rng(i * 19) * w, ly = rng(i * 23) * h * 0.6 + h * 0.04
      const lr = (rng(i * 29) * 0.07 + 0.035) * Math.min(w, h)
      ctx.fillStyle = i % 3 === 0 ? '#0D2C0E' : (i % 3 === 1 ? '#102614' : '#0A2009')
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill()
    }
    ctx.strokeStyle = '#0D260D'; ctx.lineWidth = 1.5
    for (let i = 0; i < 5; i++) {
      const sx = rng(i * 17) * w
      ctx.beginPath(); ctx.moveTo(sx, 0)
      for (let y2 = 0; y2 < h; y2 += 16) ctx.lineTo(sx + Math.sin(y2 * 0.08 + i * 2) * 12, y2)
      ctx.stroke()
    }

  } else if (levelIdx === 1) {
    // DESERT: dunes, cacti, heat texture
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.38)
    sky.addColorStop(0, '#3A2A10'); sky.addColorStop(1, '#5A4018')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.38)
    ctx.strokeStyle = 'rgba(130,90,20,0.12)'; ctx.lineWidth = 1
    for (let yi = h * 0.38; yi < h; yi += 4) {
      ctx.beginPath(); ctx.moveTo(0, yi + (rng(yi) - 0.5) * 2)
      ctx.lineTo(w, yi + (rng(yi + 1) - 0.5) * 2); ctx.stroke()
    }
    for (let i = 0; i < 4; i++) {
      const dx = rng(i * 5) * w * 0.7 + w * 0.1, dy = h * (0.46 + i * 0.13)
      const dw2 = w * (0.2 + rng(i * 7) * 0.28), dh2 = h * (0.08 + rng(i * 11) * 0.09)
      ctx.fillStyle = i % 2 === 0 ? '#4A3008' : '#3C2406'
      ctx.beginPath(); ctx.ellipse(dx, dy, dw2, dh2, 0, Math.PI, 0); ctx.fill()
    }
    for (let i = 0; i < 4; i++) {
      const cx2 = rng(i * 23) * w * 0.85 + w * 0.05, cy2 = h * (0.46 + rng(i * 29) * 0.28)
      const ch = h * (0.08 + rng(i * 31) * 0.12), cw2 = ch * 0.18
      ctx.fillStyle = '#284A0E'
      ctx.fillRect(cx2 - cw2 / 2, cy2 - ch, cw2, ch)
      if (rng(i * 37) > 0.4) {
        const armH = ch * 0.35, armY = cy2 - ch * 0.6
        ctx.fillRect(cx2 - cw2 * 2.5, armY, cw2 * 2, ch * 0.25)
        ctx.fillRect(cx2 - cw2 * 2.5, armY - armH, cw2, armH)
        ctx.fillRect(cx2 + cw2 / 2, armY, cw2 * 2, ch * 0.25)
        ctx.fillRect(cx2 + cw2 * 1.5, armY - armH * 0.7, cw2, armH * 0.7)
      }
    }

  } else if (levelIdx === 2) {
    // ARCTIC: snowfields, icicles, ice cracks
    for (let i = 0; i < 6; i++) {
      const sx = rng(i * 23) * w, sh = (rng(i * 29) * 0.14 + 0.08) * h, sw2 = (rng(i * 31) * 0.25 + 0.14) * w
      ctx.fillStyle = '#CDE0EC'; ctx.beginPath(); ctx.ellipse(sx, h, sw2, sh, 0, Math.PI, 0); ctx.fill()
    }
    ctx.strokeStyle = 'rgba(70,100,120,0.22)'; ctx.lineWidth = 1
    for (let i = 0; i < 20; i++) {
      const sx2 = rng(i * 7) * w, sy2 = rng(i * 11) * h
      ctx.beginPath(); ctx.moveTo(sx2, sy2)
      ctx.lineTo(sx2 + (rng(i * 13) - 0.5) * 70, sy2 + (rng(i * 17) - 0.5) * 70); ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < 50; i++) {
      const sz2 = rng(i * 41) * 2.5 + 0.8
      ctx.fillRect(rng(i * 7) * w - sz2 / 2, rng(i * 11) * h - sz2 / 2, sz2, sz2)
    }
    ctx.fillStyle = '#9EC0D4'
    for (let i = 0; i < 12; i++) {
      const ix = rng(i * 53) * w, il = h * (0.03 + rng(i * 59) * 0.06), iw3 = 3 + rng(i * 61) * 4
      ctx.beginPath(); ctx.moveTo(ix, 0); ctx.lineTo(ix - iw3 / 2, il); ctx.lineTo(ix + iw3 / 2, il); ctx.closePath(); ctx.fill()
    }

  } else if (levelIdx === 3) {
    // URBAN: night city skyline, wet streets
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    for (let i = 0; i < 35; i++) {
      const sz3 = rng(i * 7) > 0.85 ? 2 : 1
      ctx.fillRect(rng(i * 7) * w, rng(i * 13) * h * 0.28, sz3, sz3)
    }
    for (let i = 0; i < 10; i++) {
      const bx = (i / 10) * w, bw3 = w / 10 - 2, bh3 = (rng(i * 7) * 0.5 + 0.22) * h
      ctx.fillStyle = '#08081A'; ctx.fillRect(bx, h - bh3, bw3, bh3)
      for (let wr = 0; wr < Math.floor(bh3 / 14); wr++) {
        for (let wc = 0; wc < Math.floor(bw3 / 10); wc++) {
          if (rng(i * 100 + wr * 10 + wc) > 0.58) {
            ctx.fillStyle = 'rgba(255,195,45,0.16)'; ctx.fillRect(bx + wc * 10 + 2, h - bh3 + wr * 14 + 3, 6, 9)
          }
        }
      }
      if (rng(i * 71) > 0.5) { ctx.fillStyle = '#08081A'; ctx.fillRect(bx + bw3 * 0.4, h - bh3 - h * 0.06, 2, h * 0.06) }
    }
    ctx.fillStyle = '#0C0C1A'; ctx.fillRect(0, h * 0.82, w, h * 0.18)
    ctx.fillStyle = 'rgba(50,50,90,0.12)'; ctx.fillRect(0, h * 0.82, w, 2)

  } else {
    // FOREST: dense dark canopy, thick trunks
    ctx.fillStyle = '#050B04'; ctx.fillRect(0, h * 0.55, w, h * 0.45)
    for (let i = 0; i < 9; i++) {
      const tx2 = rng(i * 11) * w * 0.9 + w * 0.05, tw4 = (rng(i * 17) * 0.025 + 0.014) * w, th4 = (rng(i * 19) * 0.48 + 0.34) * h
      ctx.fillStyle = '#030603'; ctx.fillRect(tx2, h - th4, tw4, th4)
      ctx.fillStyle = '#050A04'; ctx.fillRect(tx2 + tw4 * 0.3, h - th4, tw4 * 0.15, th4)
    }
    for (let i = 0; i < 20; i++) {
      const lx2 = rng(i * 23) * w, ly2 = rng(i * 29) * h * 0.45
      const lr2 = (rng(i * 31) * 0.09 + 0.04) * Math.min(w, h)
      ctx.fillStyle = i % 3 === 0 ? '#040C04' : (i % 3 === 1 ? '#060E04' : '#030803')
      ctx.beginPath(); ctx.arc(lx2, ly2, lr2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.strokeStyle = '#04090203'; ctx.lineWidth = 3
    for (let i = 0; i < 7; i++) {
      const rx = rng(i * 37) * w, ry = h * (0.6 + rng(i * 41) * 0.3)
      ctx.beginPath(); ctx.moveTo(rx, ry)
      ctx.bezierCurveTo(rx + (rng(i * 43) - 0.5) * 50, ry - 18, rx + (rng(i * 47) - 0.5) * 80, ry + 18, rx + (rng(i * 53) - 0.5) * 100, ry)
      ctx.stroke()
    }
  }
}

export default function CamoGame({ gameId, gameSlug }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GSType>('CHAR_SELECT')
  const [personalBest, setPersonalBest] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [roundDisplay, setRoundDisplay] = useState(1)
  const [timeDisplay, setTimeDisplay] = useState(PLACE_TIME)

  const stateRef      = useRef<GSType>('CHAR_SELECT')
  const charRef       = useRef<Character>('ALAN')
  const phaseRef      = useRef<Phase>('PLACING')
  const phaseTimerRef = useRef(PLACE_TIME * 1000)
  const roundRef      = useRef(0)
  const totalScoreRef = useRef(0)
  const charPosRef    = useRef<{ x: number; y: number } | null>(null)
  const scanXRef      = useRef(0)
  const roundResultRef = useRef<'hidden' | 'caught' | null>(null)
  const roundScoreRef  = useRef(0)
  const outfitTypeRef  = useRef(0)
  const sdkRef        = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'camo-game', gameSlug: 'camo-game' })
    const pb = parseInt(localStorage.getItem('sg_pb_camo-game') ?? '0', 10)
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
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent); doResize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const place = (cx: number, cy: number) => {
      if (stateRef.current !== 'PLAYING' || phaseRef.current !== 'PLACING') return
      const canvas = canvasRef.current; if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (cx - rect.left) * (canvas.width / rect.width)
      const y = (cy - rect.top) * (canvas.height / rect.height)
      if (y > 50) charPosRef.current = { x, y }
    }
    const onClick = (e: MouseEvent) => place(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => { place(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault() }
    window.addEventListener('click', onClick)
    window.addEventListener('touchstart', onTouch, { passive: false })
    return () => { window.removeEventListener('click', onClick); window.removeEventListener('touchstart', onTouch) }
  }, [])

  const checkCorrectZone = useCallback((charX: number, charY: number, w: number, h: number, levelIdx: number): number => {
    const lv = LEVEL_CONFIGS[levelIdx]
    const z = lv.zones[lv.correctZoneIdx]
    const zr = z.r * Math.min(w, h)
    const dx = charX - z.cx * w, dy = charY - z.cy * h
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > zr) return 0
    return Math.round((1 - dist / zr) * MAX_SCORE)
  }, [])

  const startGame = useCallback((char?: Character) => {
    if (char) charRef.current = char
    roundRef.current = 0
    totalScoreRef.current = 0
    phaseRef.current = 'PLACING'
    phaseTimerRef.current = PLACE_TIME * 1000
    charPosRef.current = null
    scanXRef.current = 0
    roundResultRef.current = null
    roundScoreRef.current = 0
    const lv0 = LEVEL_CONFIGS[0]
    outfitTypeRef.current = lv0.zones[lv0.correctZoneIdx].ct
    setRoundDisplay(1); setTimeDisplay(PLACE_TIME)
    stateRef.current = 'PLAYING'; setGameState('PLAYING')
    sdkRef.current?.onStart()
  }, [])

  const endGame = useCallback(() => {
    const s = totalScoreRef.current
    setFinalScore(s); sdkRef.current?.onGameOver(s)
    const pb = parseInt(localStorage.getItem('sg_pb_camo-game') ?? '0', 10)
    if (s > pb) { localStorage.setItem('sg_pb_camo-game', String(s)); setPersonalBest(s) }
    stateRef.current = 'SCORE_SCREEN'; setGameState('SCORE_SCREEN')
  }, [])

  const gameLoop = useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas || stateRef.current !== 'PLAYING') return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { width, height } = canvas
    const roundIdx = roundRef.current
    const levelIdx = roundIdx % LEVEL_CONFIGS.length
    const lv = LEVEL_CONFIGS[levelIdx]
    const rng = makeRng(levelIdx * 100 + 42)
    const char = charRef.current
    const outfitCt = outfitTypeRef.current

    // ── Background ────────────────────────────────────────────────────────────
    drawEnv(ctx, width, height, levelIdx, rng)

    // ── Zone patches (no labels, no outlines — organic shapes only) ───────────
    for (let zi = 0; zi < lv.zones.length; zi++) {
      const z = lv.zones[zi]
      const zx = z.cx * width, zy = z.cy * height, zr = z.r * Math.min(width, height)
      drawNaturalZone(ctx, zx, zy, zr, CAMO_TYPES[z.ct], rng, zi * 100 + levelIdx, zi)
    }

    const phase = phaseRef.current
    const charSize = Math.min(width, height) * 0.085
    const charPos = charPosRef.current ?? { x: width / 2, y: height * 0.64 }
    const secLeft = Math.max(0, Math.ceil(phaseTimerRef.current / 1000))

    if (phase === 'PLACING') {
      phaseTimerRef.current -= dt
      const secLeftNow = Math.max(0, Math.ceil(phaseTimerRef.current / 1000))
      setTimeDisplay(secLeftNow)

      // Draw character at placed/default position (no zone reveal hint)
      ctx.fillStyle = 'rgba(0,0,0,0.30)'
      ctx.beginPath(); ctx.ellipse(charPos.x, charPos.y + 6, charSize * 0.4, charSize * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      drawCamoChar(ctx, charPos.x, charPos.y, charSize, char, outfitCt, false)

      // Pulse ring only if character not yet placed
      if (!charPosRef.current) {
        const pulse = (Date.now() % 800) / 800
        ctx.strokeStyle = `rgba(255,255,120,${0.55 - pulse * 0.45})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(width / 2, height * 0.64, charSize * (1 + pulse * 0.4), 0, Math.PI * 2); ctx.stroke()
      }

      // ── 3-2-1 countdown overlay (dramatic) ─────────────────────────────────
      if (secLeftNow <= 3 && secLeftNow > 0) {
        const fracInSec = (phaseTimerRef.current % 1000) / 1000  // 0→1 per second
        const cntScale = 1.55 - fracInSec * 0.55  // pops big, shrinks down
        const cntAlpha = 0.92 - fracInSec * 0.25
        const cColors: Record<number, string> = { 3: '#FFE000', 2: '#FF8C00', 1: '#FF2200' }
        const cColor = cColors[secLeftNow] ?? '#FFFF00'
        ctx.save()
        ctx.globalAlpha = cntAlpha
        ctx.translate(width / 2, height * 0.46)
        ctx.scale(cntScale, cntScale)
        ctx.shadowBlur = 60; ctx.shadowColor = cColor
        ctx.fillStyle = cColor
        ctx.font = `bold ${Math.min(180, Math.floor(width * 0.42))}px "Bebas Neue", var(--font-display), sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(secLeftNow), 0, 0)
        ctx.restore()
      }

      if (phaseTimerRef.current <= 0) {
        phaseRef.current = 'SCANNING'
        scanXRef.current = 0
        const pos = charPosRef.current ?? { x: width / 2, y: height * 0.64 }
        roundScoreRef.current = checkCorrectZone(pos.x, pos.y, width, height, levelIdx)
        roundResultRef.current = roundScoreRef.current > 0 ? 'hidden' : 'caught'
      }

    } else if (phase === 'SCANNING') {
      scanXRef.current += width * SCAN_SPEED * (dt / 1000)
      const caught = roundResultRef.current === 'caught'
      const beamX = scanXRef.current
      const beamColor = caught ? '255,80,80' : '255,255,100'
      const beamGrd = ctx.createLinearGradient(beamX - 40, 0, beamX + 40, 0)
      beamGrd.addColorStop(0, `rgba(${beamColor},0)`)
      beamGrd.addColorStop(0.5, `rgba(${beamColor},0.38)`)
      beamGrd.addColorStop(1, `rgba(${beamColor},0)`)
      ctx.fillStyle = beamGrd; ctx.fillRect(beamX - 40, 0, 80, height)

      const nearBeam = Math.abs(charPos.x - beamX) < 48
      if (nearBeam && caught) {
        ctx.fillStyle = 'rgba(255,0,0,0.22)'; ctx.fillRect(0, 0, width, height)
      }
      ctx.save()
      if (!nearBeam && !caught) ctx.globalAlpha = 0.15
      drawCamoChar(ctx, charPos.x, charPos.y, charSize, char, outfitCt, caught && nearBeam)
      ctx.restore()

      if (scanXRef.current > width + 60) {
        phaseRef.current = 'RESULT'
        phaseTimerRef.current = 1400
        totalScoreRef.current += roundScoreRef.current
      }

    } else if (phase === 'RESULT') {
      phaseTimerRef.current -= dt
      const caught = roundResultRef.current === 'caught'
      drawCamoChar(ctx, charPos.x, charPos.y, charSize, char, outfitCt, caught)

      const bAlpha = Math.min(1, phaseTimerRef.current > 900 ? 1 : phaseTimerRef.current / 900) * 0.92
      ctx.fillStyle = caught ? `rgba(170,0,0,${bAlpha})` : `rgba(0,130,55,${bAlpha})`
      ctx.fillRect(0, height * 0.36, width, height * 0.22)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${Math.min(46, width * 0.10)}px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(caught ? '🔦 SPOTTED!' : `🌿 HIDDEN! +${roundScoreRef.current}`, width / 2, height * 0.47)

      if (phaseTimerRef.current <= 0) {
        if (roundRef.current < ROUNDS - 1) {
          roundRef.current++
          const nextLv = LEVEL_CONFIGS[roundRef.current % LEVEL_CONFIGS.length]
          outfitTypeRef.current = nextLv.zones[nextLv.correctZoneIdx].ct
          phaseRef.current = 'PLACING'
          phaseTimerRef.current = PLACE_TIME * 1000
          charPosRef.current = null; scanXRef.current = 0
          roundResultRef.current = null; roundScoreRef.current = 0
          setRoundDisplay(roundRef.current + 1); setTimeDisplay(PLACE_TIME)
        } else { endGame() }
      }
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.84)'; ctx.fillRect(0, 0, width, 48)
    ctx.strokeStyle = 'rgba(80,180,60,0.45)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(width, 48); ctx.stroke()

    ctx.fillStyle = '#88FF66'
    ctx.font = `bold 19px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(`ROUND ${roundDisplay}/5`, 12, 16)
    ctx.fillStyle = char === 'ALAN' ? '#FF6644' : '#4499FF'
    ctx.font = `bold 13px "Bebas Neue", var(--font-display), sans-serif`
    ctx.fillText(char, 12, 36)

    ctx.fillStyle = '#888'
    ctx.font = `14px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`SCORE: ${totalScoreRef.current}`, width / 2, 24)

    if (phase === 'PLACING') {
      ctx.fillStyle = timeDisplay <= 3 ? '#FF3D00' : '#FFFFFF'
      ctx.font = `bold 22px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(`${timeDisplay}s`, width - 12, 24)
    } else if (phase === 'SCANNING') {
      ctx.fillStyle = '#FFD700'
      ctx.font = `bold 18px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('SCANNING...', width - 12, 24)
    }

    // ── Outfit swatch — bottom bar (the ONLY hint) ────────────────────────────
    if (phase === 'PLACING') {
      const ct3 = CAMO_TYPES[outfitCt]
      const barH = 52, barY = height - barH
      ctx.fillStyle = 'rgba(0,0,0,0.80)'; ctx.fillRect(0, barY, width, barH)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, barY); ctx.lineTo(width, barY); ctx.stroke()

      // Swatch block
      const sw = 32, sh = 28, sx = 14, sy = barY + (barH - sh) / 2
      ctx.fillStyle = ct3.zoneCol; ctx.fillRect(sx, sy, sw, sh)
      // Camo dots on swatch
      ctx.fillStyle = ct3.spot1
      for (const [dx, dy] of [[0.2, 0.2], [0.6, 0.5], [0.35, 0.78]]) {
        ctx.fillRect(sx + dx * sw, sy + dy * sh, 4, 4)
      }
      // Border
      ctx.strokeStyle = ct3.swatchBorder; ctx.lineWidth = 1.5
      ctx.strokeRect(sx, sy, sw, sh)

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `bold 11px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText('MATCH', sx + sw + 8, barY + barH * 0.36)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = `bold 14px "Bebas Neue", var(--font-display), sans-serif`
      ctx.fillText('YOUR OUTFIT', sx + sw + 8, barY + barH * 0.68)

      // Arrow pointing at swatch
      ctx.fillStyle = ct3.swatchBorder
      ctx.beginPath()
      ctx.moveTo(sx + sw + 5, barY + barH * 0.5)
      ctx.lineTo(sx + sw + 2, barY + barH * 0.5 - 5)
      ctx.lineTo(sx + sw + 2, barY + barH * 0.5 + 5)
      ctx.closePath(); ctx.fill()

      // Right: TAP hint
      ctx.fillStyle = 'rgba(255,255,180,0.50)'
      ctx.font = `bold 11px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.fillText('TAP TO PLACE', width - 12, barY + barH / 2)
    }

    void secLeft
  }, [checkCorrectZone, endGame, roundDisplay, timeDisplay])

  useGameLoop(gameLoop, gameState === 'PLAYING')

  const isNewBest = finalScore > personalBest

  return (
    <div className="absolute inset-0 bg-[#040804]" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" style={{ cursor: 'crosshair', touchAction: 'none' }} />

      {/* ── CHARACTER SELECT ─────────────────────────────────────────────── */}
      {gameState === 'CHAR_SELECT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'linear-gradient(to bottom, #040804, #081208)' }}>
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-5xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>CAMO GAME</h1>
          <p className="text-sm mb-2" style={{ color: '#88FF66', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>CHOOSE WHO HIDES</p>
          <p className="text-xs mb-8 max-w-xs leading-relaxed" style={{ color: '#446' }}>
            Your outfit gets a camo pattern each round. Find the zone that matches — you have 5 seconds.
          </p>

          <div className="flex gap-5 mb-8">
            {(['ALAN', 'ALEX'] as Character[]).map((ch) => (
              <button key={ch}
                onClick={() => startGame(ch)}
                className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl transition-all active:scale-95 hover:scale-105"
                style={{ border: `2px solid ${ch === 'ALAN' ? '#FF4422' : '#4499FF'}`, background: `rgba(${ch === 'ALAN' ? '255,68,34' : '68,153,255'},0.07)` }}
              >
                <canvas width={64} height={96}
                  style={{ imageRendering: 'pixelated', width: 72, height: 108 }}
                  ref={(c) => {
                    if (!c) return
                    const x = c.getContext('2d')!
                    x.clearRect(0, 0, 64, 96)
                    drawCamoChar(x, 32, 96, 50, ch, 4, false)
                  }}
                />
                <span className="text-xl" style={{ color: ch === 'ALAN' ? '#FF4422' : '#4499FF', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>{ch}</span>
              </button>
            ))}
          </div>
          <p className="text-[#333] text-xs">5 rounds · 5 seconds each</p>
          {personalBest > 0 && (
            <p className="text-sm mt-4" style={{ color: '#88FF66', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>BEST: {personalBest} pts</p>
          )}
        </div>
      )}

      {/* ── SCORE SCREEN ─────────────────────────────────────────────────── */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(4,8,4,0.97)' }}>
          {isNewBest && (
            <div className="text-sm mb-2 animate-bounce" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>🌿 NEW BEST! 🌿</div>
          )}
          <div className="text-5xl mb-3">{finalScore >= 1500 ? '🏆' : finalScore >= 800 ? '🌿' : '🔦'}</div>
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>GAME OVER</h2>
          <p className="text-6xl mb-1" style={{ color: '#88FF66', fontFamily: 'var(--font-display)' }}>{finalScore}</p>
          <p className="text-[#444] text-sm mb-8">Max possible: {ROUNDS * MAX_SCORE}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => startGame()}
              className="px-6 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: '#2A6A12', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', color: '#fff' }}>
              PLAY AGAIN
            </button>
            <button onClick={() => { stateRef.current = 'CHAR_SELECT'; setGameState('CHAR_SELECT') }}
              className="px-6 py-3 border border-[#1A3A0A] hover:border-[#3A7A1A] text-[#555] hover:text-white rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              SWITCH
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
