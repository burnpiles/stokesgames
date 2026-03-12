import Link from 'next/link'
import { Gamepad2, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[var(--accent-primary)] rounded flex items-center justify-center">
                <Gamepad2 size={15} className="text-white" />
              </div>
              <span
                className="text-xl text-white"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
              >
                STOKEGAMES
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              The official game hub of Alex &amp; Alan Stokes. Play. Compete. Win.
            </p>
            <div className="flex gap-3 mt-4">
              <SocialLink href="https://www.youtube.com/c/StokesTwins" label="YouTube">
                <Youtube size={16} />
              </SocialLink>
            </div>
          </div>

          {/* Play */}
          <div>
            <h4
              className="text-white mb-3 tracking-widest text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              PLAY
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] text-sm">
              <li><Link href="/games" className="hover:text-white transition-colors">All Games</Link></li>
              <li><Link href="/games?badge=TWIN_PICK" className="hover:text-white transition-colors">Twin Picks</Link></li>
              <li><Link href="/games?badge=NEW" className="hover:text-white transition-colors">New Games</Link></li>
              <li><Link href="/challenge" className="hover:text-white transition-colors">Twin Challenge</Link></li>
            </ul>
          </div>

          {/* Compete */}
          <div>
            <h4
              className="text-white mb-3 tracking-widest text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              COMPETE
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] text-sm">
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">Global Leaderboard</Link></li>
              <li><Link href="/leaderboard?tab=weekly" className="hover:text-white transition-colors">Weekly Rankings</Link></li>
              <li><Link href="/profile/me" className="hover:text-white transition-colors">My Profile</Link></li>
              <li><Link href="/claim" className="hover:text-white transition-colors">Claim Score</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-white mb-3 tracking-widest text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              STOKES
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] text-sm">
              <li><a href="https://www.youtube.com/c/StokesTwins" className="hover:text-white transition-colors">YouTube Channel</a></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-muted)] text-xs">
            © {new Date().getFullYear()} StokeGames. All rights reserved.
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            Built for the fans. Run by the twins.
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--accent-primary)] transition-all"
    >
      {children}
    </a>
  )
}
