import type { Viewport } from 'next'

// Disable pinch-zoom and double-tap zoom so game taps don't accidentally resize
export const viewport: Viewport = {
  themeColor: '#FF3D00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
