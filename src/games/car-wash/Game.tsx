'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { useGameLoop } from '@/lib/game-engine/useGameLoop'
import { CAR_WASH_CONFIG } from './game.config'

interface Droplet { x: number; y: number; vx: number; vy: number; life: number }
interface Props { gameId: string; gameSlug: string; mode?: string }

const { gridW: GW, gridH: GH, washRadius: WR } = CAR_WASH_CONFIG

// ── Vehicle isCell functions ──────────────────────────────────────────────────

function isLamboCell(gx: number, gy: number): boolean {
  const isBody = gy >= 9 && gy < GH - 1 && gx >= 1 && gx < GW - 1
  const isCabin = gy >= 3 && gy < 9 && gx >= Math.floor(GW * 0.24) && gx < Math.floor(GW * 0.76)
  const leftArch = gy >= GH - 4 && gx >= 3 && gx <= 9
  const rightArch = gy >= GH - 4 && gx >= GW - 10 && gx <= GW - 4
  return (isBody || isCabin) && !leftArch && !rightArch
}

function isLimoCell(gx: number, gy: number): boolean {
  const isBody = gy >= 10 && gy < GH - 1 && gx >= 1 && gx < GW - 1
  const isCabin = gy >= 5 && gy < 10 && gx >= Math.floor(GW * 0.36) && gx < Math.floor(GW * 0.64)
  const leftArch = gy >= GH - 3 && gx >= 2 && gx <= 6
  const midArch = gy >= GH - 3 && gx >= Math.floor(GW * 0.47) && gx <= Math.floor(GW * 0.53)
  const rightArch = gy >= GH - 3 && gx >= GW - 7 && gx <= GW - 3
  return (isBody || isCabin) && !leftArch && !midArch && !rightArch
}

function isPickupCell(gx: number, gy: number): boolean {
  const cabRight = Math.floor(GW * 0.44)
  const isCab = gy >= 2 && gy < GH - 1 && gx >= 2 && gx < cabRight
  const isBed = gy >= 9 && gy < GH - 2 && gx >= cabRight && gx < GW - 2
  const leftArch = gy >= GH - 4 && gx >= 4 && gx <= 10
  const rightArch = gy >= GH - 4 && gx >= GW - 14 && gx <= GW - 8
  return (isCab || isBed) && !leftArch && !rightArch
}

function isTankCell(gx: number, gy: number): boolean {
  const isHull = gy >= 9 && gy < GH - 1 && gx >= 1 && gx < GW - 1
  const turretCX = GW / 2, turretCY = 5.5
  const dx = gx - turretCX, dy = gy - turretCY
  const isTurret = dx * dx + dy * dy <= 36
  const isBarrel = gy >= 4 && gy < 6 && gx >= Math.floor(GW * 0.58) && gx < GW - 2
  return isHull || isTurret || isBarrel
}

function isBoatCell(gx: number, gy: number): boolean {
  const minTop = Math.max(6, Math.round(16 - gx * 10 / GW))
  const isHull = gy >= minTop && gy < GH - 2 && gx >= 2 && gx < GW - 2
  const isDeck = gy >= 3 && gy < 6 && gx >= Math.floor(GW * 0.28) && gx < GW - 3
  return isHull || isDeck
}

function isMonsterCell(gx: number, gy: number): boolean {
  const isBody = gy >= 5 && gy < GH - 1 && gx >= 5 && gx < GW - 5
  const isCabin = gy >= 1 && gy < 5 && gx >= Math.floor(GW * 0.22) && gx < Math.floor(GW * 0.78)
  const leftArch = (gx - 10) ** 2 + (gy - (GH - 5)) ** 2 <= 49
  const rightArch = (gx - (GW - 11)) ** 2 + (gy - (GH - 5)) ** 2 <= 49
  return (isBody || isCabin) && !leftArch && !rightArch
}

// ── Draw functions ────────────────────────────────────────────────────────────

function drawLambo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const wheelR = h * 0.21
  const bodyH = h * 0.38
  const bodyY = groundY - wheelR * 0.5 - bodyH
  const cabinH = h * 0.26
  const cabinY = bodyY - cabinH + 4

  // Main body
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.04, bodyY, w * 0.92, bodyH, 5)
  ctx.fill()
  // Side stripe
  ctx.fillStyle = '#CC9F00'
  ctx.fillRect(x + w * 0.04, bodyY + bodyH * 0.42, w * 0.92, bodyH * 0.1)
  // Cabin
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.27, cabinY, w * 0.46, cabinH, [10, 10, 0, 0])
  ctx.fill()
  // Windshield (dark tint)
  ctx.fillStyle = '#1A1A2A'
  ctx.globalAlpha = 0.82
  ctx.beginPath()
  ctx.roundRect(x + w * 0.285, cabinY + cabinH * 0.12, w * 0.43, cabinH * 0.75, [7, 7, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1
  // Front headlight
  ctx.fillStyle = '#FFFFAA'
  ctx.fillRect(x + w * 0.05, bodyY + bodyH * 0.22, w * 0.04, bodyH * 0.18)
  // Rear tail light
  ctx.fillStyle = '#FF2200'
  ctx.fillRect(x + w * 0.91, bodyY + bodyH * 0.22, w * 0.04, bodyH * 0.18)
  // Front bumper splitter
  ctx.fillStyle = '#333'
  ctx.fillRect(x + w * 0.02, bodyY + bodyH * 0.65, w * 0.06, bodyH * 0.3)
  // Rear diffuser
  ctx.fillStyle = '#333'
  ctx.fillRect(x + w * 0.92, bodyY + bodyH * 0.65, w * 0.06, bodyH * 0.3)
  // Exhaust tips
  ctx.fillStyle = '#888'
  ctx.fillRect(x + w * 0.84, groundY - wheelR * 0.5 - 7, 10, 5)
  ctx.fillRect(x + w * 0.84, groundY - wheelR * 0.5 - 1, 10, 5)

  // Wheel arches
  const frontWX = x + w * 0.175, rearWX = x + w * 0.72
  for (const wx of [frontWX, rearWX]) {
    ctx.fillStyle = '#111'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 1.08, Math.PI, 0); ctx.fill()
  }
  // Tires
  ctx.fillStyle = '#1A1A1A'
  for (const wx of [frontWX, rearWX]) {
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR, 0, Math.PI * 2); ctx.fill()
  }
  // Rims
  for (const wx of [frontWX, rearWX]) {
    ctx.fillStyle = '#DDDDDD'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.56, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(wx, groundY - wheelR)
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.52, groundY - wheelR + Math.sin(a) * wheelR * 0.52)
      ctx.stroke()
    }
    ctx.fillStyle = '#555'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.14, 0, Math.PI * 2); ctx.fill()
    // Brake caliper
    ctx.fillStyle = '#FF5500'
    ctx.fillRect(wx - wheelR * 0.22, groundY - wheelR * 1.55, wheelR * 0.44, wheelR * 0.28)
  }
}

