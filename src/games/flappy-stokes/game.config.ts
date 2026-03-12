export const GAME_CONFIG = {
  gravity:      0.5,
  flapStrength: -9,
  maxFallSpeed: 12,

  pipe: {
    widthRatio:       0.12,   // fraction of canvas width
    speedInitial:     3,
    speedIncrement:   0.1,    // per pipe passed
    gapInitial:       180,
    gapDecrement:     2,      // px per pipe, min 120
    gapMin:           120,
    spawnIntervalMs:  1800,
  },

  bird: {
    x:        0.2,            // fraction of canvas width
    radius:   18,
    rotateUp: -30,            // degrees when flapping
    rotateDown: 70,           // degrees when falling fast
  },

  ground: {
    heightRatio: 0.12,
  },

  milestones: [10, 25, 50, 100],

  character: {
    alex: {
      color:      '#1E90FF',  // blue
      bodyColor:  '#2060DD',  // darker blue body
      emoji:      '🧑',
      label:      'ALEX',
    },
    alan: {
      color:      '#CC0000',  // red
      bodyColor:  '#FF3D00',  // red body
      emoji:      '👦',
      label:      'ALAN',
    },
  },

  pipes: {
    color:        '#8B0000',
    borderColor:  '#FF3D00',
    labelColor:   '#FF6B35',
    label:        'SG',
  },

  background: {
    skyTop:    '#0A0A1A',
    skyBottom: '#1A0A2E',
    groundColor: '#1A0A00',
    groundLine: '#FF3D00',
  },
} as const

export type CharacterKey = 'alex' | 'alan'
