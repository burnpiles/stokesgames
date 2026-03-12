import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to StokeGames to track scores and compete.',
}

const CLERK_READY =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {CLERK_READY ? (
        <ClerkSignIn />
      ) : (
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎮</span>
          </div>
          <h1
            className="text-3xl text-white mb-3"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            SIGN IN
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">
            If this platform launches, this is where players would sign in to track scores, claim their rank, and compete on the leaderboard.
          </p>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-sm text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>TRACK SCORES</p>
                <p className="text-[var(--text-muted)] text-xs">Save your personal bests and climb the global leaderboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>CHALLENGE MODE</p>
                <p className="text-[var(--text-muted)] text-xs">Compete head-to-head in weekly Twin Challenges.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🎖️</span>
              <div>
                <p className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>EARN RANK</p>
                <p className="text-[var(--text-muted)] text-xs">Rise from Rookie to Stokemaster and unlock prizes.</p>
              </div>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-xs">
            This is a prototype — authentication will be enabled when the platform goes live.
          </p>
        </div>
      )}
    </div>
  )
}

async function ClerkSignIn() {
  const { SignIn } = await import('@clerk/nextjs')
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: '#FF3D00',
          colorBackground: '#0A0A0A',
          colorInputBackground: '#111111',
          colorInputText: '#FFFFFF',
          colorText: '#FFFFFF',
          colorTextSecondary: '#999999',
          borderRadius: '0.5rem',
        },
        elements: {
          card: 'bg-[#111111] border border-[#1E1E1E] shadow-none',
          headerTitle: 'font-display tracking-wider text-white',
          formButtonPrimary: 'bg-[#FF3D00] hover:bg-[#CC3100]',
          footerActionLink: 'text-[#FF3D00]',
        },
      }}
    />
  )
}
