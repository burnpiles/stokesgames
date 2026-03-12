import { useEffect, useRef } from 'react'

/**
 * requestAnimationFrame game loop with delta time (ms).
 * Calls callback on every frame when isRunning = true.
 */
export function useGameLoop(
  callback: (deltaMs: number) => void,
  isRunning: boolean
) {
  const cbRef  = useRef(callback)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  cbRef.current = callback

  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current)
      lastRef.current = 0
      return
    }

    const loop = (timestamp: number) => {
      const delta = lastRef.current ? timestamp - lastRef.current : 0
      lastRef.current = timestamp
      cbRef.current(Math.min(delta, 100))  // cap at 100ms to prevent spiral
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isRunning])
}