function drawLimo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const wheelR = h * 0.17
  const bodyH = h * 0.32
  const bodyY = groundY - wheelR * 0.4 - bodyH
  const cabinH = h * 0.22
  const cabinY = bodyY - cabinH + 2

  // Main long body
  ctx.fillStyle = '#111111'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.02, bodyY, w * 0.96, bodyH, 4)
  ctx.fill()

  // Chrome side stripe
  ctx.fillStyle = '#888888'
  ctx.fillRect(x + w * 0.02, bodyY + bodyH * 0.45, w * 0.96, bodyH * 0.06)

  // Cabin section (center)
  ctx.fillStyle = '#0D0D0D'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.36, cabinY, w * 0.28, cabinH, [8, 8, 0, 0])
  ctx.fill()

  // Multiple tinted windows across cabin
  const winY = cabinY + cabinH * 0.1
  const winH = cabinH * 0.7
  // Left body windows
  for (let i = 0; i < 3; i++) {
    const wx = x + w * (0.06 + i * 0.1)
    ctx.fillStyle = '#0A1520'
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.roundRect(wx, winY, w * 0.07, winH, 3)
    ctx.fill()
    ctx.globalAlpha = 1
    // Window glare
    ctx.fillStyle = 'rgba(100,160,220,0.15)'
    ctx.fillRect(wx + 3, winY + 3, w * 0.02, winH * 0.4)
  }
  // Cabin windshield
  ctx.fillStyle = '#0A1520'
  ctx.globalAlpha = 0.88
  ctx.beginPath()
  ctx.roundRect(x + w * 0.37, cabinY + cabinH * 0.08, w * 0.26, cabinH * 0.78, [6, 6, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1
  // Right body windows
  for (let i = 0; i < 2; i++) {
    const wx = x + w * (0.67 + i * 0.1)
    ctx.fillStyle = '#0A1520'
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.roundRect(wx, winY, w * 0.07, winH, 3)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Front headlight
  ctx.fillStyle = '#FFFFCC'
  ctx.fillRect(x + w * 0.03, bodyY + bodyH * 0.2, w * 0.03, bodyH * 0.2)
  // Rear tail light
  ctx.fillStyle = '#CC0000'
  ctx.fillRect(x + w * 0.94, bodyY + bodyH * 0.2, w * 0.03, bodyH * 0.2)

  // Front grille
  ctx.fillStyle = '#444'
  for (let gi = 0; gi < 4; gi++) {
    ctx.fillRect(x + w * 0.03, bodyY + bodyH * 0.5 + gi * 3, w * 0.05, 2)
  }

  // 3 wheels: 12%, 50%, 88%
  const wheelXs = [x + w * 0.12, x + w * 0.5, x + w * 0.88]
  for (const wx of wheelXs) {
    // Arch
    ctx.fillStyle = '#0A0A0A'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 1.1, Math.PI, 0); ctx.fill()
    // Tire
    ctx.fillStyle = '#181818'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR, 0, Math.PI * 2); ctx.fill()
    // Rim
    ctx.fillStyle = '#CCCCCC'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.52, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(wx, groundY - wheelR)
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.48, groundY - wheelR + Math.sin(a) * wheelR * 0.48)
      ctx.stroke()
    }
    ctx.fillStyle = '#444'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.12, 0, Math.PI * 2); ctx.fill()
  }
}

