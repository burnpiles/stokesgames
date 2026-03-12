export const SNAKE_CONFIG = {
  gridSize: 20,        // cells per row/col
  cellSize: 24,        // px per cell (scaled dynamically)
  initialSpeed: 150,   // ms per move
  speedIncrement: 2,   // ms faster per food eaten
  minSpeed: 60,        // fastest possible
  pointsPerFood: 10,
  maxScore: 5000,      // ~500 food items — effectively unlimited
  colors: {
    bg: '#0D0D0D',
    grid: '#1E1E2E',
    gridBorder: '#FF3D00',
    snake: '#FF3D00',
    snakeHead: '#FF6B35',
    food: '#FFD700',
    wall: '#2A2A3E',
  },
}
