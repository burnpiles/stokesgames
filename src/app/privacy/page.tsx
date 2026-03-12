import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'StokeGames privacy policy.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <h1 className="text-4xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          PRIVACY POLICY
        </h1>
      </div>

      <p className="text-[var(--text-muted)] text-xs mb-8">
        Last updated: March 2025 · This is a prototype — no real user data is collected.
      </p>

      <div className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>INFORMATION WE COLLECT</h2>
          <p>If launched, StokeGames would collect basic account information (username, email) when you sign up, as well as gameplay data such as scores, ranks, and session activity. No sensitive personal or financial data is collected through gameplay.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>HOW WE USE YOUR DATA</h2>
          <p>Data would be used to power leaderboards, assign rank tiers, enable Twin Challenges, and improve game experiences. We would not sell your data or share it with third parties for advertising purposes.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>COOKIES & STORAGE</h2>
          <p>StokeGames uses browser local storage to save your personal best scores between sessions. If authentication is enabled, session cookies are used for login state only.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>THIRD-PARTY SERVICES</h2>
          <p>A live version of StokeGames may use third-party services for authentication (Clerk), database hosting (Supabase), and analytics. Each service operates under its own privacy policy.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>CONTACT</h2>
          <p>Questions about privacy? Reach out through the official Stokes social channels. A formal contact email will be provided when the platform launches.</p>
        </div>

        <p className="text-[var(--text-muted)] text-xs">
          This is a prototype. All game data, scores, and leaderboard entries are simulated and do not represent real user data. This privacy policy is a template and is not legally binding in its current form.
        </p>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/terms"
          className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          TERMS OF USE
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          HOME
        </Link>
      </div>
    </div>
  )
}