function drawPickupTruck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const wheelR = h * 0.2
  const cabRight = x + w * 0.46

  // Cab body (boxy, blue, tall)
  const cabBodyY = groundY - wheelR * 0.5 - h * 0.52
  const cabBodyH = h * 0.52
  ctx.fillStyle = '#1E90FF'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.02, cabBodyY, w * 0.44, cabBodyH, [6, 6, 2, 2])
  ctx.fill()

  // Cab roof highlight
  ctx.fillStyle = '#4AAFFF'
  ctx.fillRect(x + w * 0.03, cabBodyY + 3, w * 0.42, 6)

  // Cab windshield
  ctx.fillStyle = '#0A1A30'
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.roundRect(x + w * 0.04, cabBodyY + cabBodyH * 0.08, w * 0.19, cabBodyH * 0.48, [4, 4, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1
  // Windshield glare
  ctx.fillStyle = 'rgba(80,160,255,0.2)'
  ctx.fillRect(x + w * 0.05, cabBodyY + cabBodyH * 0.1, w * 0.06, cabBodyH * 0.2)

  // Rear cab window
  ctx.fillStyle = '#0A1A30'
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.roundRect(x + w * 0.27, cabBodyY + cabBodyH * 0.08, w * 0.16, cabBodyH * 0.48, [4, 4, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1

  // Door handle
  ctx.fillStyle = '#DDD'
  ctx.fillRect(x + w * 0.3, cabBodyY + cabBodyH * 0.6, w * 0.08, 4)

  // Cab front grille
  ctx.fillStyle = '#0055AA'
  ctx.fillRect(x + w * 0.02, cabBodyY + cabBodyH * 0.62, w * 0.04, cabBodyH * 0.25)
  // Headlight
  ctx.fillStyle = '#FFFFAA'
  ctx.fillRect(x + w * 0.02, cabBodyY + cabBodyH * 0.3, w * 0.03, cabBodyH * 0.16)

  // Flat bed (grey, lower than cab roof)
  const bedY = groundY - wheelR * 0.5 - h * 0.3
  const bedH = h * 0.3
  ctx.fillStyle = '#707070'
  ctx.beginPath()
  ctx.roundRect(cabRight, bedY, w * 0.5, bedH, [2, 2, 2, 2])
  ctx.fill()

  // Bed floor (darker)
  ctx.fillStyle = '#555'
  ctx.fillRect(cabRight + 4, bedY + 8, w * 0.48 - 8, bedH - 12)

  // Bed rails (top left, top right, rear)
  ctx.fillStyle = '#888'
  ctx.fillRect(cabRight, bedY, w * 0.5, 6) // top rail
  ctx.fillRect(cabRight, bedY, 5, bedH)    // left stake
  ctx.fillRect(x + w * 0.94, bedY, 5, bedH) // right stake (rear)
  // Rear tail light
  ctx.fillStyle = '#CC0000'
  ctx.fillRect(x + w * 0.94, bedY + bedH * 0.2, w * 0.04, bedH * 0.25)

  // Exhaust
  ctx.fillStyle = '#888'
  ctx.fillRect(x + w * 0.88, groundY - wheelR * 0.5 - 6, 8, 4)

  // 2 wheels: front at 17%, rear at 79%
  const frontWX = x + w * 0.17, rearWX = x + w * 0.79
  for (const wx of [frontWX, rearWX]) {
    // Arch
    ctx.fillStyle = '#0A0A0A'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 1.1, Math.PI, 0); ctx.fill()
    // Tire
    ctx.fillStyle = '#1A1A1A'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR, 0, Math.PI * 2); ctx.fill()
    // Rim
    ctx.fillStyle = '#BBBBBB'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.52, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#777'; ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(wx, groundY - wheelR)
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.48, groundY - wheelR + Math.sin(a) * wheelR * 0.48)
      ctx.stroke()
    }
    ctx.fillStyle = '#444'
    ctx.beginPath(); ctx.arc(wx, groundY - wheelR, wheelR * 0.12, 0, Math.PI * 2); ctx.fill()
  }
}

function drawTank(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const hullH = h * 0.38
  const hullY = groundY - hullH - h * 0.04

  // Dark tread belt at very bottom
  ctx.fillStyle = '#1A1A1A'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.02, hullY + hullH * 0.72, w * 0.96, hullH * 0.28 + h * 0.04, 4)
  ctx.fill()
  // Tread segments
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2
  for (let tx = 0; tx < 18; tx++) {
    const tx_ = x + w * 0.03 + tx * (w * 0.94 / 18)
    ctx.beginPath()
    ctx.moveTo(tx_, hullY + hullH * 0.74)
    ctx.lineTo(tx_, groundY - 2)
    ctx.stroke()
  }
  // Tread wheels (small road wheels)
  ctx.fillStyle = '#2A2A2A'
  for (let rw = 0; rw < 6; rw++) {
    const rwx = x + w * 0.07 + rw * (w * 0.84 / 5)
    ctx.beginPath(); ctx.arc(rwx, groundY - h * 0.06, h * 0.065, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#444'
    ctx.beginPath(); ctx.arc(rwx, groundY - h * 0.06, h * 0.03, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#2A2A2A'
  }

  // Hull (olive green rectangle)
  ctx.fillStyle = '#4A5E2A'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.03, hullY, w * 0.94, hullH * 0.72, [3, 3, 0, 0])
  ctx.fill()
  // Hull panel lines
  ctx.strokeStyle = '#3A4E1A'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x + w * 0.03, hullY + hullH * 0.36); ctx.lineTo(x + w * 0.97, hullY + hullH * 0.36); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w * 0.25, hullY); ctx.lineTo(x + w * 0.25, hullY + hullH * 0.72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w * 0.75, hullY); ctx.lineTo(x + w * 0.75, hullY + hullH * 0.72); ctx.stroke()

  // Turret (circular, dark grey, slightly right of center)
  const turretCX = x + w * 0.46
  const turretCY = hullY - h * 0.12
  const turretR = h * 0.22
  ctx.fillStyle = '#3E5222'
  ctx.beginPath(); ctx.arc(turretCX, turretCY, turretR, 0, Math.PI * 2); ctx.fill()
  // Turret shading
  ctx.fillStyle = '#4A6228'
  ctx.beginPath()
  ctx.arc(turretCX - turretR * 0.2, turretCY - turretR * 0.2, turretR * 0.65, 0, Math.PI * 2)
  ctx.fill()
  // Turret edge
  ctx.strokeStyle = '#2A3A12'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(turretCX, turretCY, turretR, 0, Math.PI * 2); ctx.stroke()

  // Hatch on turret top
  ctx.fillStyle = '#2E3D18'
  ctx.beginPath()
  ctx.ellipse(turretCX - turretR * 0.1, turretCY - turretR * 0.3, turretR * 0.28, turretR * 0.18, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1E2C0E'; ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(turretCX - turretR * 0.1, turretCY - turretR * 0.3, turretR * 0.28, turretR * 0.18, -0.3, 0, Math.PI * 2)
  ctx.stroke()
  // Hatch bolt
  ctx.fillStyle = '#666'
  ctx.beginPath(); ctx.arc(turretCX - turretR * 0.1, turretCY - turretR * 0.3, 3, 0, Math.PI * 2); ctx.fill()

  // Long barrel extending right
  const barrelStartX = turretCX + turretR * 0.8
  const barrelY = turretCY - h * 0.02
  const barrelW = w * 0.38
  const barrelH = h * 0.055
  ctx.fillStyle = '#3A4A1E'
  ctx.beginPath()
  ctx.roundRect(barrelStartX, barrelY - barrelH / 2, barrelW, barrelH, 3)
  ctx.fill()
  // Barrel end cap
  ctx.fillStyle = '#2A3A12'
  ctx.beginPath()
  ctx.arc(barrelStartX + barrelW, barrelY, barrelH / 2, 0, Math.PI * 2)
  ctx.fill()
  // Barrel muzzle brake
  ctx.fillStyle = '#1E2C0E'
  ctx.fillRect(barrelStartX + barrelW - 8, barrelY - barrelH * 0.75, 8, barrelH * 1.5)
}

