import { NextRequest, NextResponse } from 'next/server'
import { SEED_GAMES } from '@/lib/seed-data'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const badge    = searchParams.get('badge')
  const slug     = searchParams.get('slug')
  const q        = searchParams.get('q')
  const sort     = searchParams.get('sort') ?? 'trending'
  const limit    = parseInt(searchParams.get('limit') ?? '50', 10)

  // TODO: replace with Supabase query
  let games = [...SEED_GAMES]

  if (slug)     games = games.filter((g) => g.slug === slug)
  if (category) games = games.filter((g) => g.categories.includes(category as any))
  if (badge)    games = games.filter((g) => g.badges.includes(badge as any))
  if (q) {
    const lq = q.toLowerCase()
    games = games.filter(
      (g) => g.title.toLowerCase().includes(lq) || g.description.toLowerCase().includes(lq)
    )
  }

  if (sort === 'rating')  games.sort((a, b) => b.stokesScore - a.stokesScore)
  if (sort === 'newest')  games.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  if (sort === 'plays')   games.sort((a, b) => b.totalPlays - a.totalPlays)

  return NextResponse.json({ data: games.slice(0, limit), total: games.length })
}
