import { NextRequest, NextResponse } from 'next/server'
import { SEED_LEADERBOARD } from '@/lib/seed-data'

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { searchParams } = req.nextUrl
  const limit  = parseInt(searchParams.get('limit') ?? '50', 10)
  const userId = searchParams.get('userId')
  const { gameId } = params

  // TODO: query Supabase scores table filtered by game_id
  // For now, seed leaderboard doesn't have per-game filtering, serve all
  const data = SEED_LEADERBOARD.slice(0, limit)

  let userEntry = null
  if (userId) {
    userEntry = data.find((e) => e.userId === userId) ?? null
  }

  return NextResponse.json({ data, total: data.length, gameId, userEntry })
}