function drawSpeedboat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const hullBottom = groundY - h * 0.06
  const hullMidY = hullBottom - h * 0.28
  const hullTopY = hullBottom - h * 0.48

  // Hull shadow / water line
  ctx.fillStyle = 'rgba(0,80,160,0.25)'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.5, hullBottom + h * 0.03, w * 0.44, h * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()

  // Blue bottom stripe of hull
  ctx.fillStyle = '#0055AA'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.04, hullBottom)          // rear bottom
  ctx.lineTo(x + w * 0.92, hullBottom)           // front bottom
  ctx.lineTo(x + w * 0.98, hullMidY + h * 0.08) // prow
  ctx.lineTo(x + w * 0.92, hullMidY)            // front mid
  ctx.lineTo(x + w * 0.06, hullMidY)            // rear mid
  ctx.lineTo(x + w * 0.02, hullBottom - h * 0.04)
  ctx.closePath()
  ctx.fill()

  // White main hull
  ctx.fillStyle = '#F0F4FF'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.04, hullMidY)            // rear
  ctx.lineTo(x + w * 0.92, hullMidY)            // side
  ctx.lineTo(x + w * 0.98, hullMidY - h * 0.06) // prow tip
  ctx.lineTo(x + w * 0.92, hullTopY)            // front top
  ctx.lineTo(x + w * 0.06, hullTopY)            // rear top
  ctx.lineTo(x + w * 0.02, hullMidY + h * 0.04)
  ctx.closePath()
  ctx.fill()

  // Hull shading
  ctx.fillStyle = 'rgba(0,40,120,0.08)'
  ctx.fillRect(x + w * 0.04, hullMidY, w * 0.9, h * 0.06)

  // Deck surface
  ctx.fillStyle = '#D8DCF0'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.06, hullTopY + h * 0.02, w * 0.84, h * 0.1, 3)
  ctx.fill()

  // Cockpit windshield frame
  const cockpitX = x + w * 0.3
  const cockpitY = hullTopY - h * 0.18
  const cockpitW = w * 0.32
  const cockpitH = h * 0.22
  ctx.fillStyle = '#0044AA'
  ctx.beginPath()
  ctx.roundRect(cockpitX - 3, cockpitY - 3, cockpitW + 6, cockpitH + 6, [8, 8, 0, 0])
  ctx.fill()
  // Windshield glass (blue tinted)
  ctx.fillStyle = '#1A4A88'
  ctx.globalAlpha = 0.82
  ctx.beginPath()
  ctx.roundRect(cockpitX, cockpitY, cockpitW, cockpitH, [6, 6, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1
  // Windshield glare
  ctx.fillStyle = 'rgba(180,220,255,0.3)'
  ctx.beginPath()
  ctx.roundRect(cockpitX + 4, cockpitY + 4, cockpitW * 0.35, cockpitH * 0.5, 3)
  ctx.fill()

  // Seat visible in cockpit
  ctx.fillStyle = '#CC2200'
  ctx.beginPath()
  ctx.roundRect(cockpitX + cockpitW * 0.18, hullTopY + h * 0.03, cockpitW * 0.28, h * 0.08, 3)
  ctx.fill()
  ctx.fillStyle = '#AA1A00'
  ctx.fillRect(cockpitX + cockpitW * 0.18, hullTopY + h * 0.03, cockpitW * 0.28, h * 0.02)

  // Navigation light (red front, green rear)
  ctx.fillStyle = '#FF3300'
  ctx.beginPath(); ctx.arc(x + w * 0.93, hullMidY - h * 0.04, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#00CC44'
  ctx.beginPath(); ctx.arc(x + w * 0.06, hullMidY - h * 0.04, 4, 0, Math.PI * 2); ctx.fill()

  // Stripe along waterline
  ctx.fillStyle = '#FF3D00'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.04, hullMidY + h * 0.02)
  ctx.lineTo(x + w * 0.92, hullMidY + h * 0.02)
  ctx.lineTo(x + w * 0.98, hullMidY + h * 0.02 - h * 0.03)
  ctx.lineTo(x + w * 0.04, hullMidY + h * 0.02)
  ctx.closePath()
  ctx.fill()
}

function drawMonsterTruck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const groundY = y + h
  const wheelR = h * 0.3   // huge wheels
  const axleY = groundY - wheelR
  const bodyY = axleY - wheelR * 0.6 - h * 0.34
  const bodyH = h * 0.34
  const cabinY = bodyY - h * 0.22
  const cabinH = h * 0.22

  // Suspension rods (connecting body to axle area, behind wheels)
  const frontWX = x + w * 0.22
  const rearWX = x + w * 0.78
  ctx.strokeStyle = '#555'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(frontWX, axleY - wheelR * 0.1); ctx.lineTo(frontWX + w * 0.04, bodyY + bodyH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(frontWX, axleY - wheelR * 0.1); ctx.lineTo(frontWX - w * 0.02, bodyY + bodyH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(rearWX, axleY - wheelR * 0.1); ctx.lineTo(rearWX + w * 0.02, bodyY + bodyH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(rearWX, axleY - wheelR * 0.1); ctx.lineTo(rearWX - w * 0.04, bodyY + bodyH); ctx.stroke()
  // Spring coils
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2
  for (let coil = 0; coil < 4; coil++) {
    const cy = bodyY + bodyH * 0.3 + coil * (bodyH * 0.18)
    ctx.beginPath(); ctx.moveTo(frontWX - 5, cy); ctx.lineTo(frontWX + 5, cy + 4); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(rearWX - 5, cy); ctx.lineTo(rearWX + 5, cy + 4); ctx.stroke()
  }

  // Main body (orange, elevated, boxy)
  ctx.fillStyle = '#FF6600'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.08, bodyY, w * 0.84, bodyH, 5)
  ctx.fill()
  // Body highlight
  ctx.fillStyle = '#FF8833'
  ctx.fillRect(x + w * 0.08, bodyY + 3, w * 0.84, 7)
  // Body shadow line
  ctx.fillStyle = '#CC4400'
  ctx.fillRect(x + w * 0.08, bodyY + bodyH * 0.82, w * 0.84, bodyH * 0.12)

  // Body side panel details
  ctx.strokeStyle = '#CC4400'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x + w * 0.32, bodyY + bodyH * 0.2); ctx.lineTo(x + w * 0.32, bodyY + bodyH * 0.8); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w * 0.68, bodyY + bodyH * 0.2); ctx.lineTo(x + w * 0.68, bodyY + bodyH * 0.8); ctx.stroke()

  // Cabin (orange, wide)
  ctx.fillStyle = '#FF6600'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.18, cabinY, w * 0.64, cabinH, [10, 10, 0, 0])
  ctx.fill()

  // Dark tinted window (wide)
  ctx.fillStyle = '#111A22'
  ctx.globalAlpha = 0.88
  ctx.beginPath()
  ctx.roundRect(x + w * 0.2, cabinY + cabinH * 0.1, w * 0.6, cabinH * 0.76, [7, 7, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1
  // Window glare
  ctx.fillStyle = 'rgba(150,200,255,0.18)'
  ctx.beginPath()
  ctx.roundRect(x + w * 0.22, cabinY + cabinH * 0.14, w * 0.18, cabinH * 0.35, 4)
  ctx.fill()

  // Headlights (dual)
  ctx.fillStyle = '#FFFF99'
  ctx.fillRect(x + w * 0.08, bodyY + bodyH * 0.18, w * 0.06, bodyH * 0.2)
  ctx.fillRect(x + w * 0.86, bodyY + bodyH * 0.18, w * 0.06, bodyH * 0.2)
  // Bull bar
  ctx.fillStyle = '#333'
  ctx.fillRect(x + w * 0.08, bodyY + bodyH * 0.55, w * 0.07, bodyH * 0.35)
  ctx.fillRect(x + w * 0.08, bodyY + bodyH * 0.55, w * 0.03, bodyH * 0.15)

  // Huge wheels with tread spikes
  for (const wx of [frontWX, rearWX]) {
    // Mud flap
    ctx.fillStyle = '#222'
    ctx.fillRect(wx - wheelR * 1.1, axleY - wheelR * 1.2, wheelR * 0.25, wheelR * 1.4)

    // Tire
    ctx.fillStyle = '#111'
    ctx.beginPath(); ctx.arc(wx, axleY, wheelR, 0, Math.PI * 2); ctx.fill()

    // Tread spikes (5 around circumference)
    ctx.fillStyle = '#2A2A2A'
    for (let t = 0; t < 10; t++) {
      const ta = (t / 10) * Math.PI * 2
      const tx1 = wx + Math.cos(ta) * wheelR * 0.85
      const ty1 = axleY + Math.sin(ta) * wheelR * 0.85
      const tx2 = wx + Math.cos(ta) * wheelR * 1.0
      const ty2 = axleY + Math.sin(ta) * wheelR * 1.0
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.moveTo(tx1 - Math.sin(ta) * 4, ty1 + Math.cos(ta) * 4)
      ctx.lineTo(tx2 - Math.sin(ta) * 3, ty2 + Math.cos(ta) * 3)
      ctx.lineTo(tx2 + Math.sin(ta) * 3, ty2 - Math.cos(ta) * 3)
      ctx.lineTo(tx1 + Math.sin(ta) * 4, ty1 - Math.cos(ta) * 4)
      ctx.closePath()
      ctx.fill()
    }

    // Orange rim
    ctx.fillStyle = '#FF6600'
    ctx.beginPath(); ctx.arc(wx, axleY, wheelR * 0.52, 0, Math.PI * 2); ctx.fill()
    // Rim spokes
    ctx.strokeStyle = '#CC4400'; ctx.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(wx, axleY)
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.48, axleY + Math.sin(a) * wheelR * 0.48)
      ctx.stroke()
    }
    // Center cap
    ctx.fillStyle = '#FF3D00'
    ctx.beginPath(); ctx.arc(wx, axleY, wheelR * 0.14, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath(); ctx.arc(wx, axleY, wheelR * 0.06, 0, Math.PI * 2); ctx.fill()
  }
}

