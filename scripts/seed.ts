/**
 * Seed script — populates Supabase with initial data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ── Seed data ──────────────────────────────────────────────────────────────

const GAMES = [
  {
    slug: 'flappy-stokes',
    title: 'Flappy Stokes',
    description: 'Dodge the obstacles as Alex or Alan. One tap. No mercy.',
    thumbnail_url: 'https://placehold.co/800x450/161616/FF3D00?text=Flappy+Stokes',
    embed_url: '/games/built-in/flappy-stokes',
    type: 'builtin',
    categories: ['SPEED'],
    badges: ['TWIN_PICK', 'EXCLUSIVE'],
    stokes_score: 91,
    alex_rating: 4.5,
    alan_rating: 5.0,
    alex_review: 'This game is actually hard lol',
    alan_review: "I got 47 on my first try. Beat that.",
    fan_score: 89,
    total_plays: 142400,
    active_players: 312,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: true,
    max_score: 9999,
    release_date: '2024-01-15',
  },
  {
    slug: 'twin-trivia',
    title: 'Twin Trivia',
    description: 'Rapid-fire trivia about the Stokes Twins. How well do you know them?',
    thumbnail_url: 'https://placehold.co/800x450/161616/FF6B35?text=Twin+Trivia',
    embed_url: 'https://example.com/twin-trivia',
    type: 'iframe',
    categories: ['STRATEGY'],
    badges: ['HOT', 'TWIN_PICK'],
    stokes_score: 78,
    alex_rating: 4.0,
    alan_rating: 4.0,
    alex_review: 'Some of these questions are HARD. We got most of them right tho.',
    alan_review: 'Alex barely passed. I got a perfect score.',
    fan_score: 82,
    total_plays: 87200,
    active_players: 145,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: false,
    max_score: 10000,
    release_date: '2024-02-01',
  },
  {
    slug: 'stokes-runner',
    title: 'Stokes Runner',
    description: 'Infinite side-scroller. Run, jump, survive. How far can you go?',
    thumbnail_url: 'https://placehold.co/800x450/161616/A855F7?text=Stokes+Runner',
    embed_url: 'https://example.com/stokes-runner',
    type: 'iframe',
    categories: ['SPEED', 'CHAOTIC'],
    badges: ['HOT', 'NEW'],
    stokes_score: 85,
    alex_rating: 5.0,
    alan_rating: 4.5,
    alex_review: "I literally cannot stop playing this. Send help.",
    alan_review: 'Alex has a problem. The game is great though.',
    fan_score: 88,
    total_plays: 203800,
    active_players: 489,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: false,
    max_score: 999999,
    release_date: '2024-03-01',
  },
  {
    slug: 'face-dodge',
    title: 'Face Dodge',
    description: "Dodge falling objects, collect power-ups. Don't let them hit your face.",
    thumbnail_url: 'https://placehold.co/800x450/161616/4A9EFF?text=Face+Dodge',
    embed_url: 'https://example.com/face-dodge',
    type: 'iframe',
    categories: ['CHAOTIC'],
    badges: ['NEW'],
    stokes_score: 72,
    alex_rating: 3.5,
    alan_rating: 4.0,
    alex_review: 'Fun chaos. Gets insane fast.',
    alan_review: 'Very chaotic. I love it.',
    fan_score: 75,
    total_plays: 54100,
    active_players: 76,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: false,
    max_score: 50000,
    release_date: '2024-03-10',
  },
  {
    slug: 'twin-reaction',
    title: 'Twin Reaction',
    description: 'Reaction time challenge. Tap when prompted. Faster than the twins?',
    thumbnail_url: 'https://placehold.co/800x450/161616/00FF94?text=Twin+Reaction',
    embed_url: 'https://example.com/twin-reaction',
    type: 'iframe',
    categories: ['SPEED'],
    badges: ['CHALLENGE'],
    stokes_score: 80,
    alex_rating: 4.0,
    alan_rating: 4.5,
    alex_review: 'My reaction time is elite. Alan disagrees.',
    alan_review: 'I am FASTER. The numbers prove it.',
    fan_score: 79,
    total_plays: 38600,
    active_players: 54,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: false,
    max_score: 1000,
    release_date: '2024-02-20',
  },
  {
    slug: 'stokes-snake',
    title: 'Stokes Snake',
    description: 'Classic Snake, StokeGames branded. Grow longer. Avoid yourself.',
    thumbnail_url: 'https://placehold.co/800x450/161616/FFD700?text=Stokes+Snake',
    embed_url: 'https://example.com/stokes-snake',
    type: 'iframe',
    categories: ['STRATEGY'],
    badges: [],
    stokes_score: 68,
    alex_rating: 3.5,
    alan_rating: 3.0,
    alex_review: 'Nostalgic. Relaxing. Gets hard fast.',
    alan_review: 'Classic vibes.',
    fan_score: 71,
    total_plays: 29300,
    active_players: 31,
    is_instant_play: true,
    is_mobile: true,
    is_active: true,
    is_exclusive: false,
    max_score: 500,
    release_date: '2024-01-28',
  },
]

const FAKE_USERS = Array.from({ length: 10 }, (_, i) => ({
  clerk_id: `seed_user_${i + 1}`,
  username: ['TwinSlayer99', 'AlanIsGoated', 'StokesOrDie', 'FlappyKing', 'ReactionGod',
    'StokesFan2024', 'alexfanatic', 'GoldenRunner', 'PixelWarrior', 'NewChallenger'][i],
  display_name: ['TwinSlayer99', 'Alan Is Goated', 'StokesOrDie', 'FlappyKing', 'Reaction God',
    'StokesFan2024', 'alexfanatic', 'Golden Runner', 'Pixel Warrior', 'New Challenger'][i],
  xp: [142500, 138200, 124800, 98400, 76200, 64100, 42300, 38700, 31200, 14800][i],
  rank_tier: ['STOKEMASTER', 'STOKEMASTER', 'TWIN-LEVEL', 'TWIN-LEVEL', 'ELITE',
    'ELITE', 'CONTENDER', 'CONTENDER', 'CONTENDER', 'ROOKIE'][i],
}))

// ── Run ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Seeding StokeGames...\n')

  // 1. Games
  console.log('  → Inserting games...')
  const { data: gamesData, error: gamesError } = await supabase
    .from('games')
    .upsert(GAMES, { onConflict: 'slug' })
    .select('id, slug')

  if (gamesError) {
    console.error('  ❌  Games error:', gamesError.message)
    return
  }
  console.log(`  ✅  ${gamesData?.length ?? 0} games inserted`)

  // 2. Users
  console.log('\n  → Inserting fake users...')
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .upsert(FAKE_USERS, { onConflict: 'clerk_id' })
    .select('id, username')

  if (usersError) {
    console.error('  ❌  Users error:', usersError.message)
    return
  }
  console.log(`  ✅  ${usersData?.length ?? 0} users inserted`)

  // 3. Scores — random scores for each user across all games
  const flappyGame = gamesData?.find((g) => g.slug === 'flappy-stokes')
  if (flappyGame && usersData) {
    console.log('\n  → Inserting scores...')
    const scores = usersData.map((user, i) => ({
      user_id: user.id,
      game_id: flappyGame.id,
      score: Math.floor(Math.random() * 9000) + 1000,
      metadata: { character: i % 2 === 0 ? 'alex' : 'alan' },
    }))
    const { error: scoresError } = await supabase.from('scores').upsert(scores)
    if (scoresError) {
      console.error('  ❌  Scores error:', scoresError.message)
    } else {
      console.log(`  ✅  ${scores.length} scores inserted`)
    }
  }

  // 4. Challenge
  if (flappyGame) {
    console.log('\n  → Inserting challenge...')
    const { error: challengeError } = await supabase.from('challenges').upsert(
      [
        {
          game_id: flappyGame.id,
          title: 'Flappy Stokes Challenge',
          alex_score: 24800,
          alan_score: 31200,
          alex_quote: 'I got 24,800 on my first serious attempt. Top that.',
          alan_quote: "31,200. I told y'all I'm better. Prove me wrong.",
          prize_description: 'Stokes Twins signed merch pack + shoutout on stream',
          starts_at: new Date(Date.now() - 86400000).toISOString(),
          ends_at: new Date(Date.now() + 5 * 86400000).toISOString(),
          is_active: true,
          winner_count: 47,
        },
      ],
      { onConflict: 'game_id' }
    )
    if (challengeError) {
      console.error('  ❌  Challenge error:', challengeError.message)
    } else {
      console.log('  ✅  Challenge inserted')
    }
  }

  console.log('\n🎮  Seed complete!')
}

seed().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
