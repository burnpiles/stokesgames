import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Gamepad2, Trophy, Zap, Star } from 'lucide-react'
import { RankBadge, RankRing } from '@/components/game/RankBadge'
import { SEED_LEADERBOARD } from '@/lib/seed-data'
import { formatNumber, getInitials, timeAgo, rankLabel } from '@/lib/utils'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: { username: string }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  return { title: `${params.username}'s Profile` }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params

  // For "me" — redirect to auth'd user profile (placeholder for now)
  // In production: fetch user from Supabase by username
  const isMe = username === 'me'
  const userData = SEED_LEADERBOARD.find(
    (e) => e.username.toLowerCase() === username.toLowerCase()
  ) ?? (isMe ? SEED_LEADERBOARD[0] : null)

  if (!userData && !isMe) notFound()
  if (!userData) notFound()

  const displayName = userData.displayName ?? userData.username

  const ACTIVITY = [
    { text: `Ranked #${userData.rank} globally`, date: '2024-03-08' },
    { text: 'Beat Alan\'s score in Flappy Stokes', date: '2024-03-05' },
    { text: 'Reached Elite rank', date: '2024-03-01' },
    { text: 'Joined StokeGames', date: '2024-01-15' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
        {/* Banner gradient */}
        <div
          className="h-24 sm:h-32"
          style={{
            background: 'linear-gradient(135deg, rgba(255,61,0,0.3) 0%, rgba(255,107,53,0.1) 50%, transparent 100%)',
          }}
        />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            <RankRing tier={userData.rankTier} size={72}>
              {userData.avatarUrl ? (
                <Image
                  src={userData.avatarUrl}
                  alt={displayName}
                  width={72}
                  height={72}
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl text-[var(--text-secondary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {getInitials(userData.displayName, userData.username)}
                </div>
              )}
            </RankRing>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1
                  className="text-3xl text-white"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  {displayName.toUpperCase()}
                </h1>
                <RankBadge tier={userData.rankTier} size="sm" />
              </div>
              <p className="text-[var(--text-muted)] text-sm flex items-center gap-1.5">
                <Calendar size={12} />
                Playing since Jan 2024
              </p>
            </div>
            {isMe && (
              <Link
                href="/profile/me/edit"
                className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-white transition-all"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'TOTAL XP',   value: formatNumber(userData.xp ?? 0), icon: <Star size={14} className="text-[var(--gold)]" /> },
          { label: 'GAMES',      value: String(userData.gamesPlayed ?? 0), icon: <Gamepad2 size={14} className="text-[#4A9EFF]" /> },
          { label: 'GLOBAL RANK', value: `#${userData.rank}`, icon: <Trophy size={14} className="text-[var(--accent-primary)]" /> },
          { label: 'RANK TIER',  value: rankLabel(userData.rankTier).toUpperCase(), icon: <Zap size={14} className="text-[var(--accent-secondary)]" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs mb-1"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
              {icon}
              {label}
            </div>
            <p className="score-number text-xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="md:col-span-2">
          <h2 className="text-xl text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            ACTIVITY
          </h2>
          <div className="space-y-3">
            {ACTIVITY.map(({ text, date }, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] text-sm">{text}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">{timeAgo(date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trophies / Badges */}
        <div>
          <h2 className="text-xl text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            TROPHIES
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '🏆', label: 'Top 10' },
              { emoji: '⚡', label: 'Challenge' },
              { emoji: '🔥', label: '7-Day Streak' },
              { emoji: '💎', label: 'Diamond Run' },
              { emoji: '👑', label: 'Season 1' },
            ].map(({ emoji, label }) => (
              <div
                key={label}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center"
                title={label}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-[var(--text-muted)] text-[10px] tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {label.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
