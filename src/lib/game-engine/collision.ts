export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Circle {
  x: number
  y: number
  r: number
}

/** AABB collision */
export function rectsCollide(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

/** Circle vs AABB */
export function circleRectCollide(c: Circle, r: Rect): boolean {
  const nearX = Math.max(r.x, Math.min(c.x, r.x + r.w))
  const nearY = Math.max(r.y, Math.min(c.y, r.y + r.h))
  const dx = c.x - nearX
  const dy = c.y - nearY
  return dx * dx + dy * dy < c.r * c.r
}
