import { NextRequest, NextResponse } from 'next/server'
import { SEED_LEADERBOARD } from '@/lib/seed-data'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)

  // TODO: query Redis weekly sorted set (reset every Monday)
  // Return shuffled subset for demo
  const data = [...SEED_LEADERBOARD]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  return NextResponse.json({ data, total: data.length })
}
