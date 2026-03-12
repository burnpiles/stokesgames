'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Eye, EyeOff, Search } from 'lucide-react'
import { SEED_GAMES } from '@/lib/seed-data'
import { formatNumber } from '@/lib/utils'
import type { Game } from '@/types'

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>(SEED_GAMES)
  const [q, setQ] = useState('')

  const filtered = q
    ? games.filter((g) => g.title.toLowerCase().includes(q.toLowerCase()))
    : games

  function toggleActive(id: string) {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g))
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            GAMES
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">{games.length} games in the library</p>
        </div>
        <Link
          href="/admin/games/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
        >
          <Plus size={16} />
          ADD GAME
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games..."
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
        />
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Title', 'Type', 'Plays', 'Score', 'Badges', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[var(--text-muted)] text-xs tracking-wider"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((game) => (
              <tr
                key={game.id}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{game.title}</p>
                    <p className="text-[var(--text-muted)] text-xs">{game.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {game.type ?? 'iframe'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatNumber(game.totalPlays)}</td>
                <td className="px-4 py-3">
                  <span
                    style={{
                      color: game.stokesScore >= 80 ? 'var(--success)' : game.stokesScore >= 60 ? 'var(--warning)' : 'var(--error)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {game.stokesScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {game.badges.map((b) => (
                      <span
                        key={b}
                        className="text-xs px-1.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(game.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                      game.isActive
                        ? 'bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20'
                        : 'bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20'
                    }`}
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}
                  >
                    {game.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    {game.isActive ? 'LIVE' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    <Edit2 size={12} />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
