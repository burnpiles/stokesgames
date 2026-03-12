import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PasswordGate } from '@/components/layout/PasswordGate'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'StokeGames — Play. Compete. Win.',
    template: '%s | StokeGames',
  },
  description:
    'The official game hub of Alex & Alan Stokes. Discover, play, and compete for real prizes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://stokesgames.com'),
  openGraph: {
    type: 'website',
    siteName: 'StokeGames',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@StokesTwins',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF3D00',
  width: 'device-width',
  initialScale: 1,
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

async function Providers({ children }: { children: React.ReactNode }) {
  // Only wrap with ClerkProvider when a real key is configured.
  // This lets the UI render in dev before Clerk is set up.
  if (clerkKey && !clerkKey.includes('placeholder')) {
    const { ClerkProvider } = await import('@clerk/nextjs')
    return <ClerkProvider>{children}</ClerkProvider>
  }
  return <>{children}</>
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Providers>
          <PasswordGate>
            <Toaster>
              <Nav />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </Toaster>
          </PasswordGate>
        </Providers>
      </body>
    </html>
  )
}
