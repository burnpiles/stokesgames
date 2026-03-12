// ─── Core Domain Types ───────────────────────────────────────────────────────

export type RankTier =
  | 'ROOKIE'
  | 'CONTENDER'
  | 'ELITE'
  | 'TWIN-LEVEL'
  | 'STOKEMASTER'

export type GameBadge = 'NEW' | 'HOT' | 'TWIN_PICK' | 'EXCLUSIVE' | 'CHALLENGE'

export type GameCategory =
  | 'SPEED'
  | 'STRATEGY'
  | 'CHAOTIC'
  | 'SPOOKY'
  | 'MULTIPLAYER'
  | 'TWIN_PICKS'

export type GameType = 'builtin' | 'embedded' | 'self-hosted'

export type ScoreSource = 'web' | 'youtube_playables'

// ─── Game ────────────────────────────────────────────────────────────────────

export interface Game {
  id: string
  slug: string
  title: string
  description: string
  thumbnailUrl: string
  embedUrl: string
  categories: GameCategory[]
  stokesScore: number        // 0-100 composite
  alexRating: number         // 1.0-5.0
  alanRating: number
  alexReview: string | null
  alanReview: string | null
  fanScore: number           // 0-100 community average
  totalPlays: number
  activePlayers?: number     // realtime
  badges: GameBadge[]
  isInstantPlay: boolean
  isMobile: boolean
  isActive: boolean
  isExclusive: boolean
  maxScore: number
  releaseDate: string
  createdAt: string
  type?: GameType
  videoUrl?: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  clerkId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  xp: number
  rankTier: RankTier
  createdAt: string
  isBanned: boolean
}

// ─── Score ────────────────────────────────────────────────────────────────────

export interface Score {
  id: string
  userId: string
  gameId: string
  score: number
  isPersonalBest: boolean
  source: ScoreSource
  metadata?: Record<string, unknown>
  createdAt: string
  // Joined
  user?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'rankTier'>
  game?: Pick<Game, 'id' | 'slug' | 'title' | 'thumbnailUrl'>
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  rankTier: RankTier
  score: number
  xp?: number
  gamesPlayed?: number
  createdAt: string
  isCurrentUser?: boolean
  metadata?: Record<string, unknown>
}

// ─── Challenge ────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string
  gameId: string
  title: string
  alexScore: number
  alanScore: number
  alexQuote: string | null
  alanQuote: string | null
  prizeDescription: string | null
  prizeImageUrl: string | null
  startsAt: string
  endsAt: string
  isActive: boolean
  winnerCount: number
  createdAt: string
  game?: Pick<Game, 'id' | 'slug' | 'title' | 'thumbnailUrl'>
}

export interface ChallengeEntry {
  id: string
  challengeId: string
  userId: string
  score: number
  beatAlex: boolean
  beatAlan: boolean
  prizeFulfilled: boolean
  createdAt: string
  user?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'rankTier'>
}

// ─── Badge / Achievement ───────────────────────────────────────────────────────

export interface UserBadge {
  id: string
  userId: string
  badgeType: string
  badgeData: Record<string, unknown> | null
  earnedAt: string
}

// ─── Claim Token ──────────────────────────────────────────────────────────────

export interface ScoreToken {
  gameId: string
  gameSlug: string
  score: number
  iat: number
  exp: number
  metadata?: Record<string, unknown>
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}
