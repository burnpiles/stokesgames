import { NextResponse } from 'next/server'
import { SEED_CHALLENGE } from '@/lib/seed-data'

export async function GET() {
  // TODO: query Supabase challenges table where is_active = true
  const challenge = SEED_CHALLENGE
  if (!challenge.isActive) {
    return NextResponse.json({ data: null })
  }
  return NextResponse.json({ data: challenge })
}
