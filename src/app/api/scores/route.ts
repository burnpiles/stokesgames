import { NextRequest, NextResponse } from 'next/server'
import { SEED_GAMES } from '@/lib/seed-data'

/** POST /api/scores — submit a score */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gameId, score, metadata } = body

    if (!gameId || typeof score !== 'number') {
      return NextResponse.json({ error: 'gameId and score are required' }, { status: 400 })
    }

    // Anti-cheat: validate score is within plausible range
    const game = SEED_GAMES.find((g) => g.id === gameId)
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const sanitized = Math.floor(score)
    if (sanitized <= 0 || sanitized > game.maxScore) {
      return NextResponse.json({ error: 'Score out of valid range' }, { status: 422 })
    }

    // TODO: check Clerk auth, get userId from session
    // TODO: insert into Supabase scores table
    // TODO: update Redis leaderboard sorted set
    // TODO: award XP to user

    // Mock response
    const rank = Math.floor(Math.random() * 500) + 1
    return NextResponse.json({
      data: {
        id: Math.random().toString(36).slice(2),
        gameId,
        score: sanitized,
        rank,
        isPersonalBest: true,
      },
      rank,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/** GET /api/scores — query scores */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const gameId = searchParams.get('gameId')
  const userId = searchParams.get('userId')
  const limit  = parseInt(searchParams.get('limit') ?? '50', 10)

  // TODO: query Supabase
  return NextResponse.json({ data: [], total: 0 })
}
