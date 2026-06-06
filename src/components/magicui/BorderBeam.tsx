import type { CSSProperties } from 'react'

interface Props {
  size?: number
  duration?: number // seconds
  delay?: number // seconds
  colorFrom?: string
  colorTo?: string
}

/**
 * A gradient streak that travels around the parent's border.
 * Parent must be `position: relative` and have a border radius.
 */
export default function BorderBeam({
  size = 60,
  duration = 6,
  delay = 0,
  colorFrom = '#a78bfa',
  colorTo = '#22d3ee',
}: Props) {
  return (
    <div className="bb-ring">
      <div
        className="bb-beam"
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            '--bb-from': colorFrom,
            '--bb-to': colorTo,
            '--bb-duration': `${duration}s`,
            animationDelay: `${-delay}s`,
          } as CSSProperties
        }
      />
    </div>
  )
}
