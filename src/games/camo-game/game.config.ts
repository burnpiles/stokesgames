export const CAMO_CONFIG = {
  rounds: 5,
  placeTime: 5,     // seconds to position yourself
  scanSpeed: 0.4,   // scanner width as fraction of canvas per second
  maxScore: 500,    // per round
}

// 5 environments: name, primary BG colors, descriptions of safe zones
export const CAMO_LEVELS = [
  { name: 'JUNGLE',   bg1: '#0A2010', bg2: '#143A14', accent: '#1A5A1A', label: 'Hide in the shadows' },
  { name: 'DESERT',   bg1: '#3A2A0A', bg2: '#5A3A10', accent: '#2A1A05', label: 'Blend into the dunes' },
  { name: 'ARCTIC',   bg1: '#AAC8D4', bg2: '#C8DDE8', accent: '#8AABB8', label: 'Find the shadows' },
  { name: 'URBAN',    bg1: '#1A1A1A', bg2: '#252525', accent: '#111111', label: 'Hide in the dark' },
  { name: 'FOREST',   bg1: '#0A1A05', bg2: '#122012', accent: '#060E03', label: 'Disappear in the trees' },
]
