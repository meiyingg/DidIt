import { useMemo } from 'react'

/** Global, non-interactive falling-leaves particle layer. */
export default function LeavesOverlay() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 16 + Math.random() * 14,
        fall: 9 + Math.random() * 8,
        sway: 2 + Math.random() * 2.5,
        delay: -Math.random() * 16,
        opacity: 0.5 + Math.random() * 0.4,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {leaves.map((l) => (
        <span
          key={l.id}
          className="absolute -top-[6%]"
          style={{ left: `${l.left}%`, animation: `leaf-fall ${l.fall}s linear ${l.delay}s infinite` }}
        >
          <img
            src="/assets/leaf.png"
            alt=""
            className="block object-contain"
            style={{
              width: l.size,
              opacity: l.opacity,
              animation: `leaf-sway ${l.sway}s ease-in-out infinite alternate`,
            }}
          />
        </span>
      ))}
    </div>
  )
}
