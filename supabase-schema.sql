-- StokeGames.com — Supabase Schema
-- Run this in the Supabase SQL editor

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT UNIQUE NOT NULL,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  xp           INTEGER DEFAULT 0,
  rank_tier    TEXT DEFAULT 'ROOKIE',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  is_banned    BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS users_clerk_id_idx  ON users(clerk_id);
CREATE INDEX IF NOT EXISTS users_username_idx  ON users(username);
CREATE INDEX IF NOT EXISTS users_xp_idx        ON users(xp DESC);

-- ─── Games ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  embed_url     TEXT NOT NULL,
  categories    TEXT[],
  stokes_score  INTEGER,          -- 0-100 composite
  alex_rating   DECIMAL(2,1),     -- 1.0-5.0
  alan_rating   DECIMAL(2,1),
  alex_review   TEXT,
  alan_review   TEXT,
  fan_score     INTEGER DEFAULT 0,
  total_plays   INTEGER DEFAULT 0,
  badges        TEXT[],
  is_active     BOOLEAN DEFAULT TRUE,
  is_exclusive  BOOLEAN DEFAULT FALSE,
  max_score     BIGINT DEFAULT 999999,
  release_date  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS games_slug_idx    ON games(slug);
CREATE INDEX IF NOT EXISTS games_active_idx  ON games(is_active) WHERE is_active = TRUE;

-- ─── Scores ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id          UUID REFERENCES games(id) ON DELETE CASCADE,
  score            BIGINT NOT NULL,
  is_personal_best BOOLEAN DEFAULT FALSE,
  source           TEXT DEFAULT 'web',    -- 'web' | 'youtube_playables'
  metadata         JSONB,                  -- { character: 'alex'|'alan', etc. }
  claim_token      TEXT,                   -- for YouTube handoff (one-time use)
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scores_user_game_idx  ON scores(user_id, game_id);
CREATE INDEX IF NOT EXISTS scores_game_score_idx ON scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS scores_user_idx       ON scores(user_id);

-- ─── Challenges ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID REFERENCES games(id),
  title             TEXT NOT NULL,
  alex_score        BIGINT,
  alan_score        BIGINT,
  alex_quote        TEXT,
  alan_quote        TEXT,
  prize_description TEXT,
  prize_image_url   TEXT,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  is_active         BOOLEAN DEFAULT FALSE,
  winner_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS challenges_active_idx ON challenges(is_active) WHERE is_active = TRUE;

-- ─── Challenge Entries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  score           BIGINT NOT NULL,
  beat_alex       BOOLEAN DEFAULT FALSE,
  beat_alan       BOOLEAN DEFAULT FALSE,
  prize_fulfilled BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)   -- one entry per user per challenge (best score)
);

CREATE INDEX IF NOT EXISTS challenge_entries_score_idx ON challenge_entries(challenge_id, score DESC);

-- ─── User Badges ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,
  badge_data  JSONB,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE games           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges     ENABLE ROW LEVEL SECURITY;

-- Public read for games
CREATE POLICY "Games are public" ON games FOR SELECT USING (is_active = TRUE);

-- Public read for scores (leaderboard)
CREATE POLICY "Scores are public" ON scores FOR SELECT USING (TRUE);

-- Public read for challenges
CREATE POLICY "Challenges are public" ON challenges FOR SELECT USING (TRUE);

-- Public read for users
CREATE POLICY "Users are public" ON users FOR SELECT USING (is_banned = FALSE);

-- Users can insert their own scores (validated server-side via service role)
CREATE POLICY "Service role can insert scores" ON scores FOR INSERT
  WITH CHECK (TRUE);  -- actual auth check is done in API routes using service role

-- Public read for challenge entries
CREATE POLICY "Challenge entries are public" ON challenge_entries FOR SELECT USING (TRUE);

-- Public read for badges
CREATE POLICY "Badges are public" ON user_badges FOR SELECT USING (TRUE);

-- ─── Seed Data ────────────────────────────────────────────────────────────────
INSERT INTO games (slug, title, description, thumbnail_url, embed_url, categories, badges,
                   is_active, is_exclusive, alex_rating, alan_rating, alex_review, alan_review,
                   fan_score, stokes_score, max_score, release_date)
VALUES
  ('flappy-stokes', 'Flappy Stokes',
   'Dodge the obstacles as Alex or Alan. One tap. No mercy.',
   '/games/flappy-stokes/thumbnail.jpg',
   '/games/built-in/flappy-stokes',
   ARRAY['SPEED'], ARRAY['TWIN_PICK','EXCLUSIVE'],
   TRUE, TRUE, 4.5, 5.0,
   'This game is actually hard lol',
   'I got 47 on my first try. Beat that.',
   89, 91, 9999, NOW()),

  ('twin-trivia', 'Twin Trivia',
   'Rapid-fire trivia about the Stokes Twins. How well do you know them?',
   '/games/twin-trivia/thumbnail.jpg',
   'https://example.com/twin-trivia',
   ARRAY['STRATEGY'], ARRAY['HOT','TWIN_PICK'],
   TRUE, FALSE, 4.0, 4.0,
   'Some of these questions are HARD.',
   'I got a perfect score.',
   82, 78, 10000, NOW()),

  ('stokes-runner', 'Stokes Runner',
   'Infinite side-scroller. Run, jump, survive. How far can you go?',
   '/games/stokes-runner/thumbnail.jpg',
   'https://example.com/stokes-runner',
   ARRAY['SPEED','CHAOTIC'], ARRAY['HOT','NEW'],
   TRUE, FALSE, 5.0, 4.5,
   'I literally cannot stop playing this.',
   'The game is great.',
   88, 85, 999999, NOW())
ON CONFLICT (slug) DO NOTHING;
