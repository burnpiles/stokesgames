export const REACTION_CONFIG = {
  rounds: 5,
  minDelay: 1000,   // ms before signal
  maxDelay: 4000,   // ms before signal
  tooEarlyPenalty: 500, // ms added to score if tapped too early
  maxScore: 10000,  // practically unreachable (would need 0ms reaction each round)
  // Score formula: 1000000 / averageMs (capped at maxScore)
  // A 200ms avg reaction = score of 5000 — very good
  // A 400ms avg reaction = score of 2500 — average
  scoreMultiplier: 200000, // sum of (1000/reactionMs) * multiplier
}

export const REACTION_SIGNALS = [
  { bg: '#FF3D00', label: 'GO!',    emoji: '🔥' },
  { bg: '#00FF94', label: 'NOW!',   emoji: '⚡' },
  { bg: '#FFD700', label: 'TAP!',   emoji: '👆' },
  { bg: '#A855F7', label: 'HIT IT!',emoji: '🎯' },
  { bg: '#4A9EFF', label: 'REACT!', emoji: '💥' },
]
