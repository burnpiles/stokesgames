export const PEANUTS_CONFIG = {
  gameTime: 45,           // seconds
  gravity: 0.28,          // slightly lower so peanuts arc nicely
  peanutRadius: 6,
  spawnRate: 1.5,         // peanuts per frame from nozzle (1.5 = probabilistic ~50% of original 3)
  blowerSpeed: 14,        // initial launch velocity
  bounceDamp: 0.65,       // elastic bounces so ricochets feel satisfying
  maxScore: 9999,
}
