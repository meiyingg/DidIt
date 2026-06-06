import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  decimalPlaces?: number
  duration?: number // ms
  prefix?: string
  className?: string
}

/** Animated count-up that re-animates from the previous value whenever it changes. */
export default function NumberTicker({
  value,
  decimalPlaces = 0,
  duration = 900,
  prefix = '',
  className = '',
}: Props) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(from + (value - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}
    </span>
  )
}