// ── Vehicles config ───────────────────────────────────────────────────────────

interface VehicleConfig {
  name: string
  emoji: string
  isCell: (gx: number, gy: number) => boolean
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void
}

const VEHICLES: VehicleConfig[] = [
  { name: 'Lambo',         emoji: '🏎️',  isCell: isLamboCell,   draw: drawLambo },
  { name: 'Stretch Limo',  emoji: '🚗',  isCell: isLimoCell,    draw: drawLimo },
  { name: 'Pickup Truck',  emoji: '🛻',  isCell: isPickupCell,  draw: drawPickupTruck },
  { name: 'Tank',          emoji: '🪖',  isCell: isTankCell,    draw: drawTank },
  { name: 'Speedboat',     emoji: '🚤',  isCell: isBoatCell,    draw: drawSpeedboat },
  { name: 'Monster Truck', emoji: '🚛',  isCell: isMonsterCell, draw: drawMonsterTruck },
]

interface LevelConfig {
  vehicleIdx: number
  time: number  // seconds
}

const LEVELS: LevelConfig[] = [
  { vehicleIdx: 0, time: 45 }, // Level 1:  Lambo
  { vehicleIdx: 1, time: 42 }, // Level 2:  Stretch Limo
  { vehicleIdx: 2, time: 40 }, // Level 3:  Pickup Truck
  { vehicleIdx: 3, time: 38 }, // Level 4:  Tank
  { vehicleIdx: 4, time: 36 }, // Level 5:  Speedboat
  { vehicleIdx: 5, time: 34 }, // Level 6:  Monster Truck
  { vehicleIdx: 0, time: 30 }, // Level 7:  Lambo (tighter)
  { vehicleIdx: 1, time: 28 }, // Level 8:  Limo (tighter)
  { vehicleIdx: 2, time: 25 }, // Level 9:  Pickup Truck (tighter)
  { vehicleIdx: 3, time: 22 }, // Level 10: Tank (tighter)
]

