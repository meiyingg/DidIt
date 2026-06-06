import { useId } from 'react'

interface Props {
  size?: number
  className?: string
}

/** Subtle dotted background. Place inside a `position: relative` container. */
export default function DotPattern({ size = 18, className = '' }: Props) {
  const id = useId()
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x={0} y={0}>
          <circle cx={1} cy={1} r={1} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
