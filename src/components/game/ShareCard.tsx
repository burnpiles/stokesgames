'use client'

import { useRef, useState, useCallback } from 'react'
import { Download, X, Share2 } from 'lucide-react'
import { formatScore, scoreMedal, rankLabel } from '@/lib/utils'
import type { Game } from '@/types'

interface ShareCardProps {
  game: Game
  score: number
  rank?: number
  username?: string
  rankTier?: string
  onClose?: () => void
}

/**
 * Post-game shareable score card.
 * Renders a 9:16 card that can be downloaded as PNG via html2canvas.
 */
export function ShareCard({ game, score, rank, username, rankTier, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const medal = scoreMedal(score)

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0A',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `stokesgames-${game.slug}-${score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('ShareCard export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [game.slug, score])

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  const nativeShare = useCallback(async () => {
    if (!cardRef.current || !canShare) return
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0A',
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `stokesgames-${game.slug}-${score}.png`, { type: 'image/png' })
        await navigator.share({
          title: `I scored ${formatScore(score)} on ${game.title}!`,
          text: `Can you beat my score on StokeGames? 🎮`,
          files: [file],
        })
      }, 'image/png')
    } catch (err) {
      // User cancelled or share failed
    } finally {
      setExporting(false)
    }
  }, [canShare, game.slug, game.title, score])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-xs w-full">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* The card — this is what gets captured */}
        <div
          ref={cardRef}
          className="relative w-full overflow-hidden rounded-2xl"
          style={{
            aspectRatio: '9/16',
            background: 'linear-gradient(160deg, #111111 0%, #0A0A0A 100%)',
            border: '1px solid #1E1E1E',
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, rgba(255,61,0,0.15) 0%, transparent 60%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-8 py-10">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-auto">
              <div className="w-6 h-6 bg-[#FF3D00] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">SG</span>
              </div>
              <span
                className="text-white text-sm"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}
              >
                STOKESGAMES
              </span>
            </div>

            {/* Medal */}
            <div className="text-center my-6">
              <div className="text-6xl mb-2">{medal.emoji}</div>
              <p
                className="text-xs tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif', color: medal.color }}
              >
                {medal.label}
              </p>
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <p
                className="text-[#999] text-xs tracking-widest mb-2"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                MY SCORE
              </p>
              <p
                className="text-white leading-none"
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 'clamp(3rem, 15vw, 5rem)',
                  letterSpacing: '0.04em',
                  color: medal.color,
                }}
              >
                {formatScore(score)}
              </p>
            </div>

            {/* Game title */}
            <div className="text-center mb-6">
              <p
                className="text-white text-lg"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.06em' }}
              >
                {game.title.toUpperCase()}
              </p>
              {rank && (
                <p className="text-[#999] text-xs mt-1">
                  #{rank} GLOBAL
                </p>
              )}
            </div>

            {/* Player info */}
            {username && (
              <div className="text-center mb-4">
                <p className="text-[#999] text-xs">{username}</p>
                {rankTier && (
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      color: rankTier === 'STOKEMASTER' ? '#FFD700' : rankTier === 'TWIN-LEVEL' ? '#A855F7' : '#FF3D00',
                    }}
                  >
                    {rankLabel(rankTier as any)}
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div
              className="text-center mt-auto pt-4 border-t"
              style={{ borderColor: '#1E1E1E' }}
            >
              <p
                className="text-[#666] text-xs tracking-wider"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                STOKESGAMES.COM
              </p>
              <p className="text-[#444] text-xs mt-0.5">CAN YOU BEAT ME?</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={downloadCard}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-white hover:border-[var(--accent-primary)] transition-all disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            <Download size={16} />
            {exporting ? 'SAVING...' : 'SAVE'}
          </button>
          {canShare && (
            <button
              onClick={nativeShare}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] rounded-xl text-sm text-white transition-all disabled:opacity-50"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
            >
              <Share2 size={16} />
              SHARE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
