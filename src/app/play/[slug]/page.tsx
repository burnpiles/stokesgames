import { notFound } from 'next/navigation'
import { SEED_GAMES } from '@/lib/seed-data'
import { GamePlayer } from '@/components/game/GamePlayer'
import type { Metadata } from 'next'

interface PlayPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  const game = SEED_GAMES.find((g) => g.slug === params.slug)
  return { title: game ? `Playing ${game.title}` : 'Play' }
}

export default function PlayPage({ params }: PlayPageProps) {
  const game = SEED_GAMES.find((g) => g.slug === params.slug)
  if (!game) notFound()

  return <GamePlayer game={game} />
}
