'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { stokesScoreColor } from '@/lib/utils'

interface StokesScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
}

const SIZES = {
  sm:  { outer: 40, stroke: 3,  text: 12, ring: 34 },
  md:  { outer: 56, stroke: 4,  text: 16, ring: 48 },
  lg:  { outer: 80, stroke: 5,  text: 22, ring: 70 },
  xl:  { outer: 120, stroke: 7, text: 34, ring: 106 },
}

/**
 * Circular Stokes Score badge — styled like Rotten Tomatoes.
 * Green >70, Yellow 50-70, Red <50
 */
export function StokesScore({
  score,
  size = 'md',
  animated = true,
  className,
}: StokesScoreProps) {
  const s = SIZES[size]
  const color = stokesScoreColor(score)
  const radius = (s.ring - s.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!animated || !circleRef.current) return
    const circle = circleRef.current
    circle.style.strokeDashoffset = `${circumference}`
    requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
      circle.style.strokeDashoffset = `${dashOffset}`
    })
  }, [score, animated, circumference, dashOffset])

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: s.outer, height: s.outer }}
      role="img"
      aria-label={`Stokes Score: ${score} out of 100`}
    >
      <svg
        width={s.outer}
        height={s.outer}
        viewBox={`0 0 ${s.outer} ${s.outer}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={s.stroke}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : dashOffset}
          style={{
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      </svg>
      {/* Score number */}
      <span
        className="absolute score-number"
        style={{
          fontSize: s.text,
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  )
}
