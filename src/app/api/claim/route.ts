import { NextRequest, NextResponse } from 'next/server'
import { verifyScoreToken } from '@/lib/score-token'
import { SEED_GAMES } from '@/lib/seed-data'

/** GET /api/claim?token=... — verify a score claim token */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const payload = await verifyScoreToken(token)
    const game = SEED_GAMES.find((g) => g.id === payload.gameId)

    return NextResponse.json({
      data: {
        token: payload,
        gameTitle: game?.title ?? payload.gameSlug,
      },
    })
  } catch (err: any) {
    const isExpired = err?.code === 'ERR_JWT_EXPIRED'
    return NextResponse.json(
      { error: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' },
      { status: 401 }
    )
  }
}

/** POST /api/claim — claim a score (auth required) */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const payload = await verifyScoreToken(token)

    // TODO: get userId from Clerk auth session
    // TODO: insert score into Supabase
    // TODO: mark claim_token as used (one-time claim)
    // TODO: award XP

    return NextResponse.json({
      data: {
        score: payload.score,
        gameId: payload.gameId,
        claimed: true,
      },
    })
  } catch (err: any) {
    const isExpired = err?.code === 'ERR_JWT_EXPIRED'
    return NextResponse.json(
      { error: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' },
      { status: 401 }
    )
  }
}
