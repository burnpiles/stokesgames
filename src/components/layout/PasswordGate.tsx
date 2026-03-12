'use client'

import { useState, useEffect } from 'react'
import { Gamepad2 } from 'lucide-react'

const SESSION_KEY = 'sg_unlocked'
const PASSWORD = 'stokes'

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === '1'
    setUnlocked(ok)
  }, [])

  const submit = () => {
    if (input.trim().toLowerCase() === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setUnlocked(true)
    } else {
      setError(true)
      setShaking(true)
      setInput('')
      setTimeout(() => setShaking(false), 500)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }

  // Still loading from sessionStorage
  if (unlocked === null) return null

  if (unlocked) return <>{children}</>

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg-primary)]"
      style={{ background: '#0A0A0A' }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,61,0,0.4)]">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <span
            className="text-2xl text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            STOKEGAMES
          </span>
        </div>

        {/* Hero GIF */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-banner.gif"
          alt="StokeGames"
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: '220px', objectPosition: 'center top' }}
        />

        {/* Heading */}
        <div className="text-center">
          <h1
            className="text-3xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            ENTER PASSWORD
          </h1>
          <p className="text-[var(--text-muted)] text-sm">This site is password protected.</p>
        </div>

        {/* Input */}
        <div className={`w-full ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            autoFocus
            placeholder="Password"
            className={`w-full px-4 py-3.5 rounded-xl text-white text-center text-lg tracking-widest outline-none transition-all ${
              error
                ? 'border-2 border-[var(--accent-primary)] bg-[rgba(255,61,0,0.08)]'
                : 'border border-[var(--border)] bg-[var(--bg-card)] focus:border-[var(--accent-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}
          />
          {error && (
            <p className="text-[var(--accent-primary)] text-xs text-center mt-2 tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}>
              WRONG PASSWORD
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          className="w-full py-4 rounded-xl text-white text-lg transition-all active:scale-95 shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_30px_var(--accent-glow-strong)]"
          style={{
            background: 'var(--accent-primary)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.1em',
          }}
        >
          UNLOCK
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
