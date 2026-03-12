export const RUNNER_CONFIG = {
  gravity: 0.6,
  jumpStrength: -14,
  doubleJumpStrength: -11,
  initialSpeed: 5,
  speedIncrement: 0.001,  // per frame
  maxSpeed: 14,
  groundY: 0.75,          // fraction of canvas height
  playerWidth: 40,
  playerHeight: 48,
  maxScore: 999999,

  obstacles: [
    { width: 24, height: 48, color: '#FF3D00', label: '⬛' },  // short barrier
    { width: 20, height: 72, color: '#CC3100', label: '⬛' },  // tall barrier
    { width: 48, height: 32, color: '#FF6B35', label: '⬛' },  // wide low barrier
  ],

  colors: {
    bg: '#0A0A0A',
    ground: '#1A0800',
    groundLine: '#FF3D00',
    player: '#FF3D00',
    playerDetail: '#FF6B35',
    obstacle: '#8B0000',
    obstacleAccent: '#FF3D00',
    score: '#FFFFFF',
    sky: ['#0A0A1A', '#1A0A2E'],
  },
}
