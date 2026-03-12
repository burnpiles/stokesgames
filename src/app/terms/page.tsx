import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'StokeGames terms of use.',
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <h1 className="text-4xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          TERMS OF USE
        </h1>
      </div>

      <p className="text-[var(--text-muted)] text-xs mb-8">
        Last updated: March 2025 · This is a prototype — these terms are a template only.
      </p>

      <div className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>ACCEPTANCE OF TERMS</h2>
          <p>By accessing or using StokeGames, you agree to be bound by these Terms of Use. If you do not agree, please do not use this platform. StokeGames is intended for users aged 13 and older.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>USE OF THE PLATFORM</h2>
          <p>StokeGames is provided for entertainment purposes. You agree not to cheat, exploit game mechanics, manipulate leaderboards, or interfere with other players&apos; experiences. Accounts found in violation may be suspended or permanently banned.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SCORES & PRIZES</h2>
          <p>Scores are verified cryptographically before being posted to leaderboards. Prize eligibility requires a verified score claim. StokeGames reserves the right to void scores or prizes where fraud or manipulation is suspected.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>INTELLECTUAL PROPERTY</h2>
          <p>All game content, branding, likenesses of Alex and Alan Stokes, and platform design are the property of their respective owners. You may not reproduce, distribute, or commercially exploit any content from StokeGames without written permission.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>DISCLAIMER</h2>
          <p>StokeGames is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to data loss, service interruptions, or prize disputes.</p>
        </div>

        <p className="text-[var(--text-muted)] text-xs">
          This is a prototype. These terms of use are a template and are not legally binding in their current form. Final terms will be drafted by legal counsel prior to any official launch.
        </p>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/privacy"
          className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
        >
          PRIVACY POLICY
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
