import { NextRequest, NextResponse } from 'next/server'
import { SEED_LEADERBOARD, SEED_CHALLENGE } from '@/lib/seed-data'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit  = parseInt(searchParams.get('limit') ?? '50', 10)
  const userId = searchParams.get('userId')

  // TODO: query Supabase challenge_entries joined with users
  const data = SEED_LEADERBOARD.slice(0, limit)

  let userEntry = null
  if (userId) {
    userEntry = data.find((e) => e.userId === userId) ?? null
  }

  return NextResponse.json({
    data,
    total: data.length,
    challenge: SEED_CHALLENGE,
    userEntry,
  })
}
