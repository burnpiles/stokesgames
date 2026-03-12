export const DODGE_CONFIG = {
  playerWidth: 48,
  playerHeight: 48,
  playerSpeed: 6,
  lives: 3,
  spawnInterval: 1200,  // ms between spawns
  spawnIntervalMin: 400,
  spawnDecrement: 15,   // ms faster per 5 seconds
  itemFallSpeed: 3,
  itemFallSpeedMax: 9,
  speedIncrement: 0.002, // per frame
  maxScore: 99999,

  items: {
    bad:  ['💀', '🔴', '⚡', '🪨', '❌'],
    good: ['⭐', '💰', '💎', '🔥', '✅'],
  },

  colors: {
    bg: '#0A0A0A',
    player: '#FF3D00',
    playerGlow: 'rgba(255,61,0,0.4)',
    badItem: '#FF4444',
    goodItem: '#FFD700',
    livesActive: '#FF3D00',
    livesEmpty: '#333333',
  },
}
