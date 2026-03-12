import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your StokeGames account and start competing.',
}

const CLERK_READY =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20

export default function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {CLERK_READY ? (
        <ClerkSignUp />
      ) : (
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎮</span>
          </div>
          <h1
            className="text-3xl text-white mb-3"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            SIGN UP
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Auth is not configured yet. Add your Clerk keys to <code className="text-[var(--accent-primary)]">.env.local</code> to enable sign-up.
          </p>
          <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-left space-y-1">
            <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...</p>
            <p>CLERK_SECRET_KEY=sk_live_...</p>
          </div>
        </div>
      )}
    </div>
  )
}

async function ClerkSignUp() {
  const { SignUp } = await import('@clerk/nextjs')
  return (
    <SignUp
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
