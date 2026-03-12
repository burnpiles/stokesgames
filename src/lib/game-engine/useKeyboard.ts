import { useEffect, useRef } from 'react'

/** Returns a ref to a live map of currently pressed keys */
export function useKeyboard(): React.MutableRefObject<Set<string>> {
  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.code)
    const up   = (e: KeyboardEvent) => keys.current.delete(e.code)

    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup',   up)
    }
  }, [])

  return keys
}
