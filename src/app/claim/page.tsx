'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Loader2, Gamepad2 } from 'lucide-react'
import { formatScore } from '@/lib/utils'
import type { ScoreToken } from '@/types'

function ClaimContent() {
  const params = useSearchParams()
  const token = params.get('token')

  const [state, setState] = useState<'verifying' | 'valid' | 'expired' | 'error' | 'claimed'>('verifying')
  const [tokenData, setTokenData] = useState<ScoreToken | null>(null)
  const [gameTitle, setGameTitle] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setState('error')
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/claim?token=${encodeURIComponent(token!)}`)
        const json = await res.json()
        if (!res.ok) {
          setState(json.error === 'TOKEN_EXPIRED' ? 'expired' : 'error')
          return
        }
        setTokenData(json.data.token)
        setGameTitle(json.data.gameTitle ?? json.data.token.gameSlug)
        setState('valid')
      } catch {
        setState('error')
      }
    }

    verify()
  }, [token])

  const handleClaim = async () => {
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) setState('claimed')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
              <Gamepad2 size={22} className="text-white" />
            </div>
          </div>
          <h1
            className="text-3xl text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            SCORE CLAIM
          </h1>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
          {state === 'verifying' && (
            <>
              <Loader2 size={40} className="mx-auto text-[var(--accent-primary)] animate-spin mb-4" />
              <p className="text-[var(--text-secondary)]">Verifying your score…</p>
            </>
          )}

          {state === 'valid' && tokenData && (
            <>
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-[var(--text-muted)] text-sm mb-1">Score detected</p>
              <p
                className="score-number text-6xl text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formatScore(tokenData.score)}
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                on <span className="text-white">{gameTitle}</span>
              </p>
              <button
                onClick={handleClaim}
                className="w-full py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-sm transition-all shadow-[0_0_20px_var(--accent-glow)]"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em', fontSize: '1rem' }}
              >
                CLAIM MY SCORE
              </button>
              <p className="text-[var(--text-muted)] text-xs mt-3">
                You&apos;ll need to sign in to claim
              </p>
            </>
          )}

          {state === 'claimed' && (
            <>
              <CheckCircle size={48} className="mx-auto text-[var(--success)] mb-4" />
              <p
                className="text-2xl text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                SCORE CLAIMED!
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                Your score has been submitted to the leaderboard.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/leaderboard"
                  className="flex-1 py-3 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-lg text-sm transition-all text-center"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/profile/me"
                  className="flex-1 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all text-center"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
                >
                  MY PROFILE
                </Link>
              </div>
            </>
          )}

          {state === 'expired' && (
            <>
              <AlertCircle size={48} className="mx-auto text-[var(--accent-primary)] mb-4" />
              <p className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                SCORE EXPIRED
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                This score token has expired (10 minute limit). Play again to get a fresh token.
              </p>
              <Link
                href="/games"
                className="block w-full py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all text-center"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
              >
                PLAY AGAIN
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <AlertCircle size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                INVALID TOKEN
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                This score link is invalid or has already been used.
              </p>
              <Link
                href="/games"
                className="block w-full py-3 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-lg text-sm transition-all text-center"
              >
                Back to Games
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--accent-primary)] animate-spin" />
      </div>
    }>
      <ClaimContent />
    </Suspense>
  )
}