const TOTAL_LEVELS = 10

// ── Component ─────────────────────────────────────────────────────────────────

export default function CarWash({ gameId, gameSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'LEVEL_COMPLETE' | 'SCORE_SCREEN'>('TITLE')
  const [pct, setPct] = useState(0)
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].time)
  const [level, setLevel] = useState(1)
  const [showLevelComplete, setShowLevelComplete] = useState(false)
  const [levelCompleteSpotless, setLevelCompleteSpotless] = useState(false)
  const [levelPtsEarned, setLevelPtsEarned] = useState(0)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [personalBest, setPersonalBest] = useState(0)

  const stateRef = useRef<'TITLE' | 'PLAYING' | 'LEVEL_COMPLETE' | 'SCORE_SCREEN'>('TITLE')
  const dirtyRef = useRef<boolean[][]>([])
  const dropRef = useRef<Droplet[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const timerRef = useRef(LEVELS[0].time * 1000)
  const cleanCountRef = useRef(0)
  const totalCellsRef = useRef(1)
  const carBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const sdkRef = useRef<GameSDK | null>(null)
  const levelRef = useRef(1)
  const totalScoreRef = useRef(0)
  const completeLevelCalledRef = useRef(false)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'car-wash', gameSlug: 'car-wash' })
    const pb = parseInt(localStorage.getItem('sg_pb_car-wash') ?? '0', 10)
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
      carBoundsRef.current = { x: w * 0.06, y: h * 0.28, w: w * 0.88, h: h * 0.48 }
    }
    const ro = new ResizeObserver(doResize)
    ro.observe(parent); doResize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const updateMouse = (cx: number, cy: number, active: boolean) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (cx - rect.left) * (canvas.width / rect.width),
        y: (cy - rect.top) * (canvas.height / rect.height),
        active,
      }
    }
    const onMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY, true)
    const onLeave = () => { mouseRef.current.active = false }
    const onTouch = (e: TouchEvent) => updateMouse(e.touches[0].clientX, e.touches[0].clientY, true)
    const onTouchEnd = () => { mouseRef.current.active = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const startGame = useCallback((lvl?: number) => {
    const currentLevel = lvl ?? levelRef.current
    levelRef.current = currentLevel
    setLevel(currentLevel)

    const levelCfg = LEVELS[currentLevel - 1]
    const vehicle = VEHICLES[levelCfg.vehicleIdx]

    const grid: boolean[][] = []
    let total = 0
    for (let gy = 0; gy < GH; gy++) {
      grid[gy] = []
      for (let gx = 0; gx < GW; gx++) {
        const inVehicle = vehicle.isCell(gx, gy)
        grid[gy][gx] = inVehicle
        if (inVehicle) total++
      }
    }
    dirtyRef.current = grid
    totalCellsRef.current = total
    cleanCountRef.current = 0
    dropRef.current = []
    timerRef.current = levelCfg.time * 1000
    completeLevelCalledRef.current = false
    setTimeLeft(levelCfg.time)
    setPct(0)
    setShowLevelComplete(false)
    stateRef.current = 'PLAYING'
    setGameState('PLAYING')

    if (currentLevel === 1) {
      sdkRef.current?.onStart()
    }
  }, [])

  const completeLevel = useCallback((finalPct: number) => {
    if (completeLevelCalledRef.current) return
    completeLevelCalledRef.current = true

    const pts = Math.round(finalPct * 10)
    totalScoreRef.current += pts
    const isSpotless = finalPct >= 100

    setLevelCompleteSpotless(isSpotless)
    setLevelPtsEarned(pts)
    setShowLevelComplete(true)
    stateRef.current = 'LEVEL_COMPLETE'
    setGameState('LEVEL_COMPLETE')

    const currentLevel = levelRef.current
    setLevelsCompleted(currentLevel)

    setTimeout(() => {
      if (currentLevel >= TOTAL_LEVELS) {
        // Final score screen
        const totalScore = totalScoreRef.current
        sdkRef.current?.onGameOver(totalScore)
        const pb = parseInt(localStorage.getItem('sg_pb_car-wash') ?? '0', 10)
        if (totalScore > pb) {
          localStorage.setItem('sg_pb_car-wash', String(totalScore))
          setPersonalBest(totalScore)
        }
        setShowLevelComplete(false)
        stateRef.current = 'SCORE_SCREEN'
        setGameState('SCORE_SCREEN')
      } else {
        // Advance to next level
        levelRef.current = currentLevel + 1
        startGame(currentLevel + 1)
      }
    }, 2500)
  }, [startGame])

  const gameLoop = useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas || stateRef.current !== 'PLAYING') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const cb = carBoundsRef.current
    const cellW = cb.w / GW, cellH = cb.h / GH

    timerRef.current -= dt
    const secLeft = Math.max(0, Math.ceil(timerRef.current / 1000))
    setTimeLeft(secLeft)

    const pctNow = Math.round(cleanCountRef.current / totalCellsRef.current * 100)

    if (pctNow >= 100 && !completeLevelCalledRef.current) {
      completeLevel(100)
      return
    }
    if (timerRef.current <= 0 && !completeLevelCalledRef.current) {
      completeLevel(pctNow)
      return
    }

    // Washing
    const mouse = mouseRef.current
    if (mouse.active) {
      const gx = (mouse.x - cb.x) / cellW
      const gy = (mouse.y - cb.y) / cellH
      const dirty = dirtyRef.current
      let cleaned = 0
      for (let dy = -Math.ceil(WR); dy <= Math.ceil(WR); dy++) {
        for (let dx = -Math.ceil(WR); dx <= Math.ceil(WR); dx++) {
          if (Math.sqrt(dx * dx + dy * dy) > WR) continue
          const cx2 = Math.round(gx + dx), cy2 = Math.round(gy + dy)
          if (cy2 >= 0 && cy2 < GH && cx2 >= 0 && cx2 < GW && dirty[cy2]?.[cx2]) {
            dirty[cy2][cx2] = false; cleaned++
          }
        }
      }
      cleanCountRef.current += cleaned
      // Spray particles
      const inCar = mouse.x >= cb.x - 20 && mouse.x <= cb.x + cb.w + 20 && mouse.y >= cb.y && mouse.y <= cb.y + cb.h
      if (inCar) {
        for (let i = 0; i < 5; i++) {
          dropRef.current.push({
            x: mouse.x + (Math.random() - 0.5) * 12,
            y: mouse.y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 0.5,
            life: 0.5 + Math.random() * 0.5,
          })
        }
      }
    }

    for (const d of dropRef.current) { d.x += d.vx; d.y += d.vy; d.vy += 0.12; d.life -= 0.05 }
    dropRef.current = dropRef.current.filter(d => d.life > 0)
    if (dropRef.current.length > 200) dropRef.current = dropRef.current.slice(-200)

    setPct(pctNow)

    const currentLevel = levelRef.current
    const levelCfg = LEVELS[currentLevel - 1]
    const vehicle = VEHICLES[levelCfg.vehicleIdx]
    const levelTime = levelCfg.time

    // ── Draw ────────────────────────────────────────────────────────────────
    // Background: car wash bay
    const bgGrd = ctx.createLinearGradient(0, 0, 0, height)
    bgGrd.addColorStop(0, '#050F18'); bgGrd.addColorStop(1, '#0A1E2E')
    ctx.fillStyle = bgGrd
    ctx.fillRect(0, 0, width, height)

    // Ceiling light strips
    ctx.fillStyle = '#0A2A4A'
    for (let lx = 0; lx < width; lx += 70) ctx.fillRect(lx, 0, 38, height * 0.12)
    ctx.fillStyle = 'rgba(100,200,255,0.15)'
    for (let lx = 10; lx < width; lx += 70) ctx.fillRect(lx, 0, 20, 3)

    // Water curtain lines (atmosphere)
    ctx.strokeStyle = 'rgba(100,180,255,0.06)'; ctx.lineWidth = 1
    for (let wx = 0; wx < width; wx += 14) {
      ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx + 5, height); ctx.stroke()
    }

    // Floor
    const floorGrd = ctx.createLinearGradient(0, height * 0.78, 0, height)
    floorGrd.addColorStop(0, '#0A1A28'); floorGrd.addColorStop(1, '#060E18')
    ctx.fillStyle = floorGrd
    ctx.fillRect(0, height * 0.78, width, height * 0.22)
    // Floor puddle reflections
    ctx.fillStyle = 'rgba(50,150,220,0.12)'
    ctx.fillRect(width * 0.2, height * 0.82, width * 0.6, height * 0.04)
    ctx.fillRect(width * 0.35, height * 0.87, width * 0.3, height * 0.02)
    // Floor tiles
    ctx.strokeStyle = 'rgba(0,100,200,0.15)'; ctx.lineWidth = 1
    for (let xi = 0; xi < width; xi += 50) {
      ctx.beginPath(); ctx.moveTo(xi, height * 0.78); ctx.lineTo(xi, height); ctx.stroke()
    }

    // Draw vehicle
    vehicle.draw(ctx, cb.x, cb.y, cb.w, cb.h)

    // Dirt layer over vehicle
    const dirty = dirtyRef.current
    for (let gy2 = 0; gy2 < GH; gy2++) {
      for (let gx2 = 0; gx2 < GW; gx2++) {
        if (dirty[gy2]?.[gx2]) {
          const seed = gx2 * 7 + gy2 * 13
          const a = 0.5 + ((seed % 20) / 20) * 0.35
          const r = 80 + (seed % 20), g2 = 60 + (seed % 15), b = 30 + (seed % 10)
          ctx.fillStyle = `rgba(${r},${g2},${b},${a})`
          const sx = cb.x + gx2 * cellW, sy = cb.y + gy2 * cellH
          if (seed % 3 === 0) {
            ctx.beginPath()
            ctx.arc(sx + cellW / 2, sy + cellH / 2, (cellW + cellH) / 2 * 0.7, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(sx + 1, sy + 1, cellW - 1, cellH - 1)
          }
        }
      }
    }

    // Spray cursor ring
    if (mouse.active) {
      const inCar = mouse.x >= cb.x - 30 && mouse.x <= cb.x + cb.w + 30 && mouse.y >= cb.y - 20 && mouse.y <= cb.y + cb.h + 20
      if (inCar) {
        ctx.save()
        ctx.shadowBlur = 14; ctx.shadowColor = '#40AAFF'
        ctx.strokeStyle = 'rgba(100,200,255,0.85)'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, WR * (cellW + cellH) / 2, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      }
    }

    // Water droplets
    for (const d of dropRef.current) {
      ctx.globalAlpha = d.life * 0.8
      ctx.fillStyle = '#88DDFF'
      ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1

    // ── HUD ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, width, 44)
    ctx.strokeStyle = 'rgba(0,180,255,0.6)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(width, 44); ctx.stroke()

    // Left: Level + vehicle emoji + timer
    ctx.fillStyle = '#AAAAAA'
    ctx.font = `bold 16px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(`LVL ${currentLevel}/${TOTAL_LEVELS}  ${vehicle.emoji}`, 12, 22)

    // Center: timer
    ctx.fillStyle = secLeft <= 10 ? '#FF3D00' : '#FFFFFF'
    ctx.font = `bold 22px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`⏱  ${secLeft}s`, width / 2, 22)

    // Right: clean pct
    ctx.fillStyle = '#00D4FF'
    ctx.font = `bold 22px "Bebas Neue", var(--font-display), sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(`${pctNow}% CLEAN`, width - 12, 22)

    // Clean progress bar
    ctx.fillStyle = 'rgba(0,100,150,0.3)'; ctx.fillRect(12, 37, width - 24, 5)
    const barColor = pctNow >= 80 ? '#00FF88' : pctNow >= 50 ? '#00D4FF' : '#0080AA'
    ctx.fillStyle = barColor; ctx.fillRect(12, 37, (width - 24) * (pctNow / 100), 5)

    // Move hint (only first 5s of each level)
    if (timerRef.current > (levelTime - 5) * 1000) {
      ctx.fillStyle = 'rgba(0,180,255,0.7)'
      ctx.font = `16px "Bebas Neue", var(--font-display), sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('MOVE CURSOR OVER THE VEHICLE TO WASH', width / 2, height * 0.88)
    }
  }, [completeLevel])

  useGameLoop(gameLoop, gameState === 'PLAYING')

  const totalScore = totalScoreRef.current
  const currentLevelCfg = LEVELS[Math.min(level - 1, TOTAL_LEVELS - 1)]
  const currentVehicle = VEHICLES[currentLevelCfg.vehicleIdx]

  // Next vehicle info for level complete overlay
  const nextLevel = level + 1
  const nextVehicle = nextLevel <= TOTAL_LEVELS ? VEHICLES[LEVELS[nextLevel - 1].vehicleIdx] : null

  return (
    <div className="absolute inset-0 bg-[#050F18]" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" style={{ cursor: 'crosshair', touchAction: 'none' }} />

      {/* TITLE SCREEN */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'linear-gradient(to bottom, #050F18, #0A1E2E)' }}>
          <div className="text-6xl mb-3">{currentVehicle.emoji}</div>
          <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            CAR WASH
          </h1>
          <p className="text-sm mb-1" style={{ color: '#00D4FF', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            LEVELS: 10 VEHICLES · CLEAN THEM ALL
          </p>
          <p className="text-xs mb-1" style={{ color: '#AAAAAA', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            Level 1/10 · {currentVehicle.emoji} {currentVehicle.name} · {LEVELS[0].time}s
          </p>
          <p className="text-[#444] text-xs mb-8">Move your cursor/finger over the vehicle · earn points for each level</p>
          {personalBest > 0 && (
            <p className="text-sm mb-6" style={{ color: '#00D4FF', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              BEST: {personalBest} PTS
            </p>
          )}
          <button onClick={() => startGame(1)}
            className="px-10 py-4 rounded-xl text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(0,180,255,0.5)]"
            style={{ background: '#00D4FF', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', color: '#000' }}>
            WASH IT!
          </button>
        </div>
      )}

      {/* LEVEL COMPLETE OVERLAY */}
      {(gameState === 'LEVEL_COMPLETE') && showLevelComplete && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(5,15,24,0.92)' }}>
          <div className="text-5xl mb-3">
            {levelCompleteSpotless ? '✨' : '⏱'}
          </div>
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            LEVEL COMPLETE
          </h2>
          <p className="text-2xl mb-2" style={{ color: levelCompleteSpotless ? '#00FF88' : '#00D4FF', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            {levelCompleteSpotless ? '✨ SPOTLESS!' : '⏱ TIME\'S UP!'}
          </p>
          <p className="text-lg mb-1" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            +{levelPtsEarned} PTS
          </p>
          <p className="text-sm mb-4" style={{ color: '#AAAAAA', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            TOTAL: {totalScoreRef.current} PTS
          </p>
          {nextVehicle && level < TOTAL_LEVELS && (
            <p className="text-base mt-2" style={{ color: '#888888', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              NEXT: {nextVehicle.emoji} {nextVehicle.name.toUpperCase()}
            </p>
          )}
          {level >= TOTAL_LEVELS && (
            <p className="text-base mt-2" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              ALL LEVELS COMPLETE!
            </p>
          )}
        </div>
      )}

      {/* SCORE SCREEN */}
      {gameState === 'SCORE_SCREEN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 select-none"
          style={{ background: 'rgba(5,15,24,0.96)' }}>
          <div className="text-5xl mb-3">
            {totalScoreRef.current >= 8000 ? '🏆' : totalScoreRef.current >= 5000 ? '✨' : '💧'}
          </div>
          {totalScoreRef.current > personalBest - levelPtsEarned && (
            <div className="text-sm mb-2 animate-bounce" style={{ color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
              ✨ NEW BEST! ✨
            </div>
          )}
          <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            WASH COMPLETE!
          </h2>
          <p className="text-5xl mb-1" style={{ color: '#00D4FF', fontFamily: 'var(--font-display)' }}>
            {totalScoreRef.current}
          </p>
          <p className="text-sm mb-1" style={{ color: '#AAAAAA', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            POINTS
          </p>
          <p className="text-sm mb-6" style={{ color: '#666', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            {levelsCompleted}/{TOTAL_LEVELS} LEVELS · MAX {TOTAL_LEVELS * 1000} PTS
          </p>
          <div className="flex gap-3">
            <button onClick={() => {
              totalScoreRef.current = 0
              levelRef.current = 1
              setLevel(1)
              setLevelsCompleted(0)
              startGame(1)
            }}
              className="px-6 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: '#00D4FF', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', color: '#000' }}>
              PLAY AGAIN
            </button>
            <button onClick={() => sdkRef.current?.showLeaderboard()}
              className="px-6 py-3 border border-[#1E1E1E] hover:border-[#00D4FF] text-[#555] hover:text-white rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              LEADERBOARD
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
