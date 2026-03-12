import { useRef, useCallback, useEffect } from 'react'

/**
 * Minimal Web Audio API manager.
 * Generates procedural sounds — no assets required.
 */
export function useAudio() {
  const ctxRef  = useRef<AudioContext | null>(null)
  const mutedRef = useRef(false)

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playFlap = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx(); if (!ctx) return
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(); osc.stop(ctx.currentTime + 0.1)
  }, [getCtx])

  const playScore = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx(); if (!ctx) return
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(); osc.stop(ctx.currentTime + 0.15)
  }, [getCtx])

  const playDeath = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx(); if (!ctx) return

    // Low thud
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(); osc.stop(ctx.currentTime + 0.3)
  }, [getCtx])

  const playMedal = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx(); if (!ctx) return

    const notes = [523, 659, 784, 1047]  // C E G C
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'triangle'
      const t = ctx.currentTime + i * 0.12
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.start(t); osc.stop(t + 0.15)
    })
  }, [getCtx])

  const setMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted
  }, [])

  return { playFlap, playScore, playDeath, playMedal, setMuted, isMuted: () => mutedRef.current }
}
