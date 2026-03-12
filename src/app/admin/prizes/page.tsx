import type { Metadata } from 'next'
import { Gift, Plus } from 'lucide-react'
import Link from 'next/link'
import { SEED_CHALLENGE } from '@/lib/seed-data'

export const metadata: Metadata = { title: 'Prizes' }

export default function AdminPrizesPage() {
  const prizes = SEED_CHALLENGE
    ? [
        {
          id: 'p1',
          challengeTitle: SEED_CHALLENGE.title,
          description: SEED_CHALLENGE.prizeDescription,
          imageUrl: SEED_CHALLENGE.prizeImageUrl,
          endsAt: SEED_CHALLENGE.endsAt,
          winnerCount: SEED_CHALLENGE.winnerCount,
        },
      ]
    : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            PRIZES
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Manage challenge prizes and rewards</p>
        </div>
        <Link
          href="/admin/prizes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
        >
          <Plus size={16} />
          ADD PRIZE
        </Link>
      </div>

      {prizes.length > 0 ? (
        <div className="grid gap-4 max-w-2xl">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center shrink-0">
                  <Gift size={24} className="text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {prize.challengeTitle}
                  </p>
                  <p className="text-white font-medium mb-3">{prize.description}</p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>
                      <span className="text-[var(--success)]">{prize.winnerCount}</span> winners
                    </span>
                    <span>Ends {new Date(prize.endsAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <Gift size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">No prizes configured. Add prizes to active challenges.</p>
        </div>
      )}
    </div>
  )
}
